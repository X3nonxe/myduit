"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/actions/transactions";
import { Loader2 } from "lucide-react";

const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const formatCompactIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
        notation: "compact",
        compactDisplay: "short",
        style: "currency",
        currency: "IDR",
    }).format(value);
};

export const MainChart = () => {
    const { filterType, setFilterType } = useFinanceStore();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const stats = await getDashboardStats(filterType);
                setData(stats as any);
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filterType]);

    return (
        <GlassCard className="h-[400px] flex flex-col border-[#e5e2da] p-8 bg-white overflow-hidden relative">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="font-semibold text-[#1d1d1b]">Ringkasan Aktivitas</h3>
                    <p className="text-[#6b6b6b] text-xs">Visualisasi pemasukan vs pengeluaran</p>
                </div>
                <div className="flex bg-[#f1efea] rounded-lg p-1 border border-[#e5e2da]">
                    {(["week", "month", "year"] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${filterType === type
                                ? "bg-white text-[#1d1d1b] shadow-sm border border-[#e5e2da]"
                                : "text-[#6b6b6b] hover:text-[#1d1d1b]"
                                }`}
                        >
                            {type === "week" ? "Mingguan" : type === "month" ? "Bulanan" : "Tahunan"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                {loading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#d97757]" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-[#6b6b6b] text-sm italic">
                        Belum ada data transaksi untuk periode ini.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e5e2da"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="name"
                                stroke="#6b6b6b"
                                fontSize={11}
                                fontWeight={500}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#6b6b6b"
                                fontSize={11}
                                fontWeight={500}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => formatCompactIDR(value)}
                            />
                            <Tooltip
                                cursor={{ fill: "#f1efea" }}
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e5e2da",
                                    borderRadius: "12px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                    fontSize: "12px",
                                    color: "#1d1d1b",
                                }}
                                formatter={(value: any, name: any) => [
                                    formatIDR(Number(value) || 0),
                                    String(name) === "income" ? "Pemasukan" : "Pengeluaran",
                                ]}
                            />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                iconType="circle"
                                wrapperStyle={{ paddingBottom: "20px", fontSize: "12px" }}
                                formatter={(value) => (value === "income" ? "Pemasukan" : "Pengeluaran")}
                            />
                            <Bar
                                dataKey="income"
                                name="income"
                                fill="#1d1d1b"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                            <Bar
                                dataKey="expense"
                                name="expense"
                                fill="#d97757"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </GlassCard>
    );
};
