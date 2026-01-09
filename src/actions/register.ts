"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
    const email = (formData.get("email") as string)?.toLowerCase();
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    if (!email || !password) {
        return { error: "Missing fields" };
    }

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return { error: "User already exists" };
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
