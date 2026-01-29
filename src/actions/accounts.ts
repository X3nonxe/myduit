"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { SessionUser } from "@/lib/utils";
import { accountSchema } from "@/lib/validation";

export async function getAccounts(page = 1, pageSize = 20) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as SessionUser).id;

    const [accounts, total] = await Promise.all([
        prisma.account.findMany({
            where: { user_id: userId },
            orderBy: { created_at: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.account.count({ where: { user_id: userId } }),
    ]);

    return { accounts, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

function hasControlCharacters(str: string): boolean {
    return /[\x00-\x1F\x7F]/.test(str);
}

export async function addAccount(data: {
    name: string;
    type: string;
    balance: number;
}) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as SessionUser | undefined)?.id;

    if (!userId) {
        if (process.env.NODE_ENV !== 'production') {
            console.error("SESSION_ERROR: userId is missing from session");
        }
        return { error: "Sesi tidak valid. Silakan login kembali." };
    }

    const safeData = {
        ...data,
        type: typeof data.type === 'string' ? data.type.trim().toLowerCase() : data.type,
    };
    const validatedFields = accountSchema.safeParse(safeData);
    if (!validatedFields.success) {
        return { error: validatedFields.error.errors[0].message };
    }

    const { name, type, balance } = validatedFields.data;

    try {
        const existingAccount = await prisma.account.findFirst({
            where: {
                user_id: String(userId),
                name: {
                    equals: name,
                    mode: "insensitive",
                },
            },
        });

        if (existingAccount) {
            return { error: "Akun dengan nama tersebut sudah ada." };
        }

        const account = await prisma.account.create({
            data: {
                name,
                type,
                balance,
                user_id: String(userId),
            },
        });

        revalidatePath("/dashboard");
        return { success: true, data: account };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal menambah akun.";
        return { error: message };
    }
}

export async function deleteAccount(id: string) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as SessionUser | undefined)?.id;

    if (!userId) return { error: "Sesi tidak valid." };

    const trimmedId = id?.trim() ?? "";
    if (!trimmedId) {
        return { error: "ID akun tidak valid." };
    }
    if (hasControlCharacters(trimmedId)) {
        return { error: "ID akun mengandung karakter yang tidak valid." };
    }

    try {
        const hasTransactions = await prisma.transaction.findFirst({
            where: { account_id: trimmedId, user_id: String(userId) },
        });

        if (hasTransactions) {
            return { error: "Akun tidak bisa dihapus karena masih memiliki riwayat transaksi." };
        }

        await prisma.account.delete({
            where: { id: trimmedId, user_id: String(userId) },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: unknown) {
        if (process.env.NODE_ENV !== 'production') {
            console.error("Failed to delete account:", error);
        }
        return { error: "Gagal menghapus akun." };
    }
}
