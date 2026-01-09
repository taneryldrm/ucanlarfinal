"use client";

import { LogOut, User, ChevronLeft, Palette } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useTheme } from "@/components/ThemeProvider";

export function Header({ title }: { title?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const { role, profile, loading } = useUserRole();
    const { theme, toggleTheme } = useTheme();

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
        <header className="flex h-20 items-center justify-between border-b bg-card px-4 md:px-8 transition-colors duration-300">
            <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <div className="md:hidden">
                    {!isHome && (
                        <Link href="/" className="flex items-center justify-center p-2 -ml-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
                            <ChevronLeft className="h-6 w-6" />
                        </Link>
                    )}
                </div>
                {/* Logo/Title */}
                <h2 className="text-lg md:text-xl font-bold text-foreground truncate max-w-[200px] md:max-w-none">
                    {title || "Yönetim Paneli"}
                </h2>
            </div>

            <div className="flex items-center gap-4">
                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all duration-300 ${theme === "purple"
                            ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-600"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                    title={theme === "purple" ? "Varsayılan Temaya Geç" : "Mor Temaya Geç"}
                >
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">
                        {theme === "purple" ? "Mor Tema" : "Tema"}
                    </span>
                </button>

                {/* User Profile */}
                <div className="flex items-center gap-3 rounded-full border border-border bg-muted p-1 pl-4 pr-2 transition-colors duration-300">
                    <div className="flex flex-col items-end">
                        {loading ? (
                            <span className="text-xs text-muted-foreground">Yükleniyor...</span>
                        ) : (
                            <>
                                <span className="text-sm font-semibold text-foreground">
                                    {profile?.full_name || profile?.name || profile?.email || "Kullanıcı"}
                                </span>
                                <span className="text-xs text-muted-foreground capitalize">{role || "Yetkisiz"}</span>
                            </>
                        )}
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors duration-300">
                        <User className="h-5 w-5" />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="ml-2 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        title="Çıkış Yap"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
