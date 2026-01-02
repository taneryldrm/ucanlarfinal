"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);

    // Initialize Supabase client
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const checkUser = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                // 1. If no session and not on login page, redirect to login
                if (!session) {
                    if (pathname !== "/login") {
                        router.replace("/login");
                    } else {
                        setIsLoading(false);
                    }
                    return;
                }

                // 2. If session exists
                if (session) {
                    // If on login page, redirect to dashboard
                    if (pathname === "/login") {
                        router.replace("/");
                        return;
                    }

                    // Fetch profile for role-based access control
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("role")
                        .eq("id", session.user.id)
                        .single();

                    if (!profile) {
                        // Invalid profile, treat as unauth
                        if (pathname !== "/login") router.replace("/login");
                        setIsLoading(false);
                        return;
                    }

                    const userRole = profile.role;

                    // Role-based Redirect Logic (Mirrors previous middleware.ts)
                    if (userRole === "şoför") {
                        // Driver allow list: Home or Daily Program
                        const isAllowed = pathname === '/' || pathname === '/gunluk-program' || pathname.startsWith('/gunluk-program');
                        if (!isAllowed) {
                            router.replace("/gunluk-program"); // Default driver page
                            return;
                        }
                        // Specific fix: Drivers on root go to daily program
                        if (pathname === '/') {
                            router.replace("/gunluk-program");
                            return;
                        }
                    }

                    if (userRole === "veri girici") {
                        if (pathname.startsWith('/kullanicilar')) {
                            router.replace("/");
                            return;
                        }
                    }

                    if (userRole === "saha sorumlusu") {
                        if (pathname.startsWith('/raporlama') || pathname.startsWith('/gelir-gider') || pathname.startsWith('/kullanicilar')) {
                            router.replace("/");
                            return;
                        }
                    }
                }

                setIsLoading(false);
            } catch (error) {
                console.error("Auth check error:", error);
                setIsLoading(false);
            }
        };

        checkUser();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                router.replace('/login');
            } else if (event === 'SIGNED_IN' && pathname === '/login') {
                router.replace('/');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [pathname, router, supabase]);

    // Show nothing or a loading spinner while checking auth
    // You can customize this loading state
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {children}
            <Toaster />
        </>
    );
}
