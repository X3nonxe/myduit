"use client";

import { useEffect, useState } from "react";
import { getTransactions, deleteTransaction } from "@/actions/transactions";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    Trash2,
    Loader2,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCcw,
    Search,
    Filter,
    Download
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";

export const TransactionsView = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("ALL");

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
            fetchData();
        } catch (error) {
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

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tx.description && tx.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFilter = filterType === "ALL" || tx.type === filterType;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#6b6b6b]">
                <Loader2 className="w-10 h-10 animate-spin text-[#d97757]" />
                <p className="font-medium">Menyiapkan daftar transaksi...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
                    <input
                        type="text"
                        placeholder="Cari kategori atau deskripsi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e5e2da] rounded-xl outline-none focus:border-[#d97757]/50 transition-all text-sm text-[#1d1d1b]"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex bg-[#f1efea] p-1 rounded-xl">
                        {["ALL", "INCOME", "EXPENSE", "TRANSFER"].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === type
                                    ? "bg-white text-[#1d1d1b] shadow-sm"
                                    : "text-[#6b6b6b] hover:text-[#1d1d1b]"
                                    }`}
                            >
                                {type === "ALL" ? "Semua" : type === "INCOME" ? "Masuk" : type === "EXPENSE" ? "Keluar" : "Transfer"}
                            </button>
                        ))}
                    </div>
                    <button className="p-2.5 bg-white border border-[#e5e2da] rounded-xl text-[#6b6b6b] hover:bg-[#f1efea] transition-all">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <GlassCard className="overflow-hidden border-[#e5e2da]">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#f9f8f4] text-left border-bottom border-[#e5e2da]">
                                <th className="px-6 py-4 text-xs font-bold text-[#6b6b6b] uppercase tracking-wider">Tanggal</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#6b6b6b] uppercase tracking-wider">Kategori & Deskripsi</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#6b6b6b] uppercase tracking-wider">Tipe</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#6b6b6b] uppercase tracking-wider text-right">Jumlah</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#6b6b6b] uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e2da]">
                            <AnimatePresence mode="popLayout">
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((tx) => (
                                        <motion.tr
                                            key={tx.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-[#f9f8f4]/50 transition-colors group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-medium text-[#1d1d1b]">
                                                    {format(new Date(tx.date), "dd MMM yyyy", { locale: id })}
                                                </p>
                                                <p className="text-[10px] text-[#6b6b6b]">
                                                    {format(new Date(tx.date), "HH:mm")}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-[#1d1d1b]">{tx.category}</p>
                                                {tx.description && (
                                                    <p className="text-xs text-[#6b6b6b] truncate max-w-xs">{tx.description}</p>
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
                                                <button
                                                    onClick={() => handleDelete(tx.id)}
                                                    className="p-2 text-[#6b6b6b] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-[#6b6b6b] text-sm italic">
                                            Tidak ada transaksi yang ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
};
