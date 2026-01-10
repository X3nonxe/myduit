"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { SessionUser } from "@/lib/utils";
import { Prisma, TransactionType } from "@prisma/client";

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
    // DIAGNOSTIC LOG
    if (!prisma.transaction) {
      console.error("PRISMA_DIAGNOSTIC: prisma.transaction is UNDEFINED. Available models:", Object.keys(prisma).filter(k => k[0] === k[0].toLowerCase()));
    }

    // Handle empty string account_id
    const accountId = data.account_id === "" ? null : data.account_id;

    // Use Prisma transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const transaction = await tx.transaction.create({
        data: {
          amount: data.amount,
          type: data.type,
          category: data.category,
          date: data.date,
          description: data.description || null,
          account_id: accountId,
          user_id: userId,
        },
      });

      // Update account balance if account_id is provided
      if (accountId) {
        const amount = data.type === TransactionType.INCOME ? data.amount : -data.amount;
        const account = await tx.account.findFirst({
          where: { id: accountId, user_id: userId }
        });
        if (!account) throw new Error("Account not found or not owned by user");

        await tx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: amount
            }
          }
        });
      }

      return transaction;
    });

    revalidatePath("/dashboard");
    return result;
  } catch (error: unknown) {
    console.error("DEBUG_ERROR: Failed to add transaction:", error);
    const message = error instanceof Error ? error.message : "Gagal menyimpan transaksi.";
    return { error: message };
  }
}

export async function deleteTransaction(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as SessionUser).id;

  await prisma.transaction.delete({
    where: { id, user_id: userId },
  });

  revalidatePath("/dashboard");
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

export async function getDashboardStats(filter: "week" | "month" | "year") {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as SessionUser).id;

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
    // Year filter - group by month
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
}

export async function getTransactionSummary() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as SessionUser).id;

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
}
