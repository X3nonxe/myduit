"use client";

import { useEffect, useState } from "react";
import { getGoals } from "@/actions/goals";
import { Loader2 } from "lucide-react";

interface Goal {
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
}

export const SummaryGoals = () => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getGoals();
                setGoals(data.goals.slice(0, 1));
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
        <div className="space-y-3">
            {goals.length > 0 ? (
                goals.map((goal) => {
                    const percentage = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                    return (
                        <div key={goal.id} className="bg-[#1d1d1b] text-white p-4 rounded-xl">
                            <p className="text-[10px] opacity-60 uppercase font-bold mb-1">{goal.name}</p>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-lg font-bold italic tracking-tight">{formatIDR(goal.target_amount)}</p>
                                    <p className="text-[10px] opacity-60">Terkumpul: {formatIDR(goal.current_amount)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black">{Math.round(percentage)}%</p>
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="text-center py-4 bg-[#f9f8f4] rounded-lg border border-dashed border-[#e5e2da]">
                    <p className="text-[10px] text-[#6b6b6b]">Belum ada target.</p>
                </div>
            )}
        </div>
    );
};
