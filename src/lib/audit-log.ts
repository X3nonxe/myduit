"use server";

import prisma from "@/lib/prisma";

export type AuditEvent =
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "LOGIN_BLOCKED"
    | "LOGOUT"
    | "REGISTER"
    | "PASSWORD_CHANGED"
    | "2FA_ENABLED"
    | "2FA_DISABLED"
    | "2FA_VERIFIED"
    | "SESSION_REVOKED"
    | "OAUTH_LINKED"
    | "OAUTH_UNLINKED";

export interface AuditMetadata {
    email?: string;
    provider?: string;
    userAgent?: string;
    reason?: string;
    [key: string]: any;
}

import { headers } from "next/headers";

export async function logAuditEvent(
    event: AuditEvent,
    userId: string | null,
    metadata?: AuditMetadata,
    ipAddress?: string
): Promise<void> {
    try {
        const headerList = await headers();
        const ip = ipAddress || headerList.get("x-forwarded-for")?.split(",")[0] || "unknown";
        const userAgent = headerList.get("user-agent") || "unknown";

        if (process.env.NODE_ENV === "development") {
            console.log(`[AUDIT] ${event}`, {
                userId,
                metadata,
                ipAddress: ip,
                userAgent,
                timestamp: new Date().toISOString(),
            });
        }

        await prisma.auditLog.create({
            data: {
                userId: userId ?? "anonymous",
                event,
                metadata: metadata ?? {},
                ipAddress: ip,
                userAgent,
            },
        });
    } catch (error) {
        console.error("[AUDIT ERROR]", error);
    }
}


export async function getAuditLogs(
    userId: string,
    options: { limit?: number; offset?: number; event?: AuditEvent } = {}
) {
    const { limit = 50, offset = 0, event } = options;

    return prisma.auditLog.findMany({
        where: {
            userId,
            ...(event && { event }),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
    });
}