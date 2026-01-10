"use client";

import { useEffect, useState } from "react";
import { getTransactions, deleteTransaction } from "@/actions/transactions";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Trash2, Loader2, ArrowUpRight, ArrowDownLeft, RefreshCcw } from "lucide-react";

interface Transaction {
    id: string;
    category: string;
    date: Date | string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    amount: number;
    description?: string | null;
}

export const RecentTransactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getTransactions();
            setTransactions(data);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus transaksi ini?")) return;
        try {
            await deleteTransaction(id);
            fetchData(); // Refresh
        } catch {
            alert("Gagal menghapus transaksi.");
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
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#6b6b6b]">
                <Loader2 className="w-8 h-8 animate-spin text-[#d97757]" />
                <p className="text-sm">Memuat transaksi...</p>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="py-12 text-center text-[#6b6b6b] text-sm italic">
                Belum ada catatan transaksi.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {transactions.map((tx) => (
                <div
                    key={tx.id}
                    className="group flex items-center justify-between p-4 bg-white border border-[#e5e2da] rounded-2xl hover:border-[#d97757]/30 transition-all hover:shadow-md"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === "INCOME" ? "bg-emerald-50 text-emerald-600" :
                            tx.type === "TRANSFER" ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                            }`}>
                            {tx.type === "INCOME" ? <ArrowDownLeft className="w-5 h-5" /> :
                                tx.type === "TRANSFER" ? <RefreshCcw className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[#1d1d1b]">{tx.category}</p>
                            <p className="text-[10px] text-[#6b6b6b] uppercase tracking-wider font-bold">
                                {format(new Date(tx.date), "dd MMM yyyy", { locale: id })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className={`text-sm font-bold ${tx.type === "INCOME" ? "text-emerald-600" : "text-[#1d1d1b]"}`}>
                            {tx.type === "INCOME" ? "+" : "-"} {formatIDR(tx.amount)}
                        </p>
                        <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-[#6b6b6b] hover:text-rose-600 rounded-lg transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
