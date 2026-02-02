"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { useState } from "react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    errorMessage?: string | null;
}

export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Konfirmasi",
    message = "Apakah Anda yakin ingin melanjutkan?",
    confirmText = "Ya, Lanjutkan",
    cancelText = "Batal",
    variant = "danger",
    errorMessage,
}: ConfirmModalProps) => {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error("Confirm action failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const variantStyles = {
        danger: {
            icon: "bg-rose-50 text-rose-600",
            button: "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500",
        },
        warning: {
            icon: "bg-amber-50 text-amber-600",
            button: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
        },
        info: {
            icon: "bg-blue-50 text-blue-600",
            button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
        },
    };

    const styles = variantStyles[variant];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#1d1d1b]/20 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md z-10"
                    >
                        <GlassCard className="p-6 border-[#e5e2da] shadow-2xl bg-white">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 hover:bg-[#f1efea] rounded-full transition-colors group"
                            >
                                <X className="w-4 h-4 text-[#6b6b6b] group-hover:text-[#1d1d1b]" />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", delay: 0.1 }}
                                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${styles.icon}`}
                                >
                                    <AlertTriangle className="w-8 h-8" />
                                </motion.div>

                                <h3 className="text-xl font-semibold text-[#1d1d1b] mb-2">
                                    {title}
                                </h3>
                                <p className="text-[#6b6b6b] text-sm mb-6 max-w-xs">
                                    {message}
                                </p>

                                {errorMessage && (
                                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg w-full">
                                        <p className="text-rose-600 text-sm font-medium">{errorMessage}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={onClose}
                                        disabled={loading}
                                        className="flex-1 py-3 px-4 bg-[#f1efea] hover:bg-[#e5e2da] text-[#1d1d1b] rounded-xl font-medium transition-all disabled:opacity-50"
                                    >
                                        {cancelText}
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={loading}
                                        className={`flex-1 py-3 px-4 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${styles.button}`}
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            confirmText
                                        )}
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
