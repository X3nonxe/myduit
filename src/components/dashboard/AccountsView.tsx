"use client";

import { useEffect, useState } from "react";
import { getAccounts, addAccount, deleteAccount } from "@/actions/accounts";
import {
    Wallet,
    Plus,
    Trash2,
    Loader2,
    CreditCard,
    Banknote,
    Smartphone,
    TrendingUp
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
}

export const AccountsView = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getAccounts();
            setAccounts(data.accounts);
        } catch (error) {
            console.error("Failed to fetch accounts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        const formData = new FormData(e.currentTarget);

        try {
            const result = await addAccount({
                name: formData.get("name") as string,
                type: formData.get("type") as string,
                balance: parseFloat(formData.get("balance") as string),
            });

            if (result.error) {
                alert(result.error);
            } else {
                setIsAdding(false);
                fetchData();
            }
        } catch {
            alert("Gagal menambah akun.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus akun ini?")) return;
        try {
            const result = await deleteAccount(id);
            if (result.error) {
                alert(result.error);
            } else {
                fetchData();
            }
        } catch {
            alert("Gagal menghapus akun.");
        }
    };

    const formatIDR = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "BANK": return <Banknote className="w-6 h-6" />;
            case "E-WALLET": return <Smartphone className="w-6 h-6" />;
            default: return <Wallet className="w-6 h-6" />;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#6b6b6b]">
                <Loader2 className="w-10 h-10 animate-spin text-[#d97757]" />
                <p className="font-medium">Menghubungkan ke layanan perbankan...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-[#1d1d1b]">Daftar Akun</h2>
                    <p className="text-[#1d1d1b] text-sm">Kelola semua sumber dana Anda di satu tempat.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1d1d1b] text-white rounded-xl text-sm font-semibold hover:bg-[#333] transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Akun
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <GlassCard className="p-6 border-[#d97757]/20 bg-[#d97757]/5">
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#1d1d1b] uppercase">Nama Akun</label>
                                    <input
                                        name="name"
                                        required
                                        placeholder="Misal: BCA"
                                        className="w-full px-4 py-2 rounded-xl border border-[#e5e2da] bg-white text-sm text-[#1d1d1b] outline-none focus:border-[#d97757]/50"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#1d1d1b] uppercase">Tipe</label>
                                    <select
                                        name="type"
                                        required
                                        className="w-full px-4 py-2 rounded-xl border border-[#e5e2da] bg-white text-sm text-[#1d1d1b] outline-none focus:border-[#d97757]/50"
                                    >
                                        <option value="BANK">Bank</option>
                                        <option value="E-WALLET">E-Wallet</option>
                                        <option value="CASH">Tunai</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#1d1d1b] uppercase">Saldo Awal</label>
                                    <input
                                        name="balance"
                                        type="number"
                                        required
                                        placeholder="0"
                                        className="w-full px-4 py-2 rounded-xl border border-[#e5e2da] bg-white text-sm text-[#1d1d1b] outline-none focus:border-[#d97757]/50"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 py-2 bg-[#d97757] text-white rounded-xl text-sm font-bold disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Simpan"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="px-4 py-2 bg-[#e5e2da] text-[#6b6b6b] rounded-xl text-sm font-bold"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((acc) => (
                    <motion.div
                        key={acc.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group"
                    >
                        <GlassCard className="p-6 border-[#e5e2da] hover:border-[#d97757]/30 transition-all cursor-pointer overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(acc.id); }}
                                    className="p-2 text-[#6b6b6b] hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${acc.type === "BANK" ? "bg-blue-50 text-blue-600" :
                                    acc.type === "E-WALLET" ? "bg-purple-50 text-purple-600" : "bg-orange-50 text-orange-600"
                                    }`}>
                                    {getIcon(acc.type)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#1d1d1b]">{acc.name}</h4>
                                    <p className="text-[10px] text-[#1d1d1b] uppercase tracking-widest font-bold">{acc.type}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-[#1d1d1b] uppercase mb-1">Saldo Tersedia</p>
                                    <p className="text-2xl font-black text-[#1d1d1b] tracking-tight">
                                        {formatIDR(acc.balance)}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-[#e5e2da] flex justify-between items-center text-[10px] text-[#6b6b6b] font-medium">
                                    <span className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-emerald-500" /> +0% bln ini
                                    </span>
                                    <span>Aktif</span>
                                </div>
                            </div>

                            {/* Decorative Grid Line */}
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#d97757]/5 rounded-full blur-2xl" />
                        </GlassCard>
                    </motion.div>
                ))}

                {accounts.length === 0 && !isAdding && (
                    <div className="md:col-span-3 py-20 text-center">
                        <div className="w-20 h-20 bg-[#f1efea] rounded-full flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="w-10 h-10 text-[#6b6b6b] opacity-20" />
                        </div>
                        <h3 className="text-lg font-bold text-[#1d1d1b]">Belum ada akun</h3>
                        <p className="text-[#6b6b6b] text-sm mt-1">Tambah akun bank atau dompet digital untuk mulai mencatat.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
