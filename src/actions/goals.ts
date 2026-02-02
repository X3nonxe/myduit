"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { goalSchema } from "@/lib/validation";
import { requireAuth, getAuthUserId } from "@/lib/auth-helpers";
import { ERROR_MESSAGES } from "@/lib/constants";

export async function getGoals(page = 1, pageSize = 20) {
    const userId = await requireAuth();

    const [goals, total] = await Promise.all([
        prisma.goal.findMany({
            where: { user_id: userId },
            orderBy: { created_at: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.goal.count({ where: { user_id: userId } }),
    ]);

    return { goals, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function addGoal(data: {
    name: string;
    target_amount: number;
    current_amount: number;
    deadline?: Date;
}) {
    const userId = await getAuthUserId();

    if (!userId) return { error: ERROR_MESSAGES.SESSION_INVALID };

    const validatedFields = goalSchema.safeParse(data);
    if (!validatedFields.success) {
        return { error: validatedFields.error.errors[0].message };
    }

    const { name, target_amount, current_amount, deadline } = validatedFields.data;

    try {
        const goal = await prisma.goal.create({
            data: {
                name,
                target_amount,
                current_amount,
                deadline,
                user_id: String(userId),
            },
        });

        revalidatePath("/dashboard");
        return { success: true, data: goal };
    } catch (error: unknown) {
        if (process.env.NODE_ENV !== 'production') {
            console.error("Failed to add goal:", error);
        }
        return { error: "Gagal membuat target." };
    }
}

export async function updateGoalProgress(id: string, current_amount: number) {
    const userId = await getAuthUserId();

    if (!userId) return { error: ERROR_MESSAGES.SESSION_INVALID };

    const validatedCurrentAmount = goalSchema.shape.current_amount.safeParse(current_amount);
    if (!validatedCurrentAmount.success) {
        return { error: validatedCurrentAmount.error.errors[0].message };
    }

    try {
        const goal = await prisma.goal.update({
            where: { id, user_id: String(userId) },
            data: { current_amount },
        });

        revalidatePath("/dashboard");
        return { success: true, data: goal };
    } catch (error: unknown) {
        if (process.env.NODE_ENV !== 'production') {
            console.error("Failed to update goal:", error);
        }
        return { error: "Gagal memperbarui progres." };
    }
}

export async function deleteGoal(id: string) {
    const userId = await getAuthUserId();

    if (!userId) return { error: ERROR_MESSAGES.SESSION_INVALID };

    try {
        await prisma.goal.delete({
            where: { id, user_id: String(userId) },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: unknown) {
        if (process.env.NODE_ENV !== 'production') {
            console.error("Failed to delete goal:", error);
        }
        return { error: "Gagal menghapus target." };
    }
}
