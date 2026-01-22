"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

import { registerSchema } from "@/lib/validation";

export async function registerUser(formData: FormData) {
    const rawData = {
        name: formData.get("name") as string,
        email: (formData.get("email") as string)?.toLowerCase(),
        password: formData.get("password") as string,
    };

    const validation = registerSchema.safeParse(rawData);

    if (!validation.success) {
        return { error: validation.error.issues[0].message };
    }

    const { name, email, password } = validation.data;

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return { error: "Registration failed. Please try again." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    try {
        const user = await prisma.user.create({
            data: {
                email,
                password_hash: hashedPassword,
                name,
            },
        });

        return { success: true, userId: user.id };
    } catch (error) {
        console.error("Registration error:", error);
        return { error: "Something went wrong" };
    }
}
