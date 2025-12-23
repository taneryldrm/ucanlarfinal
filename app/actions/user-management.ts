"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function updateUserPassword(userId: string, newPassword: string) {
    try {
        // 1. Check if the requester is an Admin
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, message: "Oturum açmanız gerekiyor." };
        }

        // Check role from profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || profile?.role !== 'sistem yöneticisi') {
            return { success: false, message: "Bu işlem için yetkiniz yok." };
        }

        // 2. Perform Password Update using Admin Client
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("SUPABASE_SERVICE_ROLE_KEY is missing");
            return { success: false, message: "Sunucu yapılandırma hatası: Servis anahtarı eksik." };
        }

        const supabaseAdmin = createAdminClient();

        const { error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (error) {
            console.error("Supabase Admin Update Error:", error);
            return { success: false, message: error.message };
        }

        return { success: true, message: "Şifre başarıyla güncellendi." };
    } catch (error) {
        console.error("Unexpected error in updateUserPassword:", error);
        return { success: false, message: "Beklenmeyen bir hata oluştu: " + (error as Error).message };
    }
}
