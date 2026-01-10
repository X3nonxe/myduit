"use client";

import { useEffect, useState } from "react";
import { getBudgets } from "@/actions/budgets";
import { Loader2 } from "lucide-react";

interface Budget {
    id: string;
    category: string;
    amount: number;
}

export const SummaryBudgets = () => {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getBudgets();
                setBudgets(data.slice(0, 2));
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatIDR = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) return <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#d97757]" /></div>;

    return (
        <div className="space-y-4">
            {budgets.length > 0 ? (
                budgets.map((budget) => {
                    const used = 0; // Mock until we have aggregation
                    const percentage = Math.min((used / budget.amount) * 100, 100);
                    return (
                        <div key={budget.id} className="space-y-2">
                            <div className="flex justify-between text-[11px]">
                                <span className="text-[#1d1d1b] font-medium">{budget.category}</span>
                                <span className="text-[#6b6b6b]">{formatIDR(budget.amount)}</span>
                            </div>
                            <div className="h-1.5 w-full bg-[#f1efea] rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${percentage > 80 ? 'bg-rose-500' : 'bg-[#1d1d1b]'}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="text-center py-4 bg-[#f9f8f4] rounded-lg border border-dashed border-[#e5e2da]">
                    <p className="text-[10px] text-[#6b6b6b]">Belum ada anggaran.</p>
                </div>
            )}
        </div>
    );
};
