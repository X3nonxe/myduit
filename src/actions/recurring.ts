"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUserId } from "@/lib/auth-helpers";
import { Frequency, TransactionType } from "@prisma/client";
import { addDays, addWeeks, addMonths, addYears, isAfter } from "date-fns";
import { ERROR_MESSAGES } from "@/lib/constants";

export async function addRecurringTransaction(data: {
    amount: number;
    type: TransactionType;
    category: string;
    description?: string;
    frequency: Frequency;
    start_date: Date;
    end_date?: Date;
    account_id?: string;
}) {
    const userId = await getAuthUserId();
    if (!userId) return { error: ERROR_MESSAGES.SESSION_INVALID };

    try {
        const recurring = await prisma.recurringTransaction.create({
            data: {
                user_id: String(userId),
                amount: data.amount,
                type: data.type,
                category: data.category,
                description: data.description,
                frequency: data.frequency,
                start_date: data.start_date,
                end_date: data.end_date,
                next_run_date: data.start_date,
                account_id: data.account_id,
                is_active: true,
            },
        });

        revalidatePath("/dashboard");
        return { success: true, data: recurring };
    } catch (error) {
        console.error("Failed to add recurring transaction:", error);
        return { error: "Gagal membuat transaksi berulang." };
    }
}

export async function updateRecurringTransaction(id: string, data: {
    amount: number;
    type: TransactionType;
    category: string;
    description?: string;
    frequency: Frequency;
    start_date: Date;
    end_date?: Date;
    account_id?: string;
    is_active?: boolean;
}) {
    const userId = await getAuthUserId();
    if (!userId) return { error: ERROR_MESSAGES.SESSION_INVALID };

    try {
        const recurring = await prisma.recurringTransaction.update({
            where: { id, user_id: String(userId) },
            data: {
                amount: data.amount,
                type: data.type,
                category: data.category,
                description: data.description,
                frequency: data.frequency,
                start_date: data.start_date,
                end_date: data.end_date,
                account_id: data.account_id,
                is_active: data.is_active,
            },
        });

        revalidatePath("/dashboard");
        return { success: true, data: recurring };
    } catch (error) {
        console.error("Failed to update recurring transaction:", error);
        return { error: "Gagal memperbarui transaksi berulang." };
    }
}

export async function deleteRecurringTransaction(id: string) {
    const userId = await getAuthUserId();
    if (!userId) return { error: ERROR_MESSAGES.SESSION_INVALID };

    try {
        await prisma.recurringTransaction.delete({
            where: { id, user_id: String(userId) },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete recurring transaction:", error);
        return { error: "Gagal menghapus transaksi berulang." };
    }
}

export async function getRecurringTransactions() {
    const userId = await getAuthUserId();
    if (!userId) return [];

    try {
        const recurring = await prisma.recurringTransaction.findMany({
            where: { user_id: String(userId) },
            orderBy: { created_at: "desc" },
            include: {
                account: {
                    select: {
                        name: true,
                        type: true,
                    },
                },
            },
        });
        return recurring;
    } catch (error) {
        console.error("Failed to fetch recurring transactions:", error);
        return [];
    }
}

export async function processRecurringTransactions() {
    const userId = await getAuthUserId();
    if (!userId) return { error: ERROR_MESSAGES.SESSION_INVALID };

    const now = new Date();

    const dueTransactions = await prisma.recurringTransaction.findMany({
        where: {
            user_id: String(userId),
            is_active: true,
            next_run_date: {
                lte: now,
            },
        },
    });

    if (dueTransactions.length === 0) {
        return { success: true, processed: 0 };
    }

    let processedCount = 0;

    for (const rt of dueTransactions) {
        await prisma.$transaction(async (tx) => {
            await tx.transaction.create({
                data: {
                    user_id: rt.user_id,
                    account_id: rt.account_id,
                    amount: rt.amount,
                    type: rt.type,
                    category: rt.category,
                    description: rt.description,
                    date: rt.next_run_date,
                },
            });

            let nextDate = new Date(rt.next_run_date);
            switch (rt.frequency) {
                case "DAILY":
                    nextDate = addDays(nextDate, 1);
                    break;
                case "WEEKLY":
                    nextDate = addWeeks(nextDate, 1);
                    break;
                case "MONTHLY":
                    nextDate = addMonths(nextDate, 1);
                    break;
                case "YEARLY":
                    nextDate = addYears(nextDate, 1);
                    break;
            }

            let isActive = true;
            if (rt.end_date && isAfter(nextDate, rt.end_date)) {
                isActive = false;
            }

            await tx.recurringTransaction.update({
                where: { id: rt.id },
                data: {
                    last_run_date: rt.next_run_date,
                    next_run_date: nextDate,
                    is_active: isActive,
                },
            });
        });
        processedCount++;
    }

    if (processedCount > 0) {
        revalidatePath("/dashboard");
    }

    return { success: true, processed: processedCount };
}
