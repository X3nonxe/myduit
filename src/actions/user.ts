"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { SessionUser } from "@/lib/utils";

// ============================================================
// Validation Constants
// ============================================================
const NAME_MAX_LENGTH = 255;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

// ============================================================
// Validation Functions
// ============================================================

/**
 * Validates name input
 * - Must not be empty
 * - Must not exceed max length
 * - Must not contain null bytes or control characters
 */
function validateName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: "Nama tidak boleh kosong." };
    }

    if (name.length > NAME_MAX_LENGTH) {
        return { valid: false, error: `Nama tidak boleh lebih dari ${NAME_MAX_LENGTH} karakter.` };
    }

    // Check for null bytes and control characters (except common whitespace)
    const hasControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(name);
    if (hasControlChars) {
        return { valid: false, error: "Nama mengandung karakter yang tidak valid." };
    }

    return { valid: true };
}

/**
 * Validates image URL
 * - Must be a valid URL
 * - Must use https protocol (or be undefined/empty)
 * - Must not be javascript:, data:, or vbscript: URI
 */
function validateImageUrl(url: string | undefined): { valid: boolean; error?: string } {
    if (!url || url.trim() === "") {
        return { valid: true }; // Empty is allowed
    }

    // Check for dangerous URI schemes
    const dangerousSchemes = /^(javascript|data|vbscript|java):/i;
    if (dangerousSchemes.test(url.trim())) {
        return { valid: false, error: "URL gambar tidak valid." };
    }

    // Must be https (or relative URL starting with /)
    const isValidUrl = url.startsWith("https://") || url.startsWith("/");
    if (!isValidUrl) {
        return { valid: false, error: "URL gambar harus menggunakan HTTPS." };
    }

    // Check URL length to prevent DoS
    if (url.length > 2048) {
        return { valid: false, error: "URL gambar terlalu panjang." };
    }

    return { valid: true };
}

/**
 * Validates password
 * - Must meet minimum length
 * - Must not exceed maximum length (prevent DoS)
 * - Must not be empty or whitespace only
 */
function validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || password.trim().length === 0) {
        return { valid: false, error: "Kata sandi tidak boleh kosong." };
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
        return { valid: false, error: `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter.` };
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
        return { valid: false, error: `Kata sandi maksimal ${PASSWORD_MAX_LENGTH} karakter.` };
    }

    return { valid: true };
}

// ============================================================
// Server Actions
// ============================================================

export async function updateProfile(data: { name: string; image?: string }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as SessionUser).id;

    // Validate name
    const nameValidation = validateName(data.name);
    if (!nameValidation.valid) {
        return { error: nameValidation.error };
    }

    // Validate image URL
    const imageValidation = validateImageUrl(data.image);
    if (!imageValidation.valid) {
        return { error: imageValidation.error };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name.trim(),
                image: data.image?.trim() || null,
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

    // Validate new password
    const passwordValidation = validatePassword(data.newPassword);
    if (!passwordValidation.valid) {
        return { error: passwordValidation.error };
    }

    // Prevent same password
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

