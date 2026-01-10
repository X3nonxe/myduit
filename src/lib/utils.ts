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
