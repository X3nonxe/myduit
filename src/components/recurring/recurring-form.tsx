"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { X, Tag, Calendar, FileText, Wallet, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
// We'll reuse the addRecurringTransaction action
import { addRecurringTransaction } from "@/actions/recurring";
import { getAccounts } from "@/actions/accounts";
import { Frequency, TransactionType } from "@prisma/client";

interface Account {
    id: string;
    name: string;
    type: string;
}

interface RecurringFormProps {
    onClose?: () => void;
    onSuccess?: () => void;
}

export const RecurringForm = ({ onClose, onSuccess }: RecurringFormProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [accounts, setAccounts] = useState<Account[]>([]);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const data = await getAccounts();
                setAccounts(data.accounts);
            } catch (err) {
                console.error("Failed to fetch accounts:", err);
            }
        };
        fetchAccounts();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const amount = parseFloat(formData.get("amount") as string);
        const type = formData.get("type") as TransactionType;
        const category = formData.get("category") as string;
        const start_date = new Date(formData.get("start_date") as string);
        const end_date_str = formData.get("end_date") as string;
        const end_date = end_date_str ? new Date(end_date_str) : undefined;
        const description = formData.get("description") as string;
        const account_id = formData.get("account_id") as string;
        const frequency = formData.get("frequency") as Frequency;

        try {
            const result = await addRecurringTransaction({
                amount,
                type,
                category,
                start_date,
                end_date,
                description,
                account_id: account_id || undefined,
                frequency,
            });

            if ('error' in result && result.error) {
                setError(result.error);
            } else {
                (e.target as HTMLFormElement).reset();
                router.refresh();
                if (onSuccess) onSuccess();
                if (onClose) onClose();
            }
        } catch {
            setError("Terjadi kesalahan sistem. Coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <GlassCard className="p-8 border-[#e5e2da] shadow-2xl bg-white w-full max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-semibold text-[#1d1d1b]">
                        Transaksi Berulang
                    </h3>
                    <p className="text-[#1d1d1b] text-sm">Jadwalkan pemasukan atau pengeluaran rutin</p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#f1efea] rounded-full transition-colors group"
                    >
                        <X className="w-5 h-5 text-[#1d1d1b] group-hover:text-black" />
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Amount */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1d1d1b] uppercase tracking-wider ml-1">
                        Jumlah (Rp)
                    </label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1d1d1b] font-bold text-sm transition-colors">
                            Rp
                        </span>
                        <input
                            name="amount"
                            type="number"
                            required
                            placeholder="0"
                            className="w-full bg-[#f9f8f4] border border-[#e5e2da] rounded-xl py-4 pl-12 pr-4 outline-none focus:border-[#d97757]/50 focus:ring-4 focus:ring-[#d97757]/5 transition-all text-xl font-semibold text-[#1d1d1b] placeholder:text-[#6b6b6b]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>
                </div>

                {/* Type & Frequency */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#1d1d1b] uppercase tracking-wider ml-1">
                            Jenis
                        </label>
                        <select
                            name="type"
                            required
                            className="w-full bg-[#f9f8f4] border border-[#e5e2da] rounded-xl py-3 px-4 outline-none focus:border-[#d97757]/50 transition-all text-sm text-[#1d1d1b] cursor-pointer"
                        >
                            <option value="EXPENSE">Pengeluaran</option>
                            <option value="INCOME">Pemasukan</option>
                            <option value="TRANSFER">Transfer</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#1d1d1b] uppercase tracking-wider ml-1">
                            Frekuensi
                        </label>
                        <div className="relative group">
                            <RefreshCw className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6b6b] w-4 h-4" />
                            <select
                                name="frequency"
                                required
                                className="w-full bg-[#f9f8f4] border border-[#e5e2da] rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#d97757]/50 transition-all text-sm text-[#1d1d1b] cursor-pointer appearance-none"
                            >
                                <option value="DAILY">Harian</option>
                                <option value="WEEKLY">Mingguan</option>
                                <option value="MONTHLY">Bulanan</option>
                                <option value="YEARLY">Tahunan</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Account & Category */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#1d1d1b] uppercase tracking-wider ml-1">
                            Akun
                        </label>
                        <div className="relative group">
                            <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6b6b] w-4 h-4 group-focus-within:text-[#d97757]" />
                            <select
                                name="account_id"
                                className="w-full bg-[#f9f8f4] border border-[#e5e2da] rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#d97757]/50 transition-all text-sm text-[#1d1d1b] cursor-pointer appearance-none"
                            >
                                <option value="">Pilih Akun (Opsional)</option>
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.type})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#1d1d1b] uppercase tracking-wider ml-1">
                            Kategori
                        </label>
                        <div className="relative group">
                            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6b6b] w-4 h-4 group-focus-within:text-[#d97757]" />
                            <input
                                name="category"
                                type="text"
                                required
                                placeholder="Misal: Langganan"
                                className="w-full bg-[#f9f8f4] border border-[#e5e2da] rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#d97757]/50 transition-all text-sm text-[#1d1d1b] placeholder:text-[#6b6b6b]/30"
                            />
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#1d1d1b] uppercase tracking-wider ml-1">
                            Mulai
                        </label>
                        <div className="relative group">
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6b6b] w-4 h-4 group-focus-within:text-[#d97757]" />
                            <input
                                name="start_date"
                                type="date"
                                required
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="w-full bg-[#f9f9f4] border border-[#e5e2da] rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#d97757]/50 transition-all text-sm text-[#1d1d1b]"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#1d1d1b] uppercase tracking-wider ml-1">
                            Berakhir (Opsional)
                        </label>
                        <div className="relative group">
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6b6b] w-4 h-4 group-focus-within:text-[#d97757]" />
                            <input
                                name="end_date"
                                type="date"
                                className="w-full bg-[#f9f9f4] border border-[#e5e2da] rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#d97757]/50 transition-all text-sm text-[#1d1d1b]"
                            />
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1d1d1b] uppercase tracking-wider ml-1">
                        Deskripsi
                    </label>
                    <div className="relative group">
                        <FileText className="absolute left-3.5 top-4 text-[#6b6b6b] w-4 h-4 group-focus-within:text-[#d97757]" />
                        <textarea
                            name="description"
                            placeholder="Catatan tambahan..."
                            rows={2}
                            className="w-full bg-[#f9f8f4] border border-[#e5e2da] rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#d97757]/50 transition-all text-sm text-[#1d1d1b] placeholder:text-[#6b6b6b]/30 resize-none"
                        />
                    </div>
                </div>

                <button
                    disabled={loading}
                    className="w-full py-4 bg-[#1d1d1b] hover:bg-[#333] disabled:opacity-50 text-white rounded-xl font-semibold transition-all shadow-lg shadow-black/5 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        "Simpan Jadwal"
                    )}
                </button>
            </form>
        </GlassCard>
    );
};
