import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface SessionUser {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
}

export function logError(context: string, error: unknown): void {
    if (process.env.NODE_ENV !== 'production') {
        console.error(`${context}:`, error);
    }
}
