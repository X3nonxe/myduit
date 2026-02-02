"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SessionUser } from "@/lib/utils";

/**
 * Requires authentication and returns the user ID.
 * Throws an error if the user is not authenticated.
 */
export async function requireAuth(): Promise<string> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        throw new Error("Unauthorized");
    }
    return (session.user as SessionUser).id;
}

/**
 * Gets the user ID if authenticated, returns null if not.
 * Use this for actions that need to handle unauthenticated state gracefully.
 */
export async function getAuthUserId(): Promise<string | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return null;
    }
    return (session.user as SessionUser).id;
}

/**
 * Action result type for consistent response structure
 */
export type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string };

/**
 * Wrapper for safe action execution with consistent error handling.
 * Use this for actions that should return structured results instead of throwing.
 */
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
