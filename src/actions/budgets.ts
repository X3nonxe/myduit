"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { BudgetInput, budgetSchema } from "@/lib/validation";
import { requireAuth, getAuthUserId } from "@/lib/auth-helpers";
import { ERROR_MESSAGES } from "@/lib/constants";
import { TransactionType } from "@prisma/client";

export async function getBudgets() {
    const userId = await requireAuth();

    const budgets = await prisma.budget.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
    });

    const budgetsWithProgress = await Promise.all(
        budgets.map(async (budget) => {
            const result = await prisma.transaction.aggregate({
                _sum: {
                    amount: true,
                },
                where: {
                    user_id: userId,
                    type: TransactionType.EXPENSE,
                    category: budget.category,
                    date: {
                        gte: budget.start_date,
                        lte: budget.end_date,
                    },
                },
            });

            return {
                ...budget,
                spent: result._sum.amount || 0,
            };
        })
    );

    return budgetsWithProgress;
}

export async function addBudget(data: BudgetInput) {
    const userId = await getAuthUserId();

    if (!userId) return { error: ERROR_MESSAGES.SESSION_INVALID };

    const validatedFields = budgetSchema.safeParse(data);
    if (!validatedFields.success) {
        return { error: "Data tidak valid." };
    }

    const { category, amount, period, start_date, end_date } = validatedFields.data;

    if (!Number.isSafeInteger(amount) || amount > Number.MAX_SAFE_INTEGER || amount === Infinity) {
        return { error: "Jumlah anggaran terlalu besar." };
    }

    if (start_date > end_date) {
        return { error: "Tanggal mulai tidak boleh lebih besar dari tanggal selesai." };
    }
    if (Number.isNaN(amount)) {
        return { error: "Jumlah tidak valid." };
    }

    try {
        const budget = await prisma.budget.create({
            data: {
                category,
                amount,
                period,
                start_date,
                end_date,
                user_id: String(userId),
            },
        });

        revalidatePath("/dashboard");
        return { success: true, data: budget };
    } catch (error: unknown) {
        if (process.env.NODE_ENV !== 'production') {
            console.error("Failed to add budget:", error);
        }
        return { error: "Gagal membuat anggaran." };
    }
}

export async function deleteBudget(id: string) {
    const userId = await getAuthUserId();

    if (!userId) return { error: ERROR_MESSAGES.SESSION_INVALID };

    try {
        await prisma.budget.delete({
            where: { id, user_id: String(userId) },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: unknown) {
        if (process.env.NODE_ENV !== 'production') {
            console.error("Failed to delete budget:", error);
        }
        return { error: "Gagal menghapus anggaran." };
    }
}
