"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { userProfileSchema, changePasswordSchema } from "@/lib/validation";
import { requireAuth } from "@/lib/auth-helpers";

export async function updateProfile(data: { name: string; image?: string }) {
    const userId = await requireAuth();

    const validation = userProfileSchema.safeParse(data);
    if (!validation.success) {
        return { error: validation.error.issues[0].message };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                name: validation.data.name.trim(),
                image: validation.data.image?.trim() || null,
            },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: unknown) {
        if (process.env.NODE_ENV !== 'production') {
            console.error("Failed to update profile:", error);
        }
        return { error: "Gagal memperbarui profil." };
    }
}

export async function changePassword(data: { oldPassword: string; newPassword: string }) {
    const userId = await requireAuth();

    const validation = changePasswordSchema.safeParse(data);
    if (!validation.success) {
        return { error: validation.error.issues[0].message };
    }
    if (data.oldPassword === data.newPassword) {
        return { error: "Kata sandi baru harus berbeda dari kata sandi lama." };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) throw new Error("User not found");

        if (!user.password_hash) {
            return { error: "Akun ini menggunakan login sosial dan tidak memiliki kata sandi." };
        }

        const isPasswordCorrect = await bcrypt.compare(data.oldPassword, user.password_hash);
        if (!isPasswordCorrect) {
            return { error: "Kata sandi lama salah." };
        }

        const hashedPassword = await bcrypt.hash(data.newPassword, 12);
        await prisma.user.update({
            where: { id: userId },
            data: { password_hash: hashedPassword },
        });

        return { success: true };
    } catch (error: unknown) {
        if (process.env.NODE_ENV !== 'production') {
            console.error("Failed to change password:", error);
        }
        return { error: "Gagal mengubah kata sandi." };
    }
}
