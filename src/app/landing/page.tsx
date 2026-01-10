"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    ArrowRight,
    ShieldCheck,
    Zap,
    BarChart3,
    Globe,
    Lock,
    CheckCircle2,
    PieChart,
    LineChart,
    Wallet
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

const FloatingIcon = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
    <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
    >
        {children}
    </motion.div>
);

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#f9f8f4] text-[#1d1d1b] selection:bg-[#d97757]/20 overflow-x-hidden">
            {/* Navbar Minimalis */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 bg-[#f9f8f4]/80 backdrop-blur-md border-b border-[#e5e2da]/50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1d1d1b] rounded-lg flex items-center justify-center font-bold text-white">M</div>
                        <span className="text-xl font-bold tracking-tight">MyDuitGua</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6b6b6b]">
                        <a href="#fitur" className="hover:text-[#1d1d1b] transition-colors">Fitur</a>
                        <a href="#performa" className="hover:text-[#1d1d1b] transition-colors">Performa</a>
                        <a href="#keamanan" className="hover:text-[#1d1d1b] transition-colors">Keamanan</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium hover:text-[#d97757] transition-colors">Masuk</Link>
                        <Link href="/register" className="px-5 py-2.5 bg-[#1d1d1b] text-white rounded-xl text-sm font-medium hover:bg-[#333] transition-all shadow-lg shadow-black/5 active:scale-[0.98]">
                            Mulai Sekarang
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-8 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#d97757]/5 to-transparent rounded-full blur-3xl opacity-50 -z-10" />

                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f1efea] border border-[#e5e2da] text-[#d97757] text-xs font-bold uppercase tracking-wider"
                    >
                        <Zap className="w-3 h-3" /> Edisi Performa Tinggi 2026
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.1] text-[#1d1d1b]"
                    >
                        Satu Ekosistem untuk <br />
                        <span className="text-[#d97757]">Kendali Finansial</span> Mutlak.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-[#6b6b6b] max-w-2xl mx-auto leading-relaxed"
                    >
                        MyDuitGua bukan sekadar pelacak pengeluaran. Ini adalah infrastruktur cerdas yang mensinkronkan aset, anggaran, dan target impian Anda dalam satu antarmuka yang elegan dan responsif.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                    >
                        <Link href="/register" className="group px-8 py-4 bg-[#1d1d1b] text-white rounded-2xl font-semibold flex items-center gap-3 hover:bg-[#333] transition-all shadow-xl shadow-black/10 hover:shadow-2xl">
                            Coba Gratis Sekarang <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="#performa" className="px-8 py-4 bg-white border border-[#e5e2da] text-[#1d1d1b] rounded-2xl font-semibold hover:bg-[#f1efea] transition-all shadow-sm">
                            Lihat Performa Data
                        </Link>
                    </motion.div>
                </div>

                {/* Hero Illustration Placeholder (Glassmorphism Cards) */}
                <div className="mt-24 max-w-7xl mx-auto relative px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-80 scale-95 md:scale-100 select-none pointer-events-none">
                        <FloatingIcon delay={0}><GlassCard className="p-8 border-[#e5e2da] bg-white/80 shadow-2xl"><Wallet className="w-8 h-8 mb-4 text-[#d97757]" /><h3 className="font-bold">Total Aset</h3><p className="text-2xl font-black mt-2">Rp 128.450.000</p></GlassCard></FloatingIcon>
                        <FloatingIcon delay={0.5}><GlassCard className="p-8 border-[#e5e2da] bg-white/80 shadow-2xl -translate-y-12"><LineChart className="w-8 h-8 mb-4 text-[#1d1d1b]" /><h3 className="font-bold">Pertumbuhan</h3><p className="text-2xl font-black mt-2">+12.4% / bln</p></GlassCard></FloatingIcon>
                        <FloatingIcon delay={1}><GlassCard className="p-8 border-[#e5e2da] bg-white/80 shadow-2xl"><PieChart className="w-8 h-8 mb-4 text-[#6b6b6b]" /><h3 className="font-bold">Sisa Anggaran</h3><p className="text-2xl font-black mt-2">Rp 4.200.000</p></GlassCard></FloatingIcon>
                    </div>
                </div>
            </section>

            {/* Metrics Section */}
            <section id="performa" className="py-32 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-sm font-bold text-[#d97757] uppercase tracking-[0.3em]">Performa & Reliabilitas</h2>
                                <h3 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1d1d1b]">Data Real-Time, Tanpa Kompromi.</h3>
                            </div>
                            <p className="text-[#6b6b6b] text-lg leading-relaxed">
                                Infrastruktur kami dibangun di atas teknologi serverless global yang menjamin kecepatan akses transaksi dalam milidetik. Anda tidak perlu menunggu data sinkron; sistem kami melakukannya secara instan.
                            </p>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="p-6 bg-[#f9f8f4] rounded-2xl border border-[#e5e2da]">
                                    <p className="text-4xl font-black text-[#1d1d1b] mb-1">99.99%</p>
                                    <p className="text-sm text-[#6b6b6b] font-medium uppercase tracking-wider">Uptime Global</p>
                                </div>
                                <div className="p-6 bg-[#f9f8f4] rounded-2xl border border-[#e5e2da]">
                                    <p className="text-4xl font-black text-[#d97757] mb-1">&lt;100ms</p>
                                    <p className="text-sm text-[#6b6b6b] font-medium uppercase tracking-wider">Latensi Data</p>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[#d97757]/10 blur-3xl rounded-full" />
                            <GlassCard className="p-10 border-[#e5e2da] bg-white relative z-10 shadow-3xl">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
                                    <div>
                                        <h4 className="font-bold text-[#1d1d1b]">Sistem Terverifikasi</h4>
                                        <p className="text-xs text-[#6b6b6b]">Audit Keamanan Rutin 2026</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {[
                                        { label: "Sinkronisasi Bank", status: "Operational" },
                                        { label: "Keamanan Enkripsi", status: "Active" },
                                        { label: "Cloud Backup", status: "Running" },
                                        { label: "Analitik Data", status: "Operational" }
                                    ].map(item => (
                                        <div key={item.label} className="flex justify-between items-center py-2 border-b border-[#f1efea]">
                                            <span className="text-sm font-medium text-[#1d1d1b]">{item.label}</span>
                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                {item.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </div>
            </section>

            {/* Complexity & Features Section */}
            <section id="fitur" className="py-32 bg-[#f9f8f4]">
                <div className="max-w-7xl mx-auto px-8 text-center space-y-20">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <h2 className="text-sm font-bold text-[#d97757] uppercase tracking-[0.3em]">Kompleksitas Tanpa Batas</h2>
                        <h3 className="text-4xl md:text-6xl font-semibold tracking-tight">Kekuatan Alat Profesional dalam Genggaman Anda.</h3>
                        <p className="text-[#6b6b6b] text-lg">MyDuitGua menggabungkan analitik mendalam dengan kemudahan penggunaan yang absolut.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: ShieldCheck,
                                title: "Enkripsi End-to-End",
                                desc: "Data finansial Anda dienkripsi menggunakan standar AES-256 militer sebelum disimpan di cloud."
                            },
                            {
                                icon: BarChart3,
                                title: "Analitik Tren",
                                desc: "Algoritma kami mempelajari pola pengeluaran Anda untuk memberikan saran penghematan otomatis."
                            },
                            {
                                icon: Globe,
                                title: "Akses Multi-Device",
                                desc: "Kelola keuangan dari laptop, tablet, atau smartphone dengan sinkronisasi instan antar perangkat."
                            },
                            {
                                icon: PieChart,
                                title: "Manajemen Anggaran",
                                desc: "Sistem pengingat cerdas yang memberitahu Anda sebelum anggaran bulanan melampaui batas."
                            },
                            {
                                icon: Wallet,
                                title: "Multi-Wallet Sync",
                                desc: "Pantau saldo BCA, Mandiri, GoPay, hingga Dompet Tunai dalam satu tampilan dashboard tunggal."
                            },
                            {
                                icon: Lock,
                                title: "Login Biometrik",
                                desc: "Akses cepat dan aman menggunakan FaceID atau Sidik Jari untuk perlindungan ekstra data pribadi."
                            }
                        ].map((f, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="p-8 bg-white border border-[#e5e2da] rounded-[2.5rem] text-left space-y-4 shadow-sm hover:shadow-xl transition-all duration-300"
                            >
                                <div className="w-12 h-12 bg-[#f1efea] rounded-2xl flex items-center justify-center text-[#1d1d1b]"><f.icon className="w-6 h-6" /></div>
                                <h4 className="text-xl font-bold">{f.title}</h4>
                                <p className="text-[#6b6b6b] text-sm leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-40 px-8 relative overflow-hidden bg-[#1d1d1b] text-white">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_#d9775755_0%,_transparent_70%)] opacity-30" />
                <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
                    <h2 className="text-5xl md:text-7xl font-semibold tracking-tight leading-tight">
                        Siap Mengambil Kendali Penuh Masa Depan Anda?
                    </h2>
                    <p className="text-white/60 text-xl leading-relaxed max-w-2xl mx-auto">
                        Bergabunglah dengan ribuan pengguna yang telah bertransformasi dari sekadar &quot;mengeluarkannya&quot; menjadi &quot;mengelolanya&quot; dengan MyDuitGua.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link href="/register" className="px-12 py-5 bg-white text-[#1d1d1b] rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-2xl">
                            Mulai Registrasi Gratis
                        </Link>
                        <Link href="/dashboard" className="px-12 py-5 bg-white/10 border border-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all">
                            Coba Demo Dashboard
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-8 border-t border-[#e5e2da] text-center space-y-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-[#1d1d1b] rounded-lg flex items-center justify-center font-bold text-white">M</div>
                    <span className="text-xl font-bold tracking-tight">MyDuitGua</span>
                </div>
                <p className="text-[#6b6b6b] text-sm">&copy; 2026 MyDuitGua Financial Infrastructure. Built for absolute precision.</p>
                <div className="flex items-center justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-[#6b6b6b]">
                    <a href="#" className="hover:text-[#1d1d1b]">Privacy Policy</a>
                    <a href="#" className="hover:text-[#1d1d1b]">Terms of Service</a>
                    <a href="#" className="hover:text-[#1d1d1b]">Cookie Settings</a>
                </div>
            </footer>
        </div>
    );
}
