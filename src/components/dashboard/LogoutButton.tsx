"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export const LogoutButton = () => {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#6b6b6b] hover:text-[#1d1d1b] hover:bg-[#f1efea] transition-all duration-200 group"
        >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Keluar</span>
        </button>
    );
};
