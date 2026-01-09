"use client";

import { useEffect, useState } from "react";
import { getAccounts } from "@/actions/accounts";
import { Loader2, Plus } from "lucide-react";

export const SummaryAccounts = ({ onSeeAll }: { onSeeAll: () => void }) => {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getAccounts();
                setAccounts(data.slice(0, 3));
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
            {accounts.length > 0 ? (
                accounts.map((account) => (
                    <div key={account.id} className="flex justify-between items-center bg-[#f9f8f4] p-3 rounded-lg border border-[#e5e2da]">
                        <div>
                            <p className="text-xs font-medium text-[#1d1d1b]">{account.name}</p>
                            <p className="text-[10px] text-[#6b6b6b]">{account.type}</p>
                        </div>
                        <p className="text-xs font-semibold text-[#1d1d1b]">{formatIDR(account.balance)}</p>
                    </div>
                ))
            ) : (
                <div className="text-center py-4 bg-[#f9f8f4] rounded-lg border border-dashed border-[#e5e2da]">
                    <p className="text-[10px] text-[#6b6b6b]">Belum ada akun.</p>
                </div>
            )}
        </div>
    );
};
