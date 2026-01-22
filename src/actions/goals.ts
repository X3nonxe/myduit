"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { SessionUser } from "@/lib/utils";
import { goalSchema } from "@/lib/validation";

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

    const validatedFields = goalSchema.safeParse(data);
    if (!validatedFields.success) {
        return { error: validatedFields.error.errors[0].message };
    }

    const { name, target_amount, current_amount, deadline } = validatedFields.data;

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
