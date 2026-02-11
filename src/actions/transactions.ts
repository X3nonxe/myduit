"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { Prisma, TransactionType } from "@prisma/client";
import { transactionSchema } from "@/lib/validation";
import { requireAuth } from "@/lib/auth-helpers";

export async function addTransaction(data: {
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
  description?: string;
  account_id?: string;
}) {
  const userId = await requireAuth();

  try {
    const validatedFields = transactionSchema.safeParse(data);
    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const { amount, type, category, date, description, account_id } = validatedFields.data;
    const accountId = account_id === "" ? null : account_id;

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const transaction = await tx.transaction.create({
        data: {
          amount,
          type,
          category,
          date,
          description: description || null,
          account_id: accountId,
          user_id: userId,
        },
      });

      if (accountId && type !== TransactionType.TRANSFER) {
        const balanceChange = type === TransactionType.INCOME ? amount : -amount;
        const account = await tx.account.findFirst({
          where: { id: accountId, user_id: userId }
        });
        if (!account) throw new Error("Akun tidak ditemukan.");

        await tx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: balanceChange
            }
          }
        });
      }

      return transaction;
    });

    revalidatePath("/dashboard");
    revalidateTag("dashboard-stats", "default");
    return result;
  } catch (error: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("Failed to add transaction:", error);
    }
    const message = error instanceof Error ? error.message : "Gagal menyimpan transaksi.";
    return { error: message };
  }
}

export async function deleteTransaction(id: string) {
  const userId = await requireAuth();

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const transaction = await tx.transaction.findUnique({
        where: { id },
      });

      if (!transaction || transaction.user_id !== userId) {
        throw new Error("Transaksi tidak ditemukan.");
      }

      if (transaction.account_id && transaction.type !== TransactionType.TRANSFER) {
        const balanceChange = transaction.type === TransactionType.INCOME
          ? -transaction.amount
          : transaction.amount;

        await tx.account.update({
          where: { id: transaction.account_id },
          data: {
            balance: {
              increment: balanceChange
            }
          }
        });
      }

      await tx.transaction.delete({
        where: { id },
      });
    });

    revalidatePath("/dashboard");
    revalidateTag("dashboard-stats", "default");
  } catch (error: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("Failed to delete transaction:", error);
    }
    throw new Error("Gagal menghapus transaksi.");
  }
}

export async function updateTransaction(id: string, data: {
  amount?: number;
  type?: TransactionType;
  category?: string;
  date?: Date;
  description?: string;
}) {
  const userId = await requireAuth();

  try {
    const updateSchema = transactionSchema.partial();
    const validatedFields = updateSchema.safeParse(data);

    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const transaction = await prisma.transaction.update({
      where: { id, user_id: userId },
      data: validatedFields.data,
    });

    revalidatePath("/dashboard");
    revalidateTag("dashboard-stats", "default");
    return transaction;
  } catch (error: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("Failed to update transaction:", error);
    }
    return { error: "Gagal memperbarui transaksi." };
  }
}

export async function getTransactions() {
  const userId = await requireAuth();

  return await prisma.transaction.findMany({
    where: { user_id: userId },
    orderBy: { date: "desc" },
    take: 10,
  });
}

const getCachedDashboardStats = unstable_cache(
  async (userId: string, filter: "week" | "month" | "year") => {
    if (filter === "week") {
      return await prisma.$queryRaw`
        SELECT 
          to_char(date, 'Dy') as name,
          SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END)::FLOAT as income,
          SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END)::FLOAT as expense
        FROM "Transaction"
        WHERE user_id = ${userId} AND to_char(date, 'IYYY-IW') = to_char(CURRENT_DATE, 'IYYY-IW')
        GROUP BY name, date
        ORDER BY MIN(date)
      `;
    } else if (filter === "month") {
      return await prisma.$queryRaw`
        SELECT 
          'Mg ' || (EXTRACT(WEEK FROM date) - EXTRACT(WEEK FROM date_trunc('month', date)) + 1)::TEXT as name,
          SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END)::FLOAT as income,
          SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END)::FLOAT as expense
        FROM "Transaction"
        WHERE user_id = ${userId} 
          AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY name
        ORDER BY name
      `;
    } else {
      return await prisma.$queryRaw`
        SELECT 
          to_char(date, 'Mon') as name,
          SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END)::FLOAT as income,
          SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END)::FLOAT as expense
        FROM "Transaction"
        WHERE user_id = ${userId} 
          AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY name, EXTRACT(MONTH FROM date)
        ORDER BY EXTRACT(MONTH FROM date)
      `;
    }
  },
  ["dashboard-stats"],
  { revalidate: 300, tags: ["dashboard-stats"] }
);

export async function getDashboardStats(filter: "week" | "month" | "year") {
  const userId = await requireAuth();

  const validFilters = ["week", "month", "year"];
  if (!validFilters.includes(filter)) {
    throw new Error("Invalid filter value. Must be 'week', 'month', or 'year'.");
  }

  return getCachedDashboardStats(userId, filter);
}

const getCachedTransactionSummary = unstable_cache(
  async (userId: string) => {
    const totals = await prisma.transaction.groupBy({
      by: ["type"],
      _sum: { amount: true },
      where: { user_id: userId },
    });

    const income = totals.find((t: typeof totals[number]) => t.type === TransactionType.INCOME)?._sum.amount || 0;
    const expense = totals.find((t: typeof totals[number]) => t.type === TransactionType.EXPENSE)?._sum.amount || 0;

    return {
      income,
      expense,
      balance: income - expense,
    };
  },
  ["transaction-summary"],
  { revalidate: 300, tags: ["dashboard-stats"] }
);

export async function getTransactionSummary() {
  const userId = await requireAuth();

  return getCachedTransactionSummary(userId);
}
export async function getAllTransactionsForExport(startDate?: Date, endDate?: Date) {
  const userId = await requireAuth();

  try {
    const whereClause: Prisma.TransactionWhereInput = {
      user_id: userId,
    };

    if (startDate && endDate) {
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      include: {
        account: {
          select: { name: true },
        },
      },
    });

    return { success: true, data: transactions };
  } catch (error) {
    console.error("Failed to fetch transactions for export:", error);
    return { error: "Gagal mengambil data transaksi." };
  }
}
