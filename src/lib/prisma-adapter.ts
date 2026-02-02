import { PrismaClient, Prisma } from "@prisma/client";
import { Adapter, AdapterAccount, AdapterSession, AdapterUser } from "next-auth/adapters";

export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
    return {
        async createUser(user: Omit<AdapterUser, "id">) {
            const created = await prisma.user.create({
                data: {
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    emailVerified: user.emailVerified,
                },
            });
            return {
                id: created.id,
                email: created.email,
                name: created.name,
                image: created.image,
                emailVerified: created.emailVerified,
            };
        },

        async getUser(id) {
            const user = await prisma.user.findUnique({ where: { id } });
            if (!user) return null;
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                emailVerified: user.emailVerified,
            };
        },

        async getUserByEmail(email) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) return null;
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                emailVerified: user.emailVerified,
            };
        },

        async getUserByAccount({ provider, providerAccountId }) {
            const account = await prisma.oAuthAccount.findUnique({
                where: {
                    provider_providerAccountId: { provider, providerAccountId },
                },
                include: { user: true },
            });
            if (!account?.user) return null;
            return {
                id: account.user.id,
                email: account.user.email,
                name: account.user.name,
                image: account.user.image,
                emailVerified: account.user.emailVerified,
            };
        },

        async updateUser(user) {
            const updated = await prisma.user.update({
                where: { id: user.id },
                data: {
                    name: user.name,
                    email: user.email ?? undefined,
                    image: user.image,
                    emailVerified: user.emailVerified,
                },
            });
            return {
                id: updated.id,
                email: updated.email,
                name: updated.name,
                image: updated.image,
                emailVerified: updated.emailVerified,
            };
        },

        async deleteUser(userId) {
            await prisma.user.delete({ where: { id: userId } });
        },

        async linkAccount(account: AdapterAccount) {
            await prisma.oAuthAccount.create({
                data: {
                    userId: account.userId,
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    refresh_token: account.refresh_token,
                    access_token: account.access_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                    session_state: account.session_state as string | undefined,
                },
            });
        },

        async unlinkAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }) {
            await prisma.oAuthAccount.delete({
                where: {
                    provider_providerAccountId: { provider, providerAccountId },
                },
            });
        },

        async createSession(session) {
            const created = await prisma.session.create({
                data: {
                    sessionToken: session.sessionToken,
                    userId: session.userId,
                    expires: session.expires,
                },
            });
            return {
                sessionToken: created.sessionToken,
                userId: created.userId,
                expires: created.expires,
            };
        },

        async getSessionAndUser(sessionToken) {
            const session = await prisma.session.findUnique({
                where: { sessionToken },
                include: { user: true },
            });
            if (!session) return null;
            return {
                session: {
                    sessionToken: session.sessionToken,
                    userId: session.userId,
                    expires: session.expires,
                },
                user: {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.name,
                    image: session.user.image,
                    emailVerified: session.user.emailVerified,
                },
            };
        },

        async updateSession(session) {
            const updated = await prisma.session.update({
                where: { sessionToken: session.sessionToken },
                data: {
                    expires: session.expires,
                },
            });
            return {
                sessionToken: updated.sessionToken,
                userId: updated.userId,
                expires: updated.expires,
            };
        },

        async deleteSession(sessionToken) {
            await prisma.session.delete({ where: { sessionToken } });
        },

        async createVerificationToken(token) {
            return token;
        },

        async useVerificationToken({ identifier, token }) {
            return null;
        },
    };
}
