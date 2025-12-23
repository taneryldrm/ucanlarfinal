"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function updateUserPassword(userId: string, newPassword: string) {
    console.log("updateUserPassword called for userId:", userId);

    try {
        // 0. Safe Check Env Vars
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            console.error("Missing Env Vars: URL or SERVICE_KEY");
            return { success: false, message: "Sunucu hatası: Yapılandırma eksik (Key/URL)." };
        }

        // 1. Check if the requester is an Admin
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error("Auth Error:", authError);
            return { success: false, message: "Oturum açmanız gerekiyor." };
        }

        // Check role from profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error("Profile Fetch Error:", profileError);
            return { success: false, message: "Kullanıcı profili alınamadı." };
        }

        if (profile?.role !== 'sistem yöneticisi') {
            return { success: false, message: "Bu işlem için yetkiniz yok." };
        }

        // 2. Perform Password Update using Admin Client
        // We create the admin client here directly to avoid external dependency issues
        const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const { error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (error) {
            console.error("Supabase Admin Update Error:", error);
            return { success: false, message: "Güncelleme hatası: " + error.message };
        }

        return { success: true, message: "Şifre başarıyla güncellendi." };

    } catch (error: any) {
        console.error("CRITICAL ERROR in updateUserPassword:", error);
        return {
            success: false,
            message: "Beklenmeyen sunucu hatası: " + (error?.message || "Bilinmiyor")
        };
    }
}
