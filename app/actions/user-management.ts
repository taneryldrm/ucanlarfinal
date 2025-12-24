"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function updateUserPassword(userId: string, newPassword: string) {
    console.log("updateUserPassword called for userId:", userId);

    try {
        // 0. Safe Check Env Vars
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl) {
            console.error("Missing Env Var: NEXT_PUBLIC_SUPABASE_URL");
            return { success: false, message: "Sunucu hatası: NEXT_PUBLIC_SUPABASE_URL eksik." };
        }
        if (!serviceRoleKey) {
            console.error("Missing Env Var: SUPABASE_SERVICE_ROLE_KEY");
            return { success: false, message: "Sunucu hatası: SUPABASE_SERVICE_ROLE_KEY eksik. Lütfen Hostinger panelinden ekleyin." };
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

export async function createUser(userData: any) {
    try {
        // 0. Safe Check Env Vars
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl) {
            console.error("Missing Env Var: NEXT_PUBLIC_SUPABASE_URL");
            return { success: false, message: "Sunucu hatası: NEXT_PUBLIC_SUPABASE_URL eksik." };
        }
        if (!serviceRoleKey) {
            console.error("Missing Env Var: SUPABASE_SERVICE_ROLE_KEY");
            return { success: false, message: "Sunucu hatası: SUPABASE_SERVICE_ROLE_KEY eksik." };
        }

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

        // 2. Create Auth User using Admin Client
        const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Parse role for DB
        const mapRoleToDb = (role: string) => {
            switch (role) {
                case 'Yönetici': return 'sistem yöneticisi';
                case 'Sekreter': return 'sekreter';
                case 'Saha Sorumlusu': return 'saha sorumlusu';
                case 'Şoför': return 'şoför';
                case 'Veri Girici': return 'veri girici';
                default: return role?.toLowerCase();
            }
        };

        const dbRole = mapRoleToDb(userData.role);

        // Create Auth User
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: {
                full_name: userData.name
            }
        });

        if (createError) {
            console.error("Auth Create Error:", createError);
            return { success: false, message: "Kullanıcı oluşturulamadı: " + createError.message };
        }

        if (!newUser.user) {
            return { success: false, message: "Kullanıcı oluşturuldu ama ID alınamadı." };
        }

        // 3. Create Profile linked to Auth ID
        const { error: profileInsertError } = await supabaseAdmin
            .from('profiles')
            .insert([{
                id: newUser.user.id, // LINK TO AUTH ID
                full_name: userData.name,
                email: userData.email,
                role: dbRole,
                phone: userData.phone || null,
                status: 'active'
            }]);

        if (profileInsertError) {
            console.error("Profile Create Error:", profileInsertError);
            // Optional: Rollback auth user? 
            // await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
            return { success: false, message: "Profil oluşturulamadı (Veritabanı hatası): " + profileInsertError.message };
        }

        return { success: true, message: "Kullanıcı başarıyla oluşturuldu." };

    } catch (error: any) {
        console.error("Unexpected error in createUser:", error);
        return { success: false, message: "Beklenmeyen hata: " + error.message };
    }
}
