"use client";

import { X, Eye, Pencil, Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobHistory {
    date: string;
    customer: string;
    description: string;
    address: string;
    amount: number;
    status: string;
}

interface PersonnelDetailModalProps {
    personnel: any | null; // Detailed type would be defined in types
    isOpen: boolean;
    onClose: () => void;
}

// Mock Data for a specific personnel history
const mockHistory: JobHistory[] = [
    { date: "25.02.2019", customer: "DAS AKADEMİ -ÖZEL ALMAN", description: "FATURA VAR 3 KATLI DERSHANE YEMEK BİZDEN", address: "ŞAİR EŞREF BLV. 1371 SOK. NO:5 D:501 ÇANKAYA /İZMİR", amount: 1750.00, status: "Onaylandı" },
    { date: "14.02.2019", customer: "ŞAMURAN", description: "YANGIN SONRASI. 1 BAY 3 BAYAN", address: "-", amount: 0.00, status: "Onaylandı" },
    { date: "23.09.2017", customer: "VOLKAN BEY", description: "KİRACI SONRASI BOŞ DAİRE", address: "1847/6 SOK. NO:33 D:5 KARŞIYAKA", amount: 180.00, status: "Onaylandı" },
    { date: "16.08.2017", customer: "FULYA HANIM", description: "EV TEMİZLİĞİ", address: "KARŞIYAKA STADYUM YANI NO:390 5.KAT", amount: 1650.00, status: "Onaylandı" },
    { date: "10.08.2017", customer: "MURAT BEY", description: "VİLLA TEMİZLİĞİ TELESKOP,MERDİVEN GİDECEK", address: "ALTAY TİCARET MESLEK LİSESİ KARŞISI", amount: 0.00, status: "Onaylandı" },
    { date: "22.06.2017", customer: "serpil yaşar", description: "kiracı sonrası boş daire öğle yemeği bizden anahtar emlakçıdan", address: "mustafa kemal mah mavi oyaklar 6794 sok no:38 d:2", amount: 300.00, status: "Onaylandı" },
];

export function PersonnelDetailModal({ personnel, isOpen, onClose }: PersonnelDetailModalProps) {
    if (!isOpen || !personnel) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-5xl rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">

                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                    <h2 className="text-xl font-bold text-slate-900 uppercase">{personnel.full_name || personnel.name} - İŞ GEÇMİŞİ</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-slate-500">Telefon:</label>
                            <div className="mt-1 text-lg font-bold text-slate-900">{personnel.phone || "-"}</div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500">TC No:</label>
                            <div className="mt-1 text-lg font-bold text-slate-900">{personnel.tc || "-"}</div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500">Durum:</label>
                            <div className="mt-2">
                                <span className={cn(
                                    "inline-block rounded px-2 py-0.5 text-xs font-bold border",
                                    personnel.status === "Aktif"
                                        ? "bg-green-100 text-green-700 border-green-200"
                                        : "bg-slate-100 text-slate-700 border-slate-200"
                                )}>
                                    {personnel.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Job History Table */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Gittiği İşler (Tarih Sırasına Göre)</h3>
                        <div className="rounded-lg border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Tarih</th>
                                            <th className="px-4 py-3 font-medium">Müşteri</th>
                                            <th className="px-4 py-3 font-medium w-1/4">Açıklama</th>
                                            <th className="px-4 py-3 font-medium w-1/4">Adres</th>
                                            <th className="px-4 py-3 text-right font-medium">Tutar</th>
                                            <th className="px-4 py-3 text-center font-medium">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {mockHistory.map((job, index) => (
                                            <tr key={index} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 flex items-center gap-2 whitespace-nowrap text-slate-600">
                                                    <Calendar className="h-3 w-3" />
                                                    {job.date}
                                                </td>
                                                <td className="px-4 py-3 font-bold text-slate-900 uppercase text-xs">{job.customer}</td>
                                                <td className="px-4 py-3 text-slate-600 uppercase leading-relaxed">{job.description}</td>
                                                <td className="px-4 py-3 text-slate-500 uppercase leading-relaxed">{job.address}</td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-900">
                                                    {job.amount === 0 ? "₺0,00" : `₺${job.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                                        {job.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
