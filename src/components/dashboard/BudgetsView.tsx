"use client";

import { useEffect, useState } from "react";
import { getBudgets, addBudget, deleteBudget } from "@/actions/budgets";
import {
    PieChart,
    Plus,
    Trash2,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Target
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface Budget {
    id: string;
    category: string;
    amount: number;
    period: string;
    start_date: Date | string;
    end_date: Date | string;
}

export const BudgetsView = () => {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getBudgets();
            setBudgets(data);
        } catch (error) {
            console.error("Failed to fetch budgets:", error);
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
            await addBudget({
                category: formData.get("category") as string,
                amount: parseFloat(formData.get("amount") as string),
                period: formData.get("period") as "MONTHLY" | "WEEKLY",
                start_date: new Date(formData.get("start_date") as string),
                end_date: new Date(formData.get("end_date") as string),
            });
            setIsAdding(false);
            fetchData();
        } catch {
            alert("Gagal menambah anggaran.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus anggaran ini?")) return;
        try {
            await deleteBudget(id);
            fetchData();
        } catch {
            alert("Gagal menghapus anggaran.");
        }
    };

    const formatIDR = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#6b6b6b]">
                <Loader2 className="w-10 h-10 animate-spin text-[#d97757]" />
                <p className="font-medium">Menghitung alokasi anggaran...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-[#1d1d1b]">Anggaran</h2>
                    <p className="text-[#1d1d1b] text-sm">Batasi pengeluaran Anda dengan anggaran yang cerdas.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1d1d1b] text-white rounded-xl text-sm font-semibold hover:bg-[#333] transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Buat Anggaran
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                    >
                        <GlassCard className="p-8 border-[#d97757]/20 bg-white shadow-xl">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#1d1d1b] uppercase ml-1">Kategori</label>
                                        <input name="category" required placeholder="Misal: Makan & Minum" className="w-full px-4 py-3 rounded-xl border border-[#e5e2da] text-[#1d1d1b] outline-none focus:border-[#d97757]/50" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#1d1d1b] uppercase ml-1">Batas (Rp)</label>
                                        <input name="amount" type="number" required placeholder="0" className="w-full px-4 py-3 rounded-xl border border-[#e5e2da] text-[#1d1d1b] outline-none focus:border-[#d97757]/50" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#1d1d1b] uppercase ml-1">Periode</label>
                                        <select name="period" className="w-full px-4 py-3 rounded-xl border border-[#e5e2da] text-[#1d1d1b] outline-none focus:border-[#d97757]/50">
                                            <option value="MONTHLY">Bulanan</option>
                                            <option value="WEEKLY">Mingguan</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#1d1d1b] uppercase ml-1">Tanggal Mulai</label>
                                        <input name="start_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 rounded-xl border border-[#e5e2da] text-[#1d1d1b] outline-none focus:border-[#d97757]/50" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#1d1d1b] uppercase ml-1">Tanggal Berakhir</label>
                                        <input name="end_date" type="date" required className="w-full px-4 py-3 rounded-xl border border-[#e5e2da] text-[#1d1d1b] outline-none focus:border-[#d97757]/50" />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button type="submit" disabled={saving} className="flex-1 py-4 bg-[#1d1d1b] text-white rounded-xl font-bold shadow-lg hover:shadow-[#1d1d1b]/20 disabled:opacity-50 transition-all">
                                        {saving ? "Menyimpan..." : "Aktifkan Anggaran"}
                                    </button>
                                    <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-4 bg-[#f1efea] text-[#1d1d1b] rounded-xl font-bold transition-all">
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-6">
                {budgets.map((budget) => {
                    const used = 0; // In real app, calculate from transactions
                    const percentage = Math.min((used / budget.amount) * 100, 100);
                    const isOver = used > budget.amount;

                    return (
                        <motion.div key={budget.id} layout>
                            <GlassCard className="p-6 border-[#e5e2da] hover:shadow-lg transition-all">
                                <div className="flex flex-col md:flex-row gap-6 justify-between">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[#f9f8f4] flex items-center justify-center text-[#1d1d1b]">
                                                <Target className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#1d1d1b]">{budget.category}</h4>
                                                <p className="text-[10px] text-[#1d1d1b] uppercase font-bold tracking-widest">
                                                    {budget.period} • {format(new Date(budget.start_date), "dd MMM")} - {format(new Date(budget.end_date), "dd MMM yyyy")}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <p className="text-xs font-bold text-[#1d1d1b]">Progres Penggunaan</p>
                                                <p className="text-sm font-black text-[#1d1d1b]">{formatIDR(used)} <span className="text-[#6b6b6b] font-normal">/ {formatIDR(budget.amount)}</span></p>
                                            </div>
                                            <div className="h-3 w-full bg-[#f1efea] rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    className={`h-full rounded-full ${isOver ? 'bg-rose-500' : 'bg-[#1d1d1b]'}`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex md:flex-col justify-between items-end gap-4 min-w-[120px]">
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${isOver ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                            {isOver ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                            {isOver ? "Over" : "Aman"}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(budget.id)}
                                            className="p-3 text-[#6b6b6b] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    );
                })}

                {budgets.length === 0 && !isAdding && (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 bg-[#f1efea] rounded-full flex items-center justify-center mx-auto mb-4">
                            <PieChart className="w-10 h-10 text-[#6b6b6b] opacity-20" />
                        </div>
                        <h3 className="text-lg font-bold text-[#1d1d1b]">Belum ada anggaran</h3>
                        <p className="text-[#6b6b6b] text-sm mt-1">Disiplin finansial dimulai dari anggaran yang tertata.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
