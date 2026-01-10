"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { BudgetInput } from "@/lib/validation";

export async function getBudgets() {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    return await prisma.budget.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
    });
}

export async function addBudget(data: BudgetInput) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) return { error: "Sesi tidak valid." };

    try {
        const budget = await prisma.budget.create({
            data: {
                ...data,
                user_id: String(userId),
            },
        });

        revalidatePath("/dashboard");
        return { success: true, data: budget };
    } catch (error: any) {
        console.error("DEBUG_ERROR: Failed to add budget. UserId:", userId, "Data:", data, "Error:", error);
        return { error: "Gagal membuat anggaran." };
    }
}

export async function deleteBudget(id: string) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) return { error: "Sesi tidak valid." };

    try {
        await prisma.budget.delete({
            where: { id, user_id: String(userId) },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: any) {
        console.error("DEBUG_ERROR: Failed to delete budget:", error);
        return { error: "Gagal menghapus anggaran." };
    }
}
