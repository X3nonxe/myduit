"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SessionUser } from "@/lib/utils";

export async function requireAuth(): Promise<string> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        throw new Error("Unauthorized");
    }
    return (session.user as SessionUser).id;
}
export async function getAuthUserId(): Promise<string | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return null;
    }
    return (session.user as SessionUser).id;
}
export type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string };

export async function safeAction<T>(
    fn: () => Promise<T>,
    errorMessage: string
): Promise<ActionResult<T>> {
    try {
        const data = await fn();
        return { success: true, data };
    } catch (error: unknown) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(errorMessage, error);
        }
        const message = error instanceof Error ? error.message : errorMessage;
        return { success: false, error: message };
    }
}
