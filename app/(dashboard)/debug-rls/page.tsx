"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

import { Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export default function DebugRLSPage() {
    const supabase = createClient();
    const [status, setStatus] = useState<any>({
        loading: true,
        user: null,
        profile: null,
        collectionsCheck: null,
        profileError: null,
        collectionsError: null,
    });

    useEffect(() => {
        async function check() {
            const result: any = {};

            // 1. Check Auth
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            result.user = user;
            result.authError = authError;

            if (user) {
                // 2. Check Profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                result.profile = profile;
                result.profileError = profileError;

                // 3. Check Collections Access
                const { data: collections, error: colError, count } = await supabase
                    .from('collections')
                    .select('*', { count: 'exact', head: false })
                    .limit(1);

                result.collectionsCheck = collections;
                result.collectionsCount = count;
                result.collectionsError = colError;
            }

            setStatus({ ...result, loading: false });
        }

        check();
    }, []);

    if (status.loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2">Sistem kontrol ediliyor...</span>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-foreground">RLS Debug Ekranı</h1>

            {/* 1. Auth Status */}
            <div className="border border-border p-4 rounded-lg bg-card shadow-sm">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2 text-foreground">
                    1. Oturum Durumu
                    {status.user ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                </h2>
                <div className="bg-muted p-3 rounded text-xs font-mono overflow-auto text-foreground">
                    {status.user ? (
                        <>
                            <p>User ID: {status.user.id}</p>
                            <p>Email: {status.user.email}</p>
                            <p>Last Sign In: {status.user.last_sign_in_at}</p>
                        </>
                    ) : (
                        <p className="text-red-500">Kullanıcı oturumu bulunamadı. Lütfen giriş yapın.</p>
                    )}
                    {status.authError && <p className="text-red-500 mt-2">{JSON.stringify(status.authError)}</p>}
                </div>
            </div>

            {/* 2. Profile Status */}
            <div className="border border-border p-4 rounded-lg bg-card shadow-sm">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2 text-foreground">
                    2. Profil Tablosu (profiles)
                    {status.profile ? <CheckCircle2 className="text-green-500" /> : <AlertTriangle className="text-yellow-500" />}
                </h2>
                <p className="text-sm text-muted-foreground mb-2">
                    RLS politikaları bu tablodaki <strong>role</strong> alanına göre çalışır.
                </p>
                <div className="bg-muted p-3 rounded text-xs font-mono overflow-auto text-foreground">
                    {status.profile ? (
                        <pre>{JSON.stringify(status.profile, null, 2)}</pre>
                    ) : (
                        <div>
                            <p className="text-red-500 font-bold">Profil bulunamadı veya erişilemedi!</p>
                            <p>Bu, RLS politikalarının çalışmamasına neden olur.</p>
                            {status.profileError && (
                                <p className="text-red-500 mt-2">Hata: {JSON.stringify(status.profileError)}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Data Access Test */}
            <div className="border border-border p-4 rounded-lg bg-card shadow-sm">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2 text-foreground">
                    3. Veri Erişimi Testi (Collections)
                    {!status.collectionsError ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                </h2>
                <div className="bg-muted p-3 rounded text-xs font-mono overflow-auto text-foreground">
                    {status.collectionsError ? (
                        <p className="text-red-500">Hata: {JSON.stringify(status.collectionsError)}</p>
                    ) : (
                        <>
                            <p>Sorgu başarılı.</p>
                            <p>Dönen Kayıt Sayısı: {status.collectionsCheck?.length}</p>
                            <p>Toplam Count: {status.collectionsCount}</p>
                            {status.collectionsCheck?.length === 0 && (
                                <p className="text-yellow-600 dark:text-yellow-400 mt-2">
                                    Uyarı: 0 kayıt döndü. Eğer tabloda veri varsa, RLS politikanız verileri gizliyor demektir.
                                    Rolünüzün ({status.profile?.role}) bu tabloyu görme yetkisi olduğundan emin olun.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded text-sm text-blue-800 dark:text-blue-200">
                <strong>İpucu:</strong> Eğer 2. adımda profil verisi geliyor ama 3. adımda veri gelmiyorsa,
                <code>role</code> alanındaki değerin (örn: "{status.profile?.role}") veritabanındaki RLS politikasında yazan değerle (örn: "sistem yöneticisi")
                <strong>birebir aynı</strong> (boşluklar, harf duyarlılığı) olduğunu kontrol edin.
            </div>
        </div>
    );
}
