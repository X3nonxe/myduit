import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { User } from "next-auth";

interface UserWithImage extends User {
    image?: string | null;
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email dan password wajib diisi");
                }

                const email = credentials.email.toLowerCase();
                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) {
                    throw new Error("Akun tidak ditemukan");
                }

                if (!user.password_hash) {
                    throw new Error("Akun ini tidak memiliki kata sandi");
                }

                const isPasswordCorrect = await bcrypt.compare(
                    credentials.password,
                    user.password_hash
                );

                if (!isPasswordCorrect) {
                    throw new Error("Email atau kata sandi salah");
                }

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
                token.image = (user as UserWithImage).image;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as UserWithImage & { id?: string }).id = token.id as string;
                (session.user as UserWithImage).image = token.image as string | null;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: true,
};
