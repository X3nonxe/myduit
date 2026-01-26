"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { BudgetInput, budgetSchema } from "@/lib/validation";
import { SessionUser } from "@/lib/utils";

import { TransactionType } from "@prisma/client";

export async function getBudgets() {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as SessionUser).id;

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
    const session = await getServerSession(authOptions);
    const userId = (session?.user as SessionUser)?.id;

    if (!userId) return { error: "Sesi tidak valid." };

    const validatedFields = budgetSchema.safeParse(data);
    if (!validatedFields.success) {
        return { error: "Data tidak valid." };
    }

    const { amount, start_date, end_date } = validatedFields.data;

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
                ...data,
                user_id: String(userId),
            },
        });

        revalidatePath("/dashboard");
        return { success: true, data: budget };
    } catch (error: unknown) {
        console.error("DEBUG_ERROR: Failed to add budget. UserId:", userId, "Data:", data, "Error:", error);
        return { error: "Gagal membuat anggaran." };
    }
}

export async function deleteBudget(id: string) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as SessionUser)?.id;

    if (!userId) return { error: "Sesi tidak valid." };

    try {
        await prisma.budget.delete({
            where: { id, user_id: String(userId) },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: unknown) {
        console.error("DEBUG_ERROR: Failed to delete budget:", error);
        return { error: "Gagal menghapus anggaran." };
    }
}
