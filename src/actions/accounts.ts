"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { SessionUser } from "@/lib/utils";

export async function getAccounts() {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as SessionUser).id;

    return await prisma.account.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
    });
}

// Allowed account types
const ALLOWED_ACCOUNT_TYPES = ["bank", "cash", "e-wallet", "credit_card", "other"] as const;

// Validation constants
const MAX_NAME_LENGTH = 100;
const MAX_TYPE_LENGTH = 50;
const MAX_BALANCE = Number.MAX_SAFE_INTEGER;

// Check for control characters (0x00-0x1F and 0x7F)
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
        console.error("SESSION_ERROR: userId is missing from session");
        return { error: "Sesi tidak valid. Silakan login kembali." };
    }

    // Validate name
    const trimmedName = data.name?.trim() ?? "";
    if (!trimmedName) {
        return { error: "Nama akun tidak boleh kosong." };
    }
    if (trimmedName.length > MAX_NAME_LENGTH) {
        return { error: `Nama akun tidak boleh lebih dari ${MAX_NAME_LENGTH} karakter.` };
    }
    if (hasControlCharacters(trimmedName)) {
        return { error: "Nama akun mengandung karakter yang tidak valid." };
    }

    // Validate type
    const trimmedType = data.type?.trim().toLowerCase() ?? "";
    if (!trimmedType) {
        return { error: "Tipe akun tidak boleh kosong." };
    }
    if (trimmedType.length > MAX_TYPE_LENGTH) {
        return { error: `Tipe akun tidak boleh lebih dari ${MAX_TYPE_LENGTH} karakter.` };
    }
    if (!ALLOWED_ACCOUNT_TYPES.includes(trimmedType as typeof ALLOWED_ACCOUNT_TYPES[number])) {
        return { error: `Tipe akun tidak valid. Pilih: ${ALLOWED_ACCOUNT_TYPES.join(", ")}.` };
    }

    // Validate balance
    if (typeof data.balance !== "number" || !Number.isFinite(data.balance)) {
        return { error: "Saldo harus berupa angka yang valid." };
    }
    if (data.balance < 0) {
        return { error: "Saldo tidak boleh negatif." };
    }
    if (data.balance > MAX_BALANCE) {
        return { error: "Saldo melebihi batas maksimum." };
    }

    try {
        // Check for duplicate account name for this user
        const existingAccount = await prisma.account.findFirst({
            where: {
                user_id: String(userId),
                name: {
                    equals: trimmedName,
                    mode: "insensitive",
                },
            },
        });

        if (existingAccount) {
            return { error: "Akun dengan nama tersebut sudah ada." };
        }

        const account = await prisma.account.create({
            data: {
                name: trimmedName,
                type: trimmedType,
                balance: data.balance,
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

    // Validate ID
    const trimmedId = id?.trim() ?? "";
    if (!trimmedId) {
        return { error: "ID akun tidak valid." };
    }
    if (hasControlCharacters(trimmedId)) {
        return { error: "ID akun mengandung karakter yang tidak valid." };
    }

    try {
        // Check if account has transactions
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
        console.error("DEBUG_ERROR: Failed to delete account:", error);
        return { error: "Gagal menghapus akun." };
    }
}
