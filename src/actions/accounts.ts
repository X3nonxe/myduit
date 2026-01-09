"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getAccounts() {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    return await prisma.account.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
    });
}

export async function addAccount(data: {
    name: string;
    type: string;
    balance: number;
}) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        console.error("SESSION_ERROR: userId is missing from session");
        return { error: "Sesi tidak valid. Silakan login kembali." };
    }

    try {
        if (!prisma.account) {
            console.error("PRISMA_DIAGNOSTIC: prisma.account is UNDEFINED. Available models:", Object.keys(prisma).filter(k => k[0] === k[0].toLowerCase()));
        }
        const account = await prisma.account.create({
            data: {
                name: data.name,
                type: data.type,
                balance: data.balance,
                user_id: String(userId),
            },
        });

        revalidatePath("/dashboard");
        return { success: true, data: account };
    } catch (error: any) {
        const fs = require('fs');
        const logMsg = `[${new Date().toISOString()}] DEBUG_ERROR: Failed to add account. UserId: ${userId}, Data: ${JSON.stringify(data)}, Error: ${error.message}\nStack: ${error.stack}\n\n`;
        fs.appendFileSync('error.log', logMsg);
        console.error("DEBUG_ERROR: Failed to add account. UserId:", userId, "Data:", data, "Error:", error);
        return { error: error.message || "Gagal menambah akun." };
    }
}

export async function deleteAccount(id: string) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) return { error: "Sesi tidak valid." };

    try {
        // Check if account has transactions
        const hasTransactions = await prisma.transaction.findFirst({
            where: { account_id: id },
        });

        if (hasTransactions) {
            return { error: "Akun tidak bisa dihapus karena masih memiliki riwayat transaksi." };
        }

        await prisma.account.delete({
            where: { id, user_id: String(userId) },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: any) {
        console.error("DEBUG_ERROR: Failed to delete account:", error);
        return { error: "Gagal menghapus akun." };
    }
}
