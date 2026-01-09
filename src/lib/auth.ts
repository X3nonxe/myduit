import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                console.log("--- Login Attempt ---", credentials?.email);

                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email dan password wajib diisi");
                }

                const email = credentials.email.toLowerCase();
                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) {
                    console.log("LOGIN_FAILED: User not found ->", email);
                    throw new Error("Akun tidak ditemukan");
                }

                if (!user.password_hash) {
                    console.log("LOGIN_FAILED: User has no password_hash ->", email);
                    throw new Error("Akun ini tidak memiliki kata sandi");
                }

                const isPasswordCorrect = await bcrypt.compare(
                    credentials.password,
                    user.password_hash
                );

                if (!isPasswordCorrect) {
                    console.log("LOGIN_FAILED: Password incorrect for ->", email);
                    throw new Error("Email atau kata sandi salah");
                }

                console.log("LOGIN_SUCCESS: Found user ->", email);
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.image = (user as any).image;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).image = token.image;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || "mantap-jiwa-rahasia-negara-123",
    debug: true,
};
