"use client";

import { X, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NewTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NewTransactionModal({ isOpen, onClose }: NewTransactionModalProps) {
    const [type, setType] = useState<"income" | "expense">("income");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-6 shrink-0">
                    <h2 className="text-xl font-bold text-slate-900">Yeni İşlem</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Type Toggle */}
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                        <button
                            onClick={() => setType("income")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-md transition-all",
                                type === "income" ? "bg-blue-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            <TrendingUp className="h-4 w-4" />
                            Gelir
                        </button>
                        <button
                            onClick={() => setType("expense")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-md transition-all",
                                type === "expense" ? "bg-red-500 text-white shadow-md" : "text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            <TrendingDown className="h-4 w-4" />
                            Gider
                        </button>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">

                        {/* Tutar */}
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-900">
                                Tutar (₺) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                defaultValue={0.00}
                                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            />
                        </div>

                        {/* Tarih */}
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-900">
                                Tarih <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                defaultValue="19 . 12 . 2025"
                                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            />
                        </div>

                        {/* Dynamic Field: Customer (Income) or Category (Expense) */}
                        {type === "income" ? (
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-900">
                                    Müşteri <span className="text-red-500">*</span>
                                </label>
                                <select className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                                    <option>Seçin</option>
                                    <option>Bugless Digital</option>
                                    <option>ABC İnşaat</option>
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-900">
                                    Kategori
                                </label>
                                <input
                                    type="text"
                                    placeholder="Malzeme, Yakıt, Kira..."
                                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                                />
                            </div>
                        )}

                        {/* Açıklama */}
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-900">Açıklama</label>
                            <input
                                type="text"
                                placeholder="Açıklama..."
                                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            />
                        </div>

                        {/* Ödeme Yöntemi */}
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-900">Ödeme Yöntemi</label>
                            <select className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 cursor-pointer text-slate-700 font-medium">
                                <option>Nakit</option>
                                <option>Kredi Kartı</option>
                                <option>Havale / EFT</option>
                            </select>
                        </div>

                    </div>

                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 border-t border-slate-100 p-6 bg-slate-50 shrink-0 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                        İptal
                    </button>
                    <button
                        className={cn(
                            "rounded-lg px-8 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:brightness-110",
                            type === "income" ? "bg-green-600 shadow-green-200" : "bg-red-500 shadow-red-200"
                        )}
                    >
                        Kaydet
                    </button>
                </div>

            </div>
        </div>
    );
}
