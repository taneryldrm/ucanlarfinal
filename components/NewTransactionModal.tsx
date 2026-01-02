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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl bg-card border border-border shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-border p-6 shrink-0 bg-muted/30">
                    <h2 className="text-xl font-bold text-foreground">Yeni İşlem</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Type Toggle */}
                    <div className="flex gap-2 p-1 bg-muted/50 rounded-lg border border-border">
                        <button
                            onClick={() => setType("income")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-md transition-all",
                                type === "income" ? "bg-green-600 text-white shadow-md shadow-green-200 dark:shadow-none" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <TrendingUp className="h-4 w-4" />
                            Gelir
                        </button>
                        <button
                            onClick={() => setType("expense")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-md transition-all",
                                type === "expense" ? "bg-red-500 text-white shadow-md shadow-red-200 dark:shadow-none" : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                            <label className="text-sm font-bold text-foreground">
                                Tutar (₺) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                defaultValue={0.00}
                                className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-ring text-foreground"
                            />
                        </div>

                        {/* Tarih */}
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-foreground">
                                Tarih <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                defaultValue="19 . 12 . 2025"
                                className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-ring text-foreground"
                            />
                        </div>

                        {/* Dynamic Field: Customer (Income) or Category (Expense) */}
                        {type === "income" ? (
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-foreground">
                                    Müşteri <span className="text-red-500">*</span>
                                </label>
                                <select className="w-full appearance-none rounded-lg border border-input bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-ring text-foreground">
                                    <option>Seçin</option>
                                    <option>Bugless Digital</option>
                                    <option>ABC İnşaat</option>
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-foreground">
                                    Kategori
                                </label>
                                <input
                                    type="text"
                                    placeholder="Malzeme, Yakıt, Kira..."
                                    className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-red-500 text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                        )}

                        {/* Açıklama */}
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-foreground">Açıklama</label>
                            <input
                                type="text"
                                placeholder="Açıklama..."
                                className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        {/* Ödeme Yöntemi */}
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-foreground">Ödeme Yöntemi</label>
                            <select className="w-full appearance-none rounded-lg border border-input bg-muted/50 hover:bg-muted px-4 py-2.5 text-sm outline-none focus:border-ring cursor-pointer text-foreground font-medium transition-colors">
                                <option>Nakit</option>
                                <option>Kredi Kartı</option>
                                <option>Havale / EFT</option>
                            </select>
                        </div>

                    </div>

                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 border-t border-border p-6 bg-muted/30 shrink-0 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        className={cn(
                            "rounded-lg px-8 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:brightness-110",
                            type === "income" ? "bg-green-600 shadow-green-200 dark:shadow-none" : "bg-red-500 shadow-red-200 dark:shadow-none"
                        )}
                    >
                        Kaydet
                    </button>
                </div>

            </div>
        </div>
    );
}
