"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    BarChart3,
    Users,
    UserCheck,
    ClipboardList,
    CalendarDays,
    Wallet,
    Coins,
    CreditCard,
    History,
    Calendar,
    ArrowRightLeft,
    Bot,
    Settings,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { canAccessRoute } from "@/lib/rbac";

export const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Raporlama", href: "/raporlama", icon: BarChart3 },
    { name: "Müşteriler", href: "/musteriler", icon: Users },
    { name: "Personel", href: "/personel", icon: UserCheck },
    { name: "İş Emirleri", href: "/is-emirleri", icon: ClipboardList },
    { name: "Günlük Program", href: "/gunluk-program", icon: CalendarDays },
    { name: "Personel Yevmiye", href: "/personel-yevmiye", icon: Wallet },
    { name: "Günlük Kasa", href: "/gunluk-kasa", icon: Coins },
    { name: "Bekleyen Tahsilatlar", href: "/bekleyen-tahsilatlar", icon: CreditCard },
    { name: "Geçmiş Arama", href: "/gecmis-arama", icon: History },
    { name: "Takvim", href: "/takvim", icon: Calendar },
    { name: "Gelir/Gider", href: "/gelir-gider", icon: ArrowRightLeft },
    { name: "AI Randevu", href: "/ai-randevu", icon: Bot },
    { name: "Kullanıcılar", href: "/kullanicilar", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { role, loading } = useUserRole();

    return (
        <div className="flex h-screen w-64 flex-col bg-[#0f172a] text-white print:hidden">
            {/* Brand Logo - Updated to match image roughly */}
            <div className="flex items-center gap-3 px-6 py-8">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500">
                    <Sparkles className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-lg font-bold leading-none">Uçanlar</h1>
                    <p className="text-xs text-slate-400">Temizlik Hizmetleri</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-slate-700">
                {loading ? (
                    <div className="px-4 text-xs text-slate-500">Menü yükleniyor...</div>
                ) : (
                    menuItems
                        .filter(item => canAccessRoute(role || undefined, item.href))
                        .map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400")} />
                                    {item.name}
                                </Link>
                            );
                        })
                )}
            </nav>
        </div>
    );
}
