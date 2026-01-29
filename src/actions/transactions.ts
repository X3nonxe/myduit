"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { SessionUser } from "@/lib/utils";
import { Prisma, TransactionType } from "@prisma/client";
import { transactionSchema } from "@/lib/validation";

export async function addTransaction(data: {
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
  description?: string;
  account_id?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as SessionUser).id;

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

      // Only update account balance for INCOME and EXPENSE, not TRANSFER
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
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as SessionUser).id;

  try {
    await prisma.transaction.delete({
      where: { id, user_id: userId },
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
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as SessionUser).id;

  const transaction = await prisma.transaction.update({
    where: { id, user_id: userId },
    data,
  });

  revalidatePath("/dashboard");
  revalidateTag("dashboard-stats", "default");
  return transaction;
}

export async function getTransactions() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as SessionUser).id;

  return await prisma.transaction.findMany({
    where: { user_id: userId },
    orderBy: { date: "desc" },
    take: 10,
  });
}

// Cached version of dashboard stats query
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
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as SessionUser).id;

  const validFilters = ["week", "month", "year"];
  if (!validFilters.includes(filter)) {
    throw new Error("Invalid filter value. Must be 'week', 'month', or 'year'.");
  }

  return getCachedDashboardStats(userId, filter);
}

// Cached version of transaction summary
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
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as SessionUser).id;

  return getCachedTransactionSummary(userId);
}
