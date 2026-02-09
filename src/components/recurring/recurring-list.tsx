"use client";

import { useEffect, useState } from "react";
import { getRecurringTransactions, deleteRecurringTransaction } from "@/actions/recurring";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    Trash2,
    Loader2,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCcw,
    RefreshCw,
    Pencil,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
import { RecurringTransaction, TransactionType, Frequency } from "@prisma/client";

interface RecurringTransactionWithAccount extends RecurringTransaction {
    account: {
        name: string;
        type: string;
    } | null;
}

interface RecurringListProps {
    onEdit?: (transaction: RecurringTransaction) => void;
    refreshTrigger?: number;
}

export const RecurringList = ({ onEdit, refreshTrigger }: RecurringListProps) => {
    const [transactions, setTransactions] = useState<RecurringTransactionWithAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null,
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getRecurringTransactions();
            setTransactions(data);
        } catch (error) {
            console.error("Failed to fetch recurring transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [refreshTrigger]);

    const handleDeleteClick = (id: string) => {
        setDeleteError(null);
        setDeleteModal({ isOpen: true, id });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.id) return;

        setDeleteError(null);

        try {
            const result = await deleteRecurringTransaction(deleteModal.id);
            if ('error' in result && result.error) {
                setDeleteError(result.error);
            } else {
                setDeleteModal({ isOpen: false, id: null });
                fetchData();
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Gagal menghapus jadwal.";
            setDeleteError(message);
        }
    };

    const handleCloseModal = () => {
        setDeleteModal({ isOpen: false, id: null });
        setDeleteError(null);
    };

    const formatIDR = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const translateFrequency = (freq: Frequency) => {
        const map: Record<Frequency, string> = {
            DAILY: "Harian",
            WEEKLY: "Mingguan",
            MONTHLY: "Bulanan",
            YEARLY: "Tahunan",
        };
        return map[freq];
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#6b6b6b]">
                <Loader2 className="w-10 h-10 animate-spin text-[#d97757]" />
                <p className="font-medium">Memuat jadwal transaksi...</p>
            </div>
        );
    }

    return (
        <>
            <GlassCard className="overflow-hidden border-[#e5e2da]">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#f9f8f4] text-left border-bottom border-[#e5e2da]">
                                <th className="px-6 py-4 text-xs font-bold text-[#6b6b6b] uppercase tracking-wider">Jadwal</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#6b6b6b] uppercase tracking-wider">Detail</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#6b6b6b] uppercase tracking-wider">Tipe</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#6b6b6b] uppercase tracking-wider text-right">Jumlah</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#6b6b6b] uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e2da]">
                            <AnimatePresence mode="popLayout">
                                {transactions.length > 0 ? (
                                    transactions.map((tx) => (
                                        <motion.tr
                                            key={tx.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-[#f9f8f4]/50 transition-colors group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <RefreshCw className="w-4 h-4 text-[#d97757]" />
                                                    <p className="text-sm font-medium text-[#1d1d1b]">
                                                        {translateFrequency(tx.frequency)}
                                                    </p>
                                                </div>
                                                <p className="text-[10px] text-[#6b6b6b] mt-1">
                                                    Berikutnya: {format(new Date(tx.next_run_date), "dd MMM yyyy", { locale: id })}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-[#1d1d1b]">{tx.category}</p>
                                                {tx.description && (
                                                    <p className="text-xs text-[#6b6b6b] truncate max-w-xs">{tx.description}</p>
                                                )}
                                                {tx.account && (
                                                    <p className="text-[10px] text-[#6b6b6b] mt-0.5">
                                                        Via: {tx.account.name}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${tx.type === "INCOME" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                    tx.type === "TRANSFER" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                                        "bg-rose-50 text-rose-600 border border-rose-100"
                                                    }`}>
                                                    {tx.type === "INCOME" ? <ArrowDownLeft className="w-3 h-3" /> :
                                                        tx.type === "TRANSFER" ? <RefreshCcw className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                                    {tx.type}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className={`text-sm font-bold ${tx.type === "INCOME" ? "text-emerald-600" : "text-[#1d1d1b]"}`}>
                                                    {tx.type === "INCOME" ? "+" : "-"} {formatIDR(tx.amount)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => onEdit?.(tx)}
                                                        className="p-2 text-[#6b6b6b] hover:text-[#d97757] hover:bg-[#d97757]/10 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(tx.id)}
                                                        className="p-2 text-[#6b6b6b] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-[#6b6b6b] text-sm italic">
                                            Belum ada jadwal transaksi rutin.
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={handleCloseModal}
                onConfirm={handleDeleteConfirm}
                title="Hapus Jadwal?"
                message="Jadwal transaksi yang dihapus tidak akan diproses lagi. Riwayat transaksi yang sudah dibuat TIDAK AKAN terhapus."
                confirmText="Ya, Hapus Jadwal"
                cancelText="Batal"
                variant="danger"
                errorMessage={deleteError}
            />
        </>
    );
};
