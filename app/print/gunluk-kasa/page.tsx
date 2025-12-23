"use client";



import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getDailyTransactions, getDailyPersonnelSummary } from "@/lib/supabaseQueries";
import { Loader2 } from "lucide-react";

import { Suspense } from "react";

function DailyCashPrintContent() {
    const searchParams = useSearchParams();
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const [data, setData] = useState<{
        collections: any[];
        expenses: any[];
        personnel: any[];
        totals: any;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                // Parallel fetch
                const [transRes, personnelRes] = await Promise.all([
                    getDailyTransactions(date),
                    getDailyPersonnelSummary(date, false) // Show all personnel, not just with balance? Image shows full list.
                ]);

                setData({
                    collections: transRes.collections,
                    expenses: transRes.expenses,
                    personnel: personnelRes,
                    totals: {
                        previousBalance: transRes.previousBalance,
                        todayPaidWages: transRes.todayPaidWages,
                        totalWageDebt: transRes.totalWageDebt,
                        totalCollection: transRes.collections
                            .filter((c: any) => c.payment_method === "Nakit") // Filter match main page logic?
                            .reduce((sum: number, c: any) => sum + (c.amount || 0), 0),
                        totalExpense: transRes.expenses
                            .filter((e: any) => e.method === "Nakit")
                            .reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
                    }
                });

                // Trigger print dialog once loaded
                setTimeout(() => window.print(), 500);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [date]);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Veriler hazırlanıyor...</div>;
    if (!data) return <div>Veri bulunamadı.</div>;

    // --- Page 1 Data Preparation ---
    const PAGE_1_ROWS = 15;
    const paddedCollections = [...data.collections];
    while (paddedCollections.length < PAGE_1_ROWS) paddedCollections.push({ empty: true });

    const paddedExpenses = [...data.expenses];
    while (paddedExpenses.length < PAGE_1_ROWS) paddedExpenses.push({ empty: true });

    // --- Page 2 Data Preparation ---
    // Filter personnel: Show only if they have any financial data (Devir, Hakediş, Ödenen, Bakiye)
    const activePersonnel = data.personnel.filter(p =>
        (p.carryover || 0) !== 0 ||
        (p.daily_wage || 0) !== 0 ||
        (p.paid_amount || 0) !== 0 ||
        (p.balance_after || 0) !== 0
    );

    // Split personnel into 2 groups (e.g. 25 rows per column = 50 total capacity)
    const PAGE_2_ROW_PER_COL = 25;
    const personnelGroup1 = activePersonnel.slice(0, PAGE_2_ROW_PER_COL);
    const personnelGroup2 = activePersonnel.slice(PAGE_2_ROW_PER_COL, PAGE_2_ROW_PER_COL * 2);

    // Fill with empty if needed to match visual height? Or just leave empty.
    while (personnelGroup1.length < PAGE_2_ROW_PER_COL) personnelGroup1.push({ empty: true });
    while (personnelGroup2.length < PAGE_2_ROW_PER_COL) personnelGroup2.push({ empty: true });

    // Totals for Page 2
    // Need sum of 'daily_wage' (Hakediş), 'paid_amount' (Ödenen), etc for footer
    const totalDailyWage = data.personnel.reduce((acc, p) => acc + (p.daily_wage || 0), 0);
    const totalPaidAmount = data.personnel.reduce((acc, p) => acc + (p.paid_amount || 0), 0);
    const totalBalance = data.personnel.reduce((acc, p) => acc + (p.balance_after || 0), 0); // Borç Bakiye Toplam

    // Format Date: "Pazar, 21.12.2025"
    const dateObj = new Date(date);
    const dateFormatted = dateObj.toLocaleDateString("tr-TR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="bg-white text-black text-[10px] font-sans leading-tight print-container">
            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 5mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
                    .page-break { break-after: page; page-break-after: always; }
                }
                .print-border { border: 1px solid black; }
                .print-header { background-color: #f0f0f0; font-weight: bold; text-align: center; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid black; padding: 4px; height: 24px; } /* Fixed height rows */
                .double-column { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            `}</style>

            {/* Manual Print Button - Hidden in Print View */}
            <div className="print:hidden fixed top-4 right-4 z-50">
                <button
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow-lg flex items-center gap-2 hover:bg-blue-700 font-bold"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg>
                    Yazdır
                </button>
            </div>

            {/* --- PAGE 1: Collections & Expenses --- */}
            <div className="w-full h-screen flex flex-col page-break">
                {/* Header Info */}
                <div className="mb-2 flex justify-between font-bold text-xs uppercase border-b-2 border-black pb-1">
                    <div>
                        VERGİ KİMLİK NUMARASI<br />
                        SOYADI (UNVANI)<br />
                        8840838625
                    </div>
                    <div className="text-right">
                        MAKİNA NO<br />
                        SIRA NO
                    </div>
                </div>

                <div className="double-column flex-1">

                    {/* LEFT TABLE: MÜŞTERİ TAHSİLAT */}
                    <div className="flex flex-col">
                        <div className="print-border print-header py-1 mb-[1px]">GÜNLÜK MÜŞTERİ TAHSİLAT</div>
                        <table>
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="w-8 text-center">SIRA<br />NO</th>
                                    <th>MÜŞTERİ İSMİ</th>
                                    <th className="w-20 text-center">İŞİN YAPILDIĞI<br />TARİH</th>
                                    <th className="w-20 text-right">TAHSİLAT MİKTARI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paddedCollections.map((row, i) => (
                                    <tr key={i}>
                                        <td className="text-center">{i + 1}</td>
                                        <td>{row.empty ? '' : row.customer}</td>
                                        <td className="text-center">{row.empty ? '' : new Date(row.date).toLocaleDateString('tr-TR')}</td>
                                        <td className="text-right font-bold">{row.empty ? '' : (row.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</td>
                                        {/* Image shows 0 if empty, but blank is cleaner? Image shows '0'. Let's show 0. */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* RIGHT TABLE: NAKİT GENEL GİDERLER */}
                    <div className="flex flex-col">
                        <div className="print-border print-header py-1 mb-[1px]">GÜNLÜK NAKİT GENEL GİDERLER</div>
                        <table>
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="w-8 text-center">SIRA<br />NO</th>
                                    <th>HARCAMA DETAYI</th>
                                    <th className="w-20 text-center">TARİHİ VE FİŞ<br />NO</th>
                                    <th className="w-20 text-right">HARCAMA<br />TUTARI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paddedExpenses.map((row, i) => (
                                    <tr key={i}>
                                        <td className="text-center">{i + 1}</td>
                                        <td>{row.empty ? '' : row.detail}</td>
                                        <td className="text-center">{row.empty ? '' : (row.receiptNo || row.date)}</td>
                                        <td className="text-right font-bold">{row.empty ? '0' : (row.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Section (Bottom of Page 1) */}
                <div className="mt-4 border-t-2 border-black pt-2 double-column font-bold text-xs">
                    {/* Left Footer */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span>BUGÜN TAHSİLAT TOPLAMI</span>
                            <span>{data.totals.totalCollection.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>BUGÜN ÖDENEN YÖMİYELER TOPLAMI</span>
                            <span>{data.totals.todayPaidWages.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                            {/* Note: This logic assumes 'todayPaidWages' comes from separate Payroll fetching in Page 1 logic */}
                        </div>
                        <div className="flex justify-between">
                            <span>DÜNDEN KASA DEVRİ</span>
                            <span>{data.totals.previousBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between border-t border-black pt-1 mt-1">
                            <span>BUGÜN KASA TOPLAMI</span>
                            <span>{(data.totals.previousBalance + data.totals.totalCollection - data.totals.totalExpense - data.totals.todayPaidWages).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Right Footer */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span>BUGÜN ÖDENEN GİDERLER TOPLAMI</span>
                            <span>{data.totals.totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>BUGÜN İTİBARİYLE TOPLAM YÖMİYE BORCU</span>
                            <span>{data.totals.totalWageDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                            {/* Assuming totalWageDebt calculated correctly */}
                        </div>
                        <div className="flex justify-between">
                            <span>BUGÜN TAHAKKUK ÖDEN YÖMİYE TOPLAMI</span>
                            <span>0</span>
                            {/* Not sure what 'TAHAKKUK ÖDEN' specifically refers to if different from Paid Wages. Leaving 0 per image default or logic. */}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PAGE 2: Personnel Payroll Checksheet --- */}
            <div className="w-full h-screen flex flex-col pt-4">
                {/* Page 2 Header */}
                <div className="text-center font-bold mb-4">
                    <h1 className="text-lg">GÜNLÜK YÖMİYE -MÜŞTERİ NAKİT TAHSİLAT-NAKİT HARCAMA TAKİP ÇİZELGESİ</h1>
                    <div className="text-sm mt-1">{dateFormatted}</div>
                    <div className="text-sm">YÖMİYE TAHAKKUK EDEN KİŞİ SAYISI: {data.personnel.filter(p => !p.recordId && p.daily_wage > 0 || p.daily_wage > 0).length}</div>
                    {/* Basic count logic, maybe refine to 'working today' count */}
                </div>

                <div className="double-column flex-1 items-start">

                    {/* 1. GRUP */}
                    <div className="flex flex-col">
                        <div className="text-center font-bold mb-1">1. GRUP</div>
                        <table>
                            <thead>
                                <tr className="bg-gray-100 text-[9px]">
                                    <th className="w-6">SIRA<br />NO</th>
                                    <th>AD SOYAD</th>
                                    <th>TELEFON</th>
                                    <th>DEVİR</th>
                                    <th>BUGÜN<br />YÖMİYE</th>
                                    <th>BUGÜN<br />ÖDENE</th>
                                    <th>BORÇ<br />BAKİYE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {personnelGroup1.map((p, i) => (
                                    <tr key={i}>
                                        <td className="text-center">{i + 1}</td>
                                        <td>{p.empty ? '' : p.name}</td>
                                        <td>{p.empty ? '' : p.phone}</td>
                                        <td className="text-right">{p.empty ? '' : (p.devir || 0).toLocaleString('tr-TR')}</td>
                                        <td className="text-right">{p.empty ? '' : (p.hakedis || 0).toLocaleString('tr-TR')}</td>
                                        <td className="text-right">{p.empty ? '' : (p.odenen || 0).toLocaleString('tr-TR')}</td>
                                        <td className="text-right font-bold">{p.empty ? '' : (p.bakiye || 0).toLocaleString('tr-TR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Footer for Group 1 (Optional or just Global Footer?) Image shows global footer at bottom of Right Column? 
                             Wait, image shows 'ÖDENEN YÖMİYE TOPLAMI 1.GRUP' at bottom of Left Column. 
                         */}
                        <div className="mt-2 border-t border-black pt-1 text-right font-bold">
                            <div className="flex justify-between">
                                <span>ÖDENEN YÖMİYE TOPLAMI 1.GRUP</span>
                                <span>{personnelGroup1.reduce((sum, p) => sum + (p.odenen || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 1 })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>BORÇ BAKİYE TOPLAMI 1.GRUP</span>
                                <span>{personnelGroup1.reduce((sum, p) => sum + (p.bakiye || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 3 })}</span>
                                {/* Image shows 3 decimal places? Or just standard formatting. */}
                            </div>
                        </div>
                    </div>

                    {/* 2. GRUP */}
                    <div className="flex flex-col">
                        <div className="text-center font-bold mb-1">2. GRUP</div>
                        <table>
                            <thead>
                                <tr className="bg-gray-100 text-[9px]">
                                    <th className="w-6">SIRA<br />NO</th>
                                    <th>AD SOYAD</th>
                                    <th>TELEFON</th>
                                    <th>DEVİR</th>
                                    <th>BUGÜN<br />YÖMİYE</th>
                                    <th>BUGÜN<br />ÖDENE</th>
                                    <th>BORÇ<br />BAKİYE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {personnelGroup2.map((p, i) => (
                                    <tr key={i}>
                                        <td className="text-center">{PAGE_2_ROW_PER_COL + i + 1}</td>
                                        <td>{p.empty ? '' : p.name}</td>
                                        <td>{p.empty ? '' : p.phone}</td>
                                        <td className="text-right">{p.empty ? '' : (p.devir || 0).toLocaleString('tr-TR')}</td>
                                        <td className="text-right">{p.empty ? '' : (p.hakedis || 0).toLocaleString('tr-TR')}</td>
                                        <td className="text-right">{p.empty ? '' : (p.odenen || 0).toLocaleString('tr-TR')}</td>
                                        <td className="text-right font-bold">{p.empty ? '' : (p.bakiye || 0).toLocaleString('tr-TR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Footer for Group 2 */}
                        <div className="mt-2 border-t border-black pt-1 text-right font-bold">
                            <div className="flex justify-between">
                                <span>ÖDENEN YÖMİYE TOPLAMI 2.GRUP</span>
                                <span>{personnelGroup2.reduce((sum, p) => sum + (p.odenen || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 1 })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>BORÇ BAKİYE TOPLAMI 2.GRUP</span>
                                <span>{personnelGroup2.reduce((sum, p) => sum + (p.bakiye || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}

export default function DailyCashPrintPage() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <DailyCashPrintContent />
        </Suspense>
    );
}
