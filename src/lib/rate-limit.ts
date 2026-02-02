"use server";

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const attempts = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;

    for (const [key, entry] of attempts.entries()) {
        if (entry.resetAt < now) {
            attempts.delete(key);
        }
    }
    lastCleanup = now;
}

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: Date;
    retryAfterMs: number;
}

export async function checkRateLimit(
    identifier: string,
    limit = 5,
    windowMs = 15 * 60 * 1000
): Promise<RateLimitResult> {
    cleanupExpiredEntries();

    const now = Date.now();
    const key = `ratelimit:${identifier}`;
    const entry = attempts.get(key);

    if (!entry || entry.resetAt < now) {
        attempts.set(key, {
            count: 1,
            resetAt: now + windowMs,
        });
        return {
            success: true,
            remaining: limit - 1,
            resetAt: new Date(now + windowMs),
            retryAfterMs: 0,
        };
    }

    entry.count++;

    if (entry.count > limit) {
        return {
            success: false,
            remaining: 0,
            resetAt: new Date(entry.resetAt),
            retryAfterMs: entry.resetAt - now,
        };
    }

    return {
        success: true,
        remaining: limit - entry.count,
        resetAt: new Date(entry.resetAt),
        retryAfterMs: 0,
    };
}

export async function resetRateLimit(identifier: string): Promise<void> {
    const key = `ratelimit:${identifier}`;
    attempts.delete(key);
}

export async function getRateLimitStatus(
    identifier: string,
    limit = 5
): Promise<{ remaining: number; isBlocked: boolean }> {
    const key = `ratelimit:${identifier}`;
    const entry = attempts.get(key);
    const now = Date.now();

    if (!entry || entry.resetAt < now) {
        return { remaining: limit, isBlocked: false };
    }

    return {
        remaining: Math.max(0, limit - entry.count),
        isBlocked: entry.count >= limit,
    };
}
