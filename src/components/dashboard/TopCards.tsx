"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { getTransactionSummary } from "@/actions/transactions";

export const TopCards = () => {
    const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getTransactionSummary();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch summary:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const cards = [
        {
            title: "Saldo Total",
            amount: stats.balance,
            icon: Wallet,
            color: "text-[#1d1d1b]",
            bg: "bg-[#f1efea]",
        },
        {
            title: "Pemasukan",
            amount: stats.income,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            title: "Pengeluaran",
            amount: stats.expense,
            icon: TrendingDown,
            color: "text-[#d97757]",
            bg: "bg-rose-50",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card) => (
                <GlassCard key={card.title} className="p-6 border-[#e5e2da] hover:shadow-xl transition-all duration-300 bg-white">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.bg} ${card.color}`}>
                            <card.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider">
                                {card.title}
                            </p>
                            {loading ? (
                                <div className="h-6 w-24 bg-[#f1efea] animate-pulse rounded mt-1" />
                            ) : (
                                <h3 className={`text-xl font-bold mt-1 ${card.color}`}>
                                    {formatCurrency(card.amount)}
                                </h3>
                            )}
                        </div>
                    </div>
                </GlassCard>
            ))}
        </div>
    );
};
