"use client";

import { Header } from "@/components/Header";
import { ArrowLeft, Phone, User, Calendar, Briefcase, CreditCard } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getPersonnelById } from "@/lib/supabaseQueries";

export default function PersonnelDetailPage({ params }: { params: { id: string } }) {
    const [personnel, setPersonnel] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPersonnel() {
            setLoading(true);
            try {
                const data = await getPersonnelById(params.id);

                // Combine jobs and payroll for unified history view
                const jobs = (data.jobs || []).map((j: any) => ({
                    id: `job-${j.id}`,
                    date: j.date,
                    type: 'İş Emri',
                    description: j.description || 'İş Emri',
                    amount: 0, // Work orders usually don't mean payment TO personnel unless calculated as portion. 
                    // Usually we track daily wage (yevmiye) as "debt" to personnel, and payment as "credit".
                    // But in the mock, "İş Emri" had positive amount (1500) and type "İş Emri". 
                    // Maybe it meant the revenue generated? Or the wage earned?
                    // Let's assume for now we list them but price is irrelevant for personnel balance unless it's a wage record.
                    // Actually, the previous mock had: "İş Emri ... 1500" and "Ödeme ... -250".
                    // This implies the 1500 was EARNED (Alacak) and 250 was PAID (Borç/Tahsilat from company perspective).
                    // BUT normally, payroll_records handles the "earning" via daily_wage.
                    // If we just show Work Orders here as "Activity", maybe amount is 0 or display the job price just for info.

                    // Let's rely on PAYROLL records for the financial history (Earning vs Payment).
                    // Work orders are just operational history.
                    // If we want to show them in the same list, we can, but let's prioritize payroll.
                    isFinancial: false
                }));

                const payrolls = (data.payroll || []).map((p: any) => {
                    const items = [];
                    // Hakediş (Earning)
                    if (p.daily_wage > 0) {
                        items.push({
                            id: `wage-${p.id}`,
                            date: p.date,
                            type: 'Yevmiye / Hakediş',
                            description: p.description || 'Günlük Yevmiye',
                            amount: p.daily_wage,
                            isPlus: true, // Personnel earns money
                            status: 'Tahakkuk'
                        });
                    }
                    // Ödeme (Payment)
                    if (p.paid_amount > 0) {
                        items.push({
                            id: `pay-${p.id}`,
                            date: p.date,
                            type: 'Ödeme',
                            description: 'Ödeme Yapıldı',
                            amount: -p.paid_amount, // Balance decreases
                            isPlus: false,
                            status: 'Ödendi'
                        });
                    }
                    return items;
                }).flat();

                const combinedHistory = [...jobs, ...payrolls].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setPersonnel({ ...data, combinedHistory });

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        if (params.id) loadPersonnel();
    }, [params.id]);

    if (loading) {
        return (
            <>
                <Header title="Personel Detayı" />
                <div className="p-8 text-center text-slate-500">Yükleniyor...</div>
            </>
        )
    }

    if (!personnel) {
        return (
            <>
                <Header title="Personel Detayı" />
                <div className="p-8 text-center text-slate-500">Personel bulunamadı.</div>
            </>
        )
    }

    return (
        <>
            <Header title="Personel Detayı" />
            <div className="p-8 space-y-6">

                {/* Back and Header */}
                <div className="flex items-center gap-4">
                    <Link href="/personel" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{personnel.full_name || personnel.name}</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-bold border",
                                personnel.status === "active" // Assuming 'active' is the DB value
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                            )}>
                                {personnel.status === 'active' ? 'Aktif' : 'Pasif'}
                            </span>
                            <span>Personel No: #{params.id}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Info Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-4">Kişisel Bilgiler</h3>

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <User className="h-5 w-5 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">TC Kimlik No</p>
                                        <p className="font-medium text-slate-900">{personnel.tc_no || personnel.tc || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Phone className="h-5 w-5 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Telefon</p>
                                        <p className="font-medium text-slate-900">{personnel.phone || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Briefcase className="h-5 w-5 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Görevi</p>
                                        <p className="font-medium text-slate-900">{personnel.role || 'Personel'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-4">Hakediş Durumu</h3>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 font-medium">Toplam Alacak</span>
                                <span className="text-2xl font-bold text-slate-900">₺{(personnel.current_balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* History Tab */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[400px]">
                            <h3 className="font-bold text-slate-900 mb-6">İş & Ödeme Geçmişi</h3>

                            <div className="space-y-4">
                                {(personnel.combinedHistory || []).length === 0 ? (
                                    <div className="text-center text-slate-500 py-8">Kayıtlı geçmiş bulunamadı.</div>
                                ) : (
                                    (personnel.combinedHistory || []).map((job: any) => (
                                        <div key={job.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border border-slate-200 text-slate-500">
                                                    {job.amount < 0 ? <CreditCard className="h-5 w-5 text-red-500" /> : <Calendar className="h-5 w-5 text-blue-500" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{job.description}</p>
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                        <span>{job.date ? new Date(job.date).toLocaleDateString('tr-TR') : '-'}</span>
                                                        <span>•</span>
                                                        <span className={job.amount < 0 ? "text-red-600" : "text-blue-600"}>{job.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {job.amount !== 0 && (
                                                    <p className={cn("font-bold", job.amount > 0 ? "text-green-600" : "text-slate-900")}>
                                                        {job.amount > 0 ? "+" : ""}₺{Math.abs(job.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                )}
                                                <span className="text-xs font-medium text-slate-400">{job.status}</span>
                                            </div>
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

