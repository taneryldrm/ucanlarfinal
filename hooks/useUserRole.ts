"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { UserRole } from "@/lib/rbac";

export function useUserRole() {
    const [role, setRole] = useState<UserRole | null>(null);
    const [profile, setProfile] = useState<any>(null); // Add profile state
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchRole() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*') // Select all fields to get name/full_name
                        .eq('id', user.id)
                        .single();

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
