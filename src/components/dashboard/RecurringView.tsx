"use client";

import { useState } from "react";
import { RecurringList } from "@/components/recurring/recurring-list";
import { RecurringForm } from "@/components/recurring/recurring-form";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RecurringTransaction } from "@prisma/client";

export const RecurringView = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleEdit = (transaction: RecurringTransaction) => {
        setEditingTransaction(transaction);
        setIsFormOpen(true);
    };

    const handleSuccess = () => {
        setIsFormOpen(false);
        setEditingTransaction(null);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleClose = () => {
        setIsFormOpen(false);
        setEditingTransaction(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1d1d1b]">Transaksi Berulang</h1>
                    <p className="text-[#6b6b6b]">Kelola langganan dan tagihan otomatis Anda</p>
                </div>
                <button
                    onClick={() => {
                        setEditingTransaction(null);
                        setIsFormOpen(true);
                    }}
                    className="flex items-center gap-2 bg-[#1d1d1b] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#333] transition-all shadow-lg shadow-black/5 active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Jadwal</span>
                </button>
            </div>

            <RecurringList onEdit={handleEdit} refreshTrigger={refreshTrigger} />

            <AnimatePresence>
                {isFormOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                            className="absolute inset-0 bg-[#1d1d1b]/20 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-lg z-10"
                        >
                            <RecurringForm
                                onClose={handleClose}
                                onSuccess={handleSuccess}
                                initialData={editingTransaction}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
