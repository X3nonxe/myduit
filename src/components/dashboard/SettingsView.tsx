"use client";
// main ui
import { GlassCard } from "@/components/ui/GlassCard";
import Image from "next/image";
import {
    User,
    Shield,
    Bell,
    Smartphone,
    LogOut,
    ChevronRight,
    Camera,
    Languages,
    CreditCard,
    Globe,
    X,
    Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { updateProfile, changePassword } from "@/actions/user";
import { SessionUser } from "@/lib/utils";

export const SettingsView = () => {
    const { data: session } = useSession();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });
        const formData = new FormData(e.currentTarget);

        const result = await updateProfile({
            name: formData.get("name") as string,
            image: formData.get("image") as string,
        });

        if (result.success) {
            setMessage({ type: "success", text: "Profil berhasil diperbarui!" });
            setTimeout(() => {
                setIsProfileModalOpen(false);
                setMessage({ type: "", text: "" });
                window.location.reload();
            }, 1500);
        } else {
            setMessage({ type: "error", text: result.error || "Gagal memperbarui profil." });
        }
        setLoading(false);
    };

    const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });
        const formData = new FormData(e.currentTarget);

        const newPass = formData.get("newPassword") as string;
        const confirmPass = formData.get("confirmPassword") as string;

        if (newPass !== confirmPass) {
            setMessage({ type: "error", text: "Konfirmasi kata sandi tidak cocok." });
            setLoading(false);
            return;
        }

        const result = await changePassword({
            oldPassword: formData.get("oldPassword") as string,
            newPassword: newPass,
        });

        if (result.success) {
            setMessage({ type: "success", text: "Kata sandi berhasil diubah!" });
            setTimeout(() => {
                setIsPasswordModalOpen(false);
                setMessage({ type: "", text: "" });
            }, 1500);
        } else {
            setMessage({ type: "error", text: result.error || "Gagal mengubah kata sandi." });
        }
        setLoading(false);
    };

    const sections = [
        {
            title: "Akun",
            items: [
                {
                    icon: User,
                    label: "Profil Pengguna",
                    value: session?.user?.name || "User",
                    color: "text-blue-500",
                    onClick: () => setIsProfileModalOpen(true)
                },
                { icon: Globe, label: "Mata Uang Utama", value: "IDR (Rp)", color: "text-emerald-500" },
                { icon: Languages, label: "Bahasa", value: "Indonesia", color: "text-purple-500" },
            ]
        },
        {
            title: "Keamanan",
            items: [
                {
                    icon: Shield,
                    label: "Ubah Kata Sandi",
                    value: "Keamanan Akun",
                    color: "text-rose-500",
                    onClick: () => setIsPasswordModalOpen(true)
                },
                { icon: Smartphone, label: "Autentikasi 2 Faktor", value: "Nonaktif", color: "text-slate-500" },
            ]
        },
        {
            title: "Preferensi",
            items: [
                { icon: Bell, label: "Notifikasi", value: "Push & Email aktif", color: "text-orange-500" },
                { icon: CreditCard, label: "Paket Langganan", value: "Free Tier", color: "text-indigo-500" },
            ]
        }
    ];

    const profileImage = (session?.user as SessionUser)?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.name || 'Bryan'}`;

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row gap-8 items-center bg-white p-8 rounded-3xl border border-[#e5e2da] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d97757]/5 rounded-full -mr-16 -mt-16 blur-3xl" />

                <div className="relative group cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#f9f8f4] shadow-xl relative">
                        <Image
                            src={profileImage}
                            alt="Profile"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                </div>

                <div className="text-center md:text-left z-10">
                    <h2 className="text-3xl font-black text-[#1d1d1b] tracking-tight">{session?.user?.name || "Akun Saya"}</h2>
                    <p className="text-[#6b6b6b]">{session?.user?.email || "user@example.com"}</p>
                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                        <span className="px-3 py-1 bg-[#1d1d1b] text-white text-[10px] font-bold rounded-full uppercase">Basic Member</span>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full uppercase">Akun Terverifikasi</span>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {sections.map((section) => (
                    <div key={section.title} className="space-y-4">
                        <h3 className="text-xs font-black text-[#6b6b6b] uppercase tracking-[0.2em] ml-2">{section.title}</h3>
                        <GlassCard className="overflow-hidden border-[#e5e2da]">
                            <div className="divide-y divide-[#e5e2da]">
                                {section.items.map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={item.onClick}
                                        className="w-full flex items-center justify-between p-5 hover:bg-[#f9f8f4] transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl bg-white border border-[#e5e2da] flex items-center justify-center ${item.color} shadow-sm group-hover:scale-110 transition-transform`}>
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-[#1d1d1b]">{item.label}</p>
                                                <p className="text-xs text-[#6b6b6b]">{item.value}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-[#6b6b6b] group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ))}
                            </div>
                        </GlassCard>
                    </div>
                ))}
            </div>

            <div className="pt-6">
                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-center gap-2 p-5 bg-rose-50 text-rose-600 rounded-3xl font-bold border border-rose-100 hover:bg-rose-100 transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    Keluar dari Dashboard
                </button>
            </div>

            {/* Modal Edit Profil */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1d1d1b]/40 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-[#1d1d1b]">Edit Profil</h3>
                            <button onClick={() => setIsProfileModalOpen(false)}><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-[#6b6b6b]">Nama Lengkap</label>
                                <input name="name" defaultValue={session?.user?.name || ""} required className="w-full p-3 rounded-xl border border-[#e5e2da] focus:border-[#d97757] outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-[#6b6b6b]">URL Foto Profil (Opsional)</label>
                                <input name="image" defaultValue={(session?.user as SessionUser)?.image || ""} placeholder="https://..." className="w-full p-3 rounded-xl border border-[#e5e2da] focus:border-[#d97757] outline-none" />
                            </div>
                            {message.text && (
                                <div className={`p-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {message.text}
                                </div>
                            )}
                            <button disabled={loading} type="submit" className="w-full py-4 bg-[#1d1d1b] text-white rounded-xl font-bold hover:bg-[#333] transition-all disabled:opacity-50 flex justify-center items-center">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Perubahan"}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Modal Ubah Password */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1d1d1b]/40 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-[#1d1d1b]">Ubah Kata Sandi</h3>
                            <button onClick={() => setIsPasswordModalOpen(false)}><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-[#6b6b6b]">Kata Sandi Lama</label>
                                <input name="oldPassword" type="password" required className="w-full p-3 rounded-xl border border-[#e5e2da] focus:border-[#d97757] outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-[#6b6b6b]">Kata Sandi Baru</label>
                                <input name="newPassword" type="password" required className="w-full p-3 rounded-xl border border-[#e5e2da] focus:border-[#d97757] outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-[#6b6b6b]">Konfirmasi Kata Sandi Baru</label>
                                <input name="confirmPassword" type="password" required className="w-full p-3 rounded-xl border border-[#e5e2da] focus:border-[#d97757] outline-none" />
                            </div>
                            {message.text && (
                                <div className={`p-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {message.text}
                                </div>
                            )}
                            <button disabled={loading} type="submit" className="w-full py-4 bg-[#1d1d1b] text-white rounded-xl font-bold hover:bg-[#333] transition-all disabled:opacity-50 flex justify-center items-center">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ubah Kata Sandi"}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
