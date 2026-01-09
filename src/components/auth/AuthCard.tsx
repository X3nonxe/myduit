"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/actions/register";

interface AuthCardProps {
    type: "login" | "register";
}

export const AuthCard = ({ type }: AuthCardProps) => {
    const isLogin = type === "login";
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const name = formData.get("name") as string;

        if (isLogin) {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Email atau kata sandi salah");
                setLoading(false);
            } else {
                // Gunakan window.location agar sesi benar-benar ter-refresh
                window.location.href = "/dashboard";
            }
        } else {
            const result = await registerUser(formData);
            if (result.error) {
                setError(result.error === "User already exists" ? "Email sudah terdaftar" : "Terjadi kesalahan");
                setLoading(false);
            } else {
                // Auto login after register
                await signIn("credentials", {
                    email,
                    password,
                    callbackUrl: "/dashboard",
                });
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md z-10"
        >
            <div className="text-center mb-10">
                <div className="w-12 h-12 bg-[#1d1d1b] rounded-xl flex items-center justify-center font-bold text-xl mx-auto mb-6 shadow-sm text-white">
                    D
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1b]">
                    {isLogin ? "Selamat datang kembali" : "Buat akun baru"}
                </h1>
                <p className="text-[#6b6b6b] mt-2">
                    {isLogin
                        ? "Masukkan detail Anda untuk masuk ke dashboard"
                        : "Lengkapi data diri untuk mulai mencatat keuangan"}
                </p>
            </div>

            <GlassCard className="p-10 border-[#e5e2da] shadow-xl bg-white">
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {!isLogin && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider ml-1">
                                Nama Lengkap
                            </label>
                            <div className="relative group">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]/40 group-focus-within:text-[#d97757] transition-colors" />
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="Bryan Duit"
                                    className="w-full bg-[#f9f8f4] border border-[#e5e2da] rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-[#d97757]/50 focus:ring-4 focus:ring-[#d97757]/5 transition-all text-sm text-[#1d1d1b] placeholder:text-[#6b6b6b]/30"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider ml-1">
                            Alamat Email
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]/40 group-focus-within:text-[#d97757] transition-colors" />
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="nama@email.com"
                                className="w-full bg-[#f9f8f4] border border-[#e5e2da] rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-[#d97757]/50 focus:ring-4 focus:ring-[#d97757]/5 transition-all text-sm text-[#1d1d1b] placeholder:text-[#6b6b6b]/30"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider ml-1">
                            Kata Sandi
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]/40 group-focus-within:text-[#d97757] transition-colors" />
                            <input
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full bg-[#f9f8f4] border border-[#e5e2da] rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-[#d97757]/50 focus:ring-4 focus:ring-[#d97757]/5 transition-all text-sm text-[#1d1d1b] placeholder:text-[#6b6b6b]/30"
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full py-4 bg-[#1d1d1b] hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-black/5 active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {isLogin ? "Masuk" : "Daftar Akun"} <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-[#e5e2da]">
                    <p className="text-sm text-[#6b6b6b]">
                        {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
                        <Link
                            href={isLogin ? "/register" : "/login"}
                            className="text-[#d97757] font-semibold hover:underline transition-all ml-1"
                        >
                            {isLogin ? "Daftar sekarang" : "Masuk di sini"}
                        </Link>
                    </p>
                </div>
            </GlassCard>
        </motion.div>
    );
};
