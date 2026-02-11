"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { getAllTransactionsForExport } from "@/actions/transactions";
import { format } from "date-fns";

export const ExportButton = () => {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const result = await getAllTransactionsForExport();
            if (result.error || !result.data) {
                alert(result.error || "Gagal mengambil data transaksi");
                return;
            }
            
            const headers = ["Tanggal", "Tipe", "Kategori", "Jumlah", "Akun", "Deskripsi"];
            const csvRows = [headers.join(",")];

            result.data.forEach(tx => {
                const row = [
                    format(new Date(tx.date), "yyyy-MM-dd"),
                    tx.type,
                    `"${tx.category}"`,
                    tx.type === "EXPENSE" ? -tx.amount : tx.amount,
                    `"${tx.account?.name || '-'}"`,
                    `"${tx.description || '-'}"`
                ];
                csvRows.push(row.join(","));
            });

            const csvContent = csvRows.join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `myduitgua_transactions_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Terjadi kesalahan saat export data.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={loading}
            className="p-2.5 bg-white border border-[#e5e2da] rounded-xl text-[#6b6b6b] hover:bg-[#f1efea] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Export ke CSV"
        >
            <Download className={`w-4 h-4 ${loading ? "animate-bounce" : ""}`} />
            <span className="text-xs font-semibold hidden md:inline">Export</span>
        </button>
    );
};
