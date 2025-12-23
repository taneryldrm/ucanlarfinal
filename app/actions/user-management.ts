"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function updateUserPassword(userId: string, newPassword: string) {
    // 1. Check if the requester is an Admin
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: "Oturum açmanız gerekiyor." };
    }

    // Check role from profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'sistem yöneticisi') {
        return { success: false, message: "Bu işlem için yetkiniz yok." };
    }

    // 2. Perform Password Update using Admin Client
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
    );

    if (error) {
        return { success: false, message: error.message };
    }

    return { success: true, message: "Şifre başarıyla güncellendi." };
}
