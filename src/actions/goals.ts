"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { SessionUser } from "@/lib/utils";

export async function getGoals() {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as SessionUser).id;

    return await prisma.goal.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
    });
}

export async function addGoal(data: {
    name: string;
    target_amount: number;
    current_amount: number;
    deadline?: Date;
}) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as SessionUser)?.id;

    if (!userId) return { error: "Sesi tidak valid." };

    // Validate target_amount
    if (typeof data.target_amount !== "number" || !isFinite(data.target_amount)) {
        return { error: "Target amount must be a valid number." };
    }
    if (data.target_amount < 0) {
        return { error: "Target amount cannot be negative." };
    }
    if (data.target_amount > Number.MAX_SAFE_INTEGER) {
        return { error: "Target amount exceeds maximum allowed value." };
    }

    // Validate current_amount
    if (typeof data.current_amount !== "number" || !isFinite(data.current_amount)) {
        return { error: "Current amount must be a valid number." };
    }
    if (data.current_amount < 0) {
        return { error: "Current amount cannot be negative." };
    }
    if (data.current_amount > Number.MAX_SAFE_INTEGER) {
        return { error: "Current amount exceeds maximum allowed value." };
    }

    // Validate name
    if (!data.name || data.name.trim().length === 0) {
        return { error: "Goal name cannot be empty." };
    }
    if (data.name.length > 255) {
        return { error: "Goal name is too long." };
    }

    // Validate deadline if provided
    if (data.deadline && (!(data.deadline instanceof Date) || isNaN(data.deadline.getTime()))) {
        return { error: "Invalid deadline date." };
    }

    try {
        const goal = await prisma.goal.create({
            data: {
                ...data,
                user_id: String(userId),
            },
        });

        revalidatePath("/dashboard");
        return { success: true, data: goal };
    } catch (error: unknown) {
        console.error("DEBUG_ERROR: Failed to add goal. UserId:", userId, "Data:", data, "Error:", error);
        return { error: "Gagal membuat target." };
    }
}

export async function updateGoalProgress(id: string, current_amount: number) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as SessionUser)?.id;

    if (!userId) return { error: "Sesi tidak valid." };

    // Validate current_amount
    if (typeof current_amount !== "number" || !isFinite(current_amount)) {
        return { error: "Current amount must be a valid number." };
    }
    if (current_amount < 0) {
        return { error: "Current amount cannot be negative." };
    }
    if (current_amount > Number.MAX_SAFE_INTEGER) {
        return { error: "Current amount exceeds maximum allowed value." };
    }

    try {
        const goal = await prisma.goal.update({
            where: { id, user_id: String(userId) },
            data: { current_amount },
        });

        revalidatePath("/dashboard");
        return { success: true, data: goal };
    } catch (error: unknown) {
        console.error("DEBUG_ERROR: Failed to update goal:", error);
        return { error: "Gagal memperbarui progres." };
    }
}

export async function deleteGoal(id: string) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as SessionUser)?.id;

    if (!userId) return { error: "Sesi tidak valid." };

    try {
        await prisma.goal.delete({
            where: { id, user_id: String(userId) },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: unknown) {
        console.error("DEBUG_ERROR: Failed to delete goal:", error);
        return { error: "Gagal menghapus target." };
    }
}
