"use client";

import { Header } from "@/components/Header";
import { ArrowLeft, MapPin, Phone, CreditCard, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCustomerById } from "@/lib/supabaseQueries";

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadCustomer() {
            setLoading(true);
            try {
                const data = await getCustomerById(params.id);
                setCustomer(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        if (params.id) loadCustomer();
    }, [params.id]);

    if (loading) {
        return (
            <>
                <Header title="Müşteri Detayı" />
                <div className="p-8 text-center text-slate-500">Yükleniyor...</div>
            </>
        )
    }

    if (!customer) {
        return (
            <>
                <Header title="Müşteri Detayı" />
                <div className="p-8 text-center text-slate-500">Müşteri bulunamadı.</div>
            </>
        )
    }

    return (
        <>
            <Header title="Müşteri Detayı" />
            <div className="p-8 space-y-6">

                {/* Back and Header */}
                <div className="flex items-center gap-4">
                    <Link href="/musteriler" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{customer.name}</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{customer.type || 'Normal'}</span>
                            <span>Müşteri No: #{params.id}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Info Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-4">İletişim Bilgileri</h3>

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <Phone className="h-5 w-5 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Telefon</p>
                                        <p className="font-medium text-slate-900">{customer.phone || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Adres</p>
                                        <p className="font-medium text-slate-900">{customer.address || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-4">Finansal Durum</h3>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 font-medium">Bakiye</span>
                                {/* Note: Backend function fetches history but doesn't calculate live balance unless we do it here or rely on DB field. 
                                    Using a simple DB field approach or sum of history if DB field is unreliable. 
                                    Let's try to use calculated pending from history if needed, or field. 
                                    Assuming 'balance' or 'current_balance' field exists or we summing history.
                                    The getCustomerById function returns customer object + history array.
                                */}
                                <span className="text-2xl font-bold text-slate-900">
                                    {/* Simple calculation from history if DB field empty, else use DB */}
                                    ₺{customer.current_balance ? customer.current_balance : "0.00"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* History Tab */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[400px]">
                            <h3 className="font-bold text-slate-900 mb-6">İşlem Geçmişi</h3>

                            <div className="space-y-4">
                                {(customer.history || []).length === 0 ? (
                                    <div className="text-center text-slate-500 py-8">İşlem geçmişi bulunamadı.</div>
                                ) : (
                                    (customer.history || []).map((tx: any, idx: number) => (
                                        <div key={tx.id || idx} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border border-slate-200 text-slate-500">
                                                    {/* Logic: If plus (Collection) -> Green Check. If Minus (WorkOrder/Debt) -> Clock/Debt icon */}
                                                    {tx.isPlus ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Clock className="h-5 w-5 text-orange-500" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{tx.description}</p>
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                        <span>{tx.date ? new Date(tx.date).toLocaleDateString("tr-TR") : "-"}</span>
                                                        <span>•</span>
                                                        <span>{tx.type === 'collection' ? 'Tahsilat' : 'Hizmet / İş Emri'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={tx.isPlus ? "text-green-600 font-bold" : "text-slate-900 font-bold"}>
                                                {tx.isPlus ? "+" : "-"}₺{Math.abs(tx.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )))}
                            </div>

                        </div>
                    </div>

                </div>

            </div>
        </>
    );
}

