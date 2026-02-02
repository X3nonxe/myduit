import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
    const isDev = process.env.NODE_ENV !== "production";

    return new PrismaClient({
        datasourceUrl: process.env.DIRECT_URL,
        // Only enable verbose logging in development
        log: isDev
            ? ["query", "error", "warn", "info"]
            : ["error"],
    });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

// Cache the client in development to prevent connection exhaustion during hot reloads
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
