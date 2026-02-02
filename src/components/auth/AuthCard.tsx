"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { registerUser } from "@/actions/register";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

interface AuthCardProps {
    type: "login" | "register";
}

export const AuthCard = ({ type }: AuthCardProps) => {
    const isLogin = type === "login";
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const honeypot = formData.get("website") as string;

        if (honeypot) {
            setLoading(false);
            return;
        }

        if (isLogin) {
            const rateLimit = await checkRateLimit(email.toLowerCase());
            if (!rateLimit.success) {
                const minutes = Math.ceil(rateLimit.retryAfterMs / 60000);
                setError(`Terlalu banyak percobaan. Coba lagi dalam ${minutes} menit.`);
                setLoading(false);
                return;
            }
        }

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
                await resetRateLimit(email.toLowerCase());
                window.location.href = "/dashboard";
            }
        } else {
            const result = await registerUser(formData);
            if (result.error) {
                setError(result.error === "User already exists" ? "Email sudah terdaftar" : "Terjadi kesalahan");
                setLoading(false);
            } else {
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

                    <input
                        type="text"
                        name="website"
                        style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                    />

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

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#e5e2da]" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3 text-[#6b6b6b]">Atau lanjutkan dengan</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 py-3 px-4 border border-[#e5e2da] rounded-xl hover:bg-[#f9f8f4] transition-all disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="text-sm font-medium text-[#1d1d1b]">Google</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 py-3 px-4 border border-[#e5e2da] rounded-xl hover:bg-[#f9f8f4] transition-all disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" fill="#1d1d1b" viewBox="0 0 24 24">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385c.6.105.825-.255.825-.57c0-.285-.015-1.23-.015-2.235c-3.015.555-3.795-.735-4.035-1.41c-.135-.345-.72-1.41-1.23-1.695c-.42-.225-1.02-.78-.015-.795c.945-.015 1.62.87 1.845 1.23c1.08 1.815 2.805 1.305 3.495.99c.105-.78.42-1.305.765-1.605c-2.67-.3-5.46-1.335-5.46-5.925c0-1.305.465-2.385 1.23-3.225c-.12-.3-.54-1.53.12-3.18c0 0 1.005-.315 3.3 1.23c.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23c.66 1.65.24 2.88.12 3.18c.765.84 1.23 1.905 1.23 3.225c0 4.605-2.805 5.625-5.475 5.925c.435.375.81 1.095.81 2.22c0 1.605-.015 2.895-.015 3.3c0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        <span className="text-sm font-medium text-[#1d1d1b]">GitHub</span>
                    </button>
                </div>


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
