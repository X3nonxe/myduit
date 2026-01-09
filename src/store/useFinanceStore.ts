import { create } from "zustand";

interface Transaction {
    id: string;
    amount: number;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    category: string;
    date: Date;
    description?: string;
}

interface FinanceState {
    filterType: "week" | "month" | "year";
    setFilterType: (type: "week" | "month" | "year") => void;
    isAddModalOpen: boolean;
    setIsAddModalOpen: (isOpen: boolean) => void;
    transactions: Transaction[];
    setTransactions: (txs: Transaction[]) => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
    filterType: "month",
    setFilterType: (type) => set({ filterType: type }),
    isAddModalOpen: false,
    setIsAddModalOpen: (isOpen) => set({ isAddModalOpen: isOpen }),
    transactions: [],
    setTransactions: (txs) => set({ transactions: txs }),
}));
