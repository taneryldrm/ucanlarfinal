"use client";

import { Header } from "@/components/Header";
import {
    Plus,
    TrendingUp,
    Wallet,
    CreditCard,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDashboardStats, getUpcomingSchedule, searchGeneral } from "@/lib/supabaseQueries";
import { useUserRole } from "@/hooks/useUserRole";
import { canAccessRoute } from "@/lib/rbac";
import { menuItems } from "@/components/Sidebar";
import { useTheme } from "@/components/ThemeProvider";

export default function Home() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpense: 0,
        netProfit: 0,
        pendingCollection: 0
    });
    const [upcomingDays, setUpcomingDays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { role } = useUserRole();
    const { theme } = useTheme();
    const isPurple = theme === "purple";

    const router = useRouter();
    const searchRef = useRef<HTMLDivElement>(null);

    // Identify Restricted Roles (Drivers shouldn't see Financial Dashboard)
    const isDriver = role === 'şoför';

    useEffect(() => {
        async function loadDashboardData() {
            try {
                // If Driver, skip fetching stats to save resources and security
                if (isDriver) {
                    setLoading(false);
                    return;
                }

                const [statsResult, scheduleData] = await Promise.all([
                    getDashboardStats(),
                    getUpcomingSchedule()
                ]);

                if (statsResult.data) {
                    setStats(statsResult.data);
                }

                // Process Schedule Data
                if (scheduleData && scheduleData.data) {
                    const scheduleMap = scheduleData.data;
                    const daysArray = [];
                    const today = new Date();

                    for (let i = 0; i < 10; i++) {
                        const d = new Date(today);
                        d.setDate(today.getDate() + i);
                        const dateStr = d.toISOString().split('T')[0];

                        const jobs = scheduleMap[dateStr] || [];
                        const uniquePersonnel = new Set();

                        jobs.forEach(job => {
                            if (job.work_order_assignments) {
                                job.work_order_assignments.forEach(a => {
                                    if (a.personnel_id) uniquePersonnel.add(a.personnel_id);
                                    else if (a.personnel?.id) uniquePersonnel.add(a.personnel.id);
                                });
                            }
                        });

                        daysArray.push({
                            id: i,
                            day: d.getDate(),
                            date: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }),
                            jobs: jobs.length,
                            personnel: uniquePersonnel.size,
                            isToday: i === 0
                        });
                    }
                    setUpcomingDays(daysArray);
                }
            } catch (error) {
                console.error("Dashboard data load error:", error);
            } finally {
                setLoading(false);
            }
        }

        // Only load if role is determined (or regardless, but checking role inside makes sense if role is available immediately)
        // Adding 'role' dependency ensures it refetches or cancels correctly.
        if (role !== null) {
            loadDashboardData();
        }
    }, [role, isDriver]);

    // Safety net: redirect to login if loading is done but role is still null
    useEffect(() => {
        if (!loading && role === null) {
            router.push('/login');
        }
    }, [loading, role, router]);

    // Handle Click Outside to close search results
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchResults([]);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            const results = await searchGeneral(query);
            // Filter only customers for the dashboard quick search if needed, or use as is
            // searchGeneral returns specific structure, we map it to dashboard needs
            setSearchResults(results.filter(r => r.source === 'Müşteri').map(r => ({
                id: r.id,
                name: r.name,
                phone: r.description.split('|')[0].replace('Telefon:', '').trim()
            })));
        } else {
            setSearchResults([]);
        }
    };

    return (
        <>
            <Header title="Yönetim Paneli" />

            {/* GRID MENU 
                - Mobile: Always Visible (block md:hidden)
                - Desktop: Visible ONLY if Driver (md:block if isDriver)
            */}
            <div className={cn(
                "p-4",
                isDriver ? "block" : "block md:hidden"
            )}>
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">Menü</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {menuItems
                        .filter((item: any) => canAccessRoute(role || undefined, item.href))
                        .filter((item: any) => item.href !== '/') // Don't show Dashboard link in Grid Menu
                        .map((item: any) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-3 rounded-xl border p-6 shadow-sm transition-all hover:shadow-md active:scale-95",
                                    isPurple
                                        ? "border-purple-200 bg-card hover:bg-purple-50"
                                        : "border-border bg-card hover:bg-muted"
                                )}
                            >
                                <div className={cn(
                                    "flex h-12 w-12 items-center justify-center rounded-full",
                                    isPurple ? "bg-purple-100 text-purple-600" : "bg-blue-50 text-blue-600"
                                )}>
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <span className="font-bold text-foreground text-sm">{item.name}</span>
                            </Link>
                        ))}
                </div>
            </div>

            {/* DESKTOP DASHBOARD - Visible only on desktop (md+) AND NOT Driver */}
            {!isDriver && (
                <div className="hidden md:block p-8">

                    {/* Dashboard Header Section */}
                    <div className="mb-8 flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
                        <Link
                            href="/is-emirleri?new=true"
                            className={cn(
                                "flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition-colors",
                                isPurple
                                    ? "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20"
                                    : "bg-blue-600 hover:bg-blue-700"
                            )}
                        >
                            <Plus className="h-4 w-4" />
                            Yeni İş Emri
                        </Link>
                    </div>

                    {/* Stats Cards */}
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

                        {/* Card 1: Toplam Gelir */}
                        <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-colors duration-300">
                            <div className="mb-4 text-sm font-medium text-muted-foreground">Toplam Gelir</div>
                            <div className="flex items-end justify-between">
                                <div className="text-2xl font-bold text-green-600">
                                    ₺{stats.totalIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </div>
                                <TrendingUp className="h-6 w-6 text-green-500" />
                            </div>
                        </div>

                        {/* Card 2: Toplam Gider */}
                        <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-colors duration-300">
                            <div className="mb-4 text-sm font-medium text-muted-foreground">Toplam Gider</div>
                            <div className="flex items-end justify-between">
                                <div className="text-2xl font-bold text-red-600">
                                    ₺{stats.totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </div>
                                <Wallet className="h-6 w-6 text-red-500" />
                            </div>
                        </div>

                        {/* Card 3: Net Kar */}
                        <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-colors duration-300">
                            <div className="mb-4 text-sm font-medium text-muted-foreground">Net Kar</div>
                            <div className="flex items-end justify-between">
                                <div className={cn(
                                    "text-2xl font-bold",
                                    stats.netProfit >= 0 ? (isPurple ? "text-purple-600" : "text-blue-600") : "text-red-600"
                                )}>
                                    ₺{stats.netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </div>
                                <TrendingUp className={cn("h-6 w-6", isPurple ? "text-purple-500" : "text-blue-500")} />
                            </div>
                        </div>

                        {/* Card 4: Bekleyen Tahsilat */}
                        <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-colors duration-300">
                            <div className="mb-4 text-sm font-medium text-muted-foreground">Bekleyen Tahsilat</div>
                            <div className="flex items-end justify-between">
                                <div className="text-2xl font-bold text-orange-500">
                                    ₺{stats.pendingCollection.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </div>
                                <CreditCard className="h-6 w-6 text-orange-500" />
                            </div>
                        </div>

                    </div>

                    {/* Upcoming Jobs List */}
                    <div className="rounded-xl border border-border bg-card shadow-sm transition-colors duration-300">
                        <div className="border-b border-border p-6">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                                <span className="text-muted-foreground">📅</span> Önümüzdeki 10 Günde Çalışacak Personel
                            </h3>
                        </div>

                        <div className="p-6">
                            {/* Table Header */}
                            <div className="mb-4 grid grid-cols-12 px-4 text-sm font-medium text-muted-foreground">
                                <div className="col-span-1">Gün</div>
                                <div className="col-span-11 md:col-span-5">Tarih</div>
                                <div className="hidden md:block col-span-3 text-right">İş Emri</div>
                                <div className="hidden md:block col-span-3 text-right">Personel</div>
                            </div>

                            {/* List Items */}
                            <div className="space-y-2">
                                {loading ? (
                                    <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
                                ) : upcomingDays.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">Yaklaşan iş bulunamadı.</div>
                                ) : (
                                    upcomingDays.map((day) => (
                                        <div
                                            key={day.id}
                                            className={cn(
                                                "grid grid-cols-12 items-center rounded-lg px-4 py-4 transition-colors",
                                                day.isToday
                                                    ? isPurple ? "bg-purple-100/50" : "bg-blue-50/50"
                                                    : "hover:bg-muted"
                                            )}
                                        >
                                            <div className="col-span-2 md:col-span-1">
                                                <div className={cn(
                                                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                                                    day.isToday
                                                        ? isPurple ? "bg-purple-600 text-white" : "bg-blue-600 text-white"
                                                        : "bg-secondary text-secondary-foreground"
                                                )}>
                                                    {day.day}
                                                </div>
                                            </div>
                                            <div className="col-span-10 md:col-span-5 flex items-center gap-2">
                                                {day.isToday && (
                                                    <span className={cn(
                                                        "rounded px-2 py-0.5 text-xs font-bold",
                                                        isPurple ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                                    )}>Bugün</span>
                                                )}
                                                <span className={cn("font-medium", day.isToday ? "text-foreground" : "text-muted-foreground")}>
                                                    {day.date}
                                                </span>
                                            </div>
                                            <div className="col-span-6 md:col-span-3 text-right text-sm font-medium text-muted-foreground mt-2 md:mt-0">
                                                📄 {day.jobs} iş emri
                                            </div>
                                            <div className="col-span-6 md:col-span-3 text-right text-sm font-medium text-muted-foreground mt-2 md:mt-0">
                                                👤 {day.personnel} personel
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {/* Fast Customer Search */}
                            <div className="mt-8 relative" ref={searchRef}>
                                <h3 className="text-sm font-bold text-muted-foreground mb-3 ml-1">Hızlı Müşteri Arama</h3>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearch}
                                        placeholder="Müşteri ara..."
                                        className={cn(
                                            "w-full rounded-xl border bg-card py-4 pl-12 pr-4 text-base text-foreground shadow-sm outline-none transition-all placeholder:text-muted-foreground",
                                            isPurple
                                                ? "border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                                                : "border-border focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        )}
                                    />
                                </div>

                                {/* Search Dropdown */}
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-border shadow-xl overflow-hidden z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {searchResults.map((result) => (
                                            <button
                                                key={result.id}
                                                onClick={() => router.push(`/musteriler?search=${result.name}`)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors border-b border-border last:border-0 text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg",
                                                        isPurple ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                                                    )}>
                                                        {result.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground">{result.name}</p>
                                                        <p className="text-sm text-muted-foreground">{result.phone}</p>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "text-xs font-bold px-2 py-1 rounded",
                                                    isPurple ? "text-purple-600 bg-purple-50" : "text-blue-600 bg-blue-50"
                                                )}>
                                                    Detaya Git
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                </div>
            )}
        </>
    );
}
