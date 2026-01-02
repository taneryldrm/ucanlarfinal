"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { UserRole } from "@/lib/rbac";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useUserRole() {
    const [role, setRole] = useState<UserRole | null>(null);
    const [profile, setProfile] = useState<any>(null); // Add profile state
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function fetchRole() {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setLoading(false);
                    return;
                }

                if (user) {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('*') // Select all fields to get name/full_name
                        .eq('id', user.id)
                        .single();

                    if (error || !profile) {
                        console.error("User found but no profile (Zombie User). Logging out...");
                        // If user exists but no profile, force logout to fix "Yetkisiz" state
                        await supabase.auth.signOut();
                        toast.error("Kullanıcı profili bulunamadı, lütfen tekrar giriş yapın.");
                        router.push("/login");
                        router.refresh();
                        return;
                    }

                    if (profile) {
                        setRole(profile.role as UserRole);
                        setProfile(profile);
                    }
                }
            } catch (error) {
                console.error("Error fetching role:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchRole();
    }, []);

    return { role, profile, loading };
}
