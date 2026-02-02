import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { CustomPrismaAdapter } from "@/lib/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { User } from "next-auth";
import { logAuditEvent } from "@/lib/audit-log";

interface UserWithImage extends User {
    image?: string | null;
}

export const authOptions: NextAuthOptions = {
    adapter: CustomPrismaAdapter(prisma),
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
                    await logAuditEvent("LOGIN_FAILED", null, { email, reason: "User not found" });
                    throw new Error("Akun tidak ditemukan");
                }

                if (!user.password_hash) {
                    await logAuditEvent("LOGIN_FAILED", user.id, { email, reason: "No password set (OAuth user?)" });
                    throw new Error("Akun ini tidak memiliki kata sandi");
                }

                const isPasswordCorrect = await bcrypt.compare(
                    credentials.password,
                    user.password_hash
                );

                if (!isPasswordCorrect) {
                    await logAuditEvent("LOGIN_FAILED", user.id, { email, reason: "Invalid password" });
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

        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
            allowDangerousEmailAccountLinking: true,
        }),

        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID ?? "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
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
    events: {
        signIn: async ({ user }) => {
            await logAuditEvent("LOGIN_SUCCESS", user.id ?? null, {
                email: user.email ?? undefined,
            });
        },
        signOut: async ({ token }) => {
            await logAuditEvent("LOGOUT", (token?.id as string) ?? null);
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
};
