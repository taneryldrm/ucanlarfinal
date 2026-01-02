"use client";

import { LogOut, User, ChevronLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole"; // Import hook

export function Header({ title }: { title?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const { role, profile, loading } = useUserRole(); // Use hook

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            toast.success("Çıkış yapıldı");
            router.push("/login");
            router.refresh();
        } catch (error) {
            toast.error("Çıkış yapılırken hata oluştu");
        }
    };

    const isHome = pathname === '/';

    return (
        <header className="flex h-20 items-center justify-between border-b bg-white px-4 md:px-8">
            <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <div className="md:hidden">
                    {!isHome && (
                        <Link href="/" className="flex items-center justify-center p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full">
                            <ChevronLeft className="h-6 w-6" />
                        </Link>
                    )}
                </div>
                {/* Logo/Title */}
                <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate max-w-[200px] md:max-w-none">
                    {title || "Yönetim Paneli"}
                </h2>
            </div>

            <div className="flex items-center gap-4">
                {/* User Profile */}
                <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 p-1 pl-4 pr-2">
                    <div className="flex flex-col items-end">
                        {loading ? (
                            <span className="text-xs text-slate-400">Yükleniyor...</span>
                        ) : (
                            <>
                                <span className="text-sm font-semibold text-slate-900">
                                    {profile?.full_name || profile?.name || profile?.email || "Kullanıcı"}
                                </span>
                                <span className="text-xs text-slate-500 capitalize">{role || "Yetkisiz"}</span>
                            </>
                        )}
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                        <User className="h-5 w-5" />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="ml-2 rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                        title="Çıkış Yap"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
