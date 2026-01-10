"use client";

import { useEffect, useState } from "react";
import { getGoals, addGoal, deleteGoal } from "@/actions/goals";
import {
    Target,
    Plus,
    Trash2,
    Loader2,
    Trophy,
    Calendar,
    Sparkles,
    Coins
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Goal {
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    deadline?: Date | string | null;
}

export const GoalsView = () => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getGoals();
            setGoals(data);
        } catch (error) {
            console.error("Failed to fetch goals:", error);
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
            await addGoal({
                name: formData.get("name") as string,
                target_amount: parseFloat(formData.get("target_amount") as string),
                current_amount: parseFloat(formData.get("current_amount") as string) || 0,
                deadline: formData.get("deadline") ? new Date(formData.get("deadline") as string) : undefined,
            });
            setIsAdding(false);
            fetchData();
        } catch {
            alert("Gagal menambah target.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus target ini?")) return;
        try {
            await deleteGoal(id);
            fetchData();
        } catch {
            alert("Gagal menghapus target.");
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
                <p className="font-medium">Memanifestasikan impian Anda...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-[#1d1d1b]">Target Menabung</h2>
                    <p className="text-[#1d1d1b] text-sm">Wujudkan impian finansial Anda selangkah demi selangkah.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1d1d1b] text-white rounded-xl text-sm font-semibold hover:bg-[#333] transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Target
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <GlassCard className="p-8 border-[#1d1d1b]/10 bg-white">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#1d1d1b] uppercase">Apa yang ingin dicapai?</label>
                                        <div className="relative">
                                            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d97757]" />
                                            <input name="name" required placeholder="Misal: Liburan ke Jepang" className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e5e2da] text-[#1d1d1b] outline-none focus:border-[#d97757]/50" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#1d1d1b] uppercase">Berapa biaya yang dibutuhkan?</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#1d1d1b]">Rp</span>
                                            <input name="target_amount" type="number" required placeholder="0" className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e5e2da] text-[#1d1d1b] outline-none focus:border-[#d97757]/50" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#1d1d1b] uppercase">Terisi saat ini</label>
                                        <div className="relative">
                                            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
                                            <input name="current_amount" type="number" defaultValue="0" className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e5e2da] text-[#1d1d1b] outline-none focus:border-[#d97757]/50" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#1d1d1b] uppercase">Target waktu (Opsional)</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
                                            <input name="deadline" type="date" className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e5e2da] text-[#1d1d1b] outline-none focus:border-[#d97757]/50" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button type="submit" disabled={saving} className="flex-1 py-4 bg-[#1d1d1b] text-white rounded-xl font-bold transition-all disabled:opacity-50">
                                        {saving ? "Memproses..." : "Pasang Target"}
                                    </button>
                                    <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-4 bg-[#f1efea] text-[#1d1d1b] rounded-xl font-bold">
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {goals.map((goal) => {
                    const percentage = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                    const isDone = percentage >= 100;

                    return (
                        <motion.div key={goal.id} layout>
                            <GlassCard className={`p-8 border-[#e5e2da] relative overflow-hidden group hover:border-[#1d1d1b]/20 transition-all ${isDone ? 'bg-emerald-50/30' : 'bg-white'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <h4 className="text-xl font-bold text-[#1d1d1b] flex items-center gap-2">
                                            {goal.name}
                                            {isDone && <Trophy className="w-5 h-5 text-yellow-500" />}
                                        </h4>
                                        {goal.deadline && (
                                            <p className="text-xs text-[#6b6b6b] flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> Target: {format(new Date(goal.deadline), "dd MMM yyyy", { locale: id })}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(goal.id)}
                                        className="p-2 text-[#6b6b6b] hover:text-rose-600 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-[#1d1d1b] uppercase font-bold tracking-widest">Terkumpul</p>
                                            <p className="text-2xl font-black text-[#1d1d1b] tracking-tight">{formatIDR(goal.current_amount)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-[#1d1d1b] uppercase font-bold tracking-widest">Target</p>
                                            <p className="text-sm font-semibold text-[#1d1d1b]">{formatIDR(goal.target_amount)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-[#f1efea] rounded-full overflow-hidden p-1">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : 'bg-[#1d1d1b]'}`}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-[#6b6b6b] uppercase">
                                            <span>{Math.round(percentage)}% Selesai</span>
                                            <span>{formatIDR(goal.target_amount - goal.current_amount)} lagi</span>
                                        </div>
                                    </div>
                                </div>

                                {isDone && (
                                    <div className="mt-6 pt-6 border-t border-emerald-100 flex justify-between items-center text-emerald-600">
                                        <p className="text-xs font-bold uppercase tracking-widest">Tujuan Tercapai!</p>
                                        <Sparkles className="w-5 h-5 animate-pulse" />
                                    </div>
                                )}
                            </GlassCard>
                        </motion.div>
                    );
                })}

                {goals.length === 0 && !isAdding && (
                    <div className="md:col-span-2 py-20 text-center">
                        <div className="w-20 h-20 bg-[#f1efea] rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="w-10 h-10 text-[#6b6b6b] opacity-20" />
                        </div>
                        <h3 className="text-lg font-bold text-[#1d1d1b]">Belum ada target</h3>
                        <p className="text-[#6b6b6b] text-sm mt-1">Gantungkan cita-cita finansial Anda setinggi langit.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
