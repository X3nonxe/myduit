"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { SessionUser } from "@/lib/utils";
import { userProfileSchema, changePasswordSchema } from "@/lib/validation";

export async function updateProfile(data: { name: string; image?: string }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as SessionUser).id;

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
        console.error("DEBUG_ERROR: Failed to update profile:", error);
        return { error: "Gagal memperbarui profil." };
    }
}

export async function changePassword(data: { oldPassword: string; newPassword: string }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as SessionUser).id;

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
        console.error("DEBUG_ERROR: Failed to change password:", error);
        return { error: "Gagal mengubah kata sandi." };
    }
}
