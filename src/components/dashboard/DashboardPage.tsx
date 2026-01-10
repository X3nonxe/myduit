"use client";

import { TopCards } from "@/components/dashboard/TopCards";
import { MainChart } from "@/components/dashboard/MainChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { TransactionsView } from "@/components/dashboard/TransactionsView";
import { AccountsView } from "@/components/dashboard/AccountsView";
import { BudgetsView } from "@/components/dashboard/BudgetsView";
import { GoalsView } from "@/components/dashboard/GoalsView";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { SummaryAccounts } from "@/components/dashboard/SummaryAccounts";
import { SummaryBudgets } from "@/components/dashboard/SummaryBudgets";
import { SummaryGoals } from "@/components/dashboard/SummaryGoals";
import {
    Plus,
    LayoutDashboard,
    History,
    Settings,
    Bell,
    Search,
    Wallet,
    PieChart,
    Target,
    ArrowRight,
} from "lucide-react";
import { useFinanceStore } from "@/store/useFinanceStore";
import { AddTransactionModal } from "@/components/dashboard/AddTransactionModal";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { useState } from "react";

export default function DashboardPage() {
    const { setIsAddModalOpen } = useFinanceStore();
    const [activeTab, setActiveTab] = useState("Ringkasan");

    const navItems = [
        { icon: LayoutDashboard, label: "Ringkasan" },
        { icon: History, label: "Transaksi" },
        { icon: Wallet, label: "Akun & Kartu" },
        { icon: PieChart, label: "Anggaran" },
        { icon: Target, label: "Target" },
        { icon: Settings, label: "Pengaturan" },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case "Ringkasan":
                return (
                    <div className="p-8 max-w-7xl mx-auto space-y-10">
                        <section>
                            <div className="mb-6 flex justify-between items-end">
                                <div>
                                    <h1 className="text-3xl font-semibold text-[#1d1d1b]">Halo!</h1>
                                    <p className="text-[#6b6b6b] mt-1">Berikut adalah ringkasan keuangan pribadimu hari ini.</p>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs text-[#6b6b6b] uppercase font-bold tracking-widest">Waktu Lokal</p>
                                    <p className="text-sm font-medium text-[#1d1d1b]">
                                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <TopCards />
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <GlassCard className="p-5 border-[#e5e2da]">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-semibold text-[#1d1d1b]">Daftar Akun</h4>
                                    <button onClick={() => setActiveTab("Akun & Kartu")} className="text-xs text-[#d97757] font-medium hover:underline">Semua</button>
                                </div>
                                <SummaryAccounts />
                            </GlassCard>

                            <GlassCard className="p-5 border-[#e5e2da]">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-semibold text-[#1d1d1b]">Anggaran Bulan Ini</h4>
                                    <button onClick={() => setActiveTab("Anggaran")} className="text-xs text-[#d97757] font-medium hover:underline">Atur</button>
                                </div>
                                <SummaryBudgets />
                            </GlassCard>

                            <GlassCard className="p-5 border-[#e5e2da]">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-semibold text-[#1d1d1b]">Target Menabung</h4>
                                    <button onClick={() => setActiveTab("Target")} className="text-xs text-[#d97757] font-medium hover:underline">Tambah</button>
                                </div>
                                <SummaryGoals />
                            </GlassCard>
                        </section>

                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <MainChart />
                            </div>
                            <div className="lg:col-span-1">
                                <div className="mb-4 flex justify-between items-center">
                                    <h3 className="font-semibold text-[#1d1d1b]">Transaksi Terakhir</h3>
                                    <button onClick={() => setActiveTab("Transaksi")} className="text-xs text-[#d97757] font-medium hover:underline flex items-center gap-1">
                                        Lihat Semua <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                                <RecentTransactions />
                            </div>
                        </section>
                    </div>
                );
            case "Transaksi":
                return <div className="p-8 max-w-7xl mx-auto"><TransactionsView /></div>;
            case "Akun & Kartu":
                return <div className="p-8 max-w-7xl mx-auto"><AccountsView /></div>;
            case "Anggaran":
                return <div className="p-8 max-w-7xl mx-auto"><BudgetsView /></div>;
            case "Target":
                return <div className="p-8 max-w-7xl mx-auto"><GoalsView /></div>;
            case "Pengaturan":
                return <div className="p-8 max-w-4xl mx-auto"><SettingsView /></div>;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-[#f9f8f4] font-sans selection:bg-[#d97757]/20">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[#e5e2da] bg-[#f9f8f4] flex flex-col p-6 hidden lg:flex">
                <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => setActiveTab("Ringkasan")}>
                    <div className="w-8 h-8 bg-[#1d1d1b] rounded-lg flex items-center justify-center font-bold text-lg text-white">
                        M
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1b]">
                        MyDuitGua
                    </h1>
                </div>

                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => setActiveTab(item.label)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${activeTab === item.label
                                ? "bg-[#f1efea] text-[#1d1d1b] font-medium"
                                : "text-[#6b6b6b] hover:bg-[#f1efea] hover:text-[#1d1d1b]"
                                } font-semibold text-sm`}
                        >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-6 border-t border-[#e5e2da]">
                    <LogoutButton />
                </div>
            </aside>

            {/* Konten Utama */}
            <main className="flex-1 overflow-y-auto">
                <header className="px-8 py-6 border-b border-[#e5e2da] bg-[#f9f8f4]/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-black text-[#1d1d1b] uppercase tracking-wider">{activeTab}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]/50" />
                            <input
                                type="text"
                                placeholder="Cari sesuatu..."
                                className="bg-white border border-[#e5e2da] rounded-xl py-2 pl-10 pr-4 outline-none focus:border-[#d97757]/50 focus:ring-2 focus:ring-[#d97757]/10 transition-all text-sm w-64"
                            />
                        </div>

                        <button className="p-2.5 text-[#6b6b6b] hover:bg-[#f1efea] rounded-xl transition-all relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#d97757] rounded-full" />
                        </button>

                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 bg-[#1d1d1b] text-white rounded-xl text-sm font-bold hover:bg-[#333] transition-all flex items-center gap-2 shadow-lg shadow-black/5"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Catat Baru</span>
                        </button>
                    </div>
                </header>

                <div className="min-h-[calc(100vh-88px)]">
                    {renderContent()}
                </div>
            </main>

            <AddTransactionModal />
        </div>
    );
}
