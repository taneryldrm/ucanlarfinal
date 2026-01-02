"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { createPersonnel } from "@/lib/supabaseQueries";
import { toast } from "sonner";

interface NewPersonnelModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
}

export function NewPersonnelModal({ isOpen, onClose, initialData, onSuccess }: { isOpen: boolean; onClose: () => void; initialData?: any; onSuccess?: (data: any) => void }) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [tc, setTc] = useState("");
    const [status, setStatus] = useState("Aktif");

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.full_name || initialData?.name || "");
            setPhone(initialData?.phone || "");
            setTc(initialData?.tc_no || initialData?.tc || "");
            setStatus(initialData?.status || "Aktif");
        }
    }, [initialData, isOpen]);

    const handleSave = async () => {
        if (!name) {
            toast.error("Ad soyad zorunludur.");
            return;
        }

        setLoading(true);
        try {
            // Check if it's update logic (omitted for now as task was specifically "yeni personel oluşturulamıyor")
            // But good practice to prepare structure.
            // For now, let's implement create.

            const personnelData = {
                name,
                phone,
                tc,
                status
            };

            const result = await createPersonnel(personnelData);
            toast.success("Personel başarıyla oluşturuldu.");

            if (onSuccess) onSuccess(result);
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(`Hata: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-xl bg-card border border-border shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-border p-6">
                    <h2 className="text-xl font-bold text-card-foreground">
                        {initialData ? "Personel Düzenle" : "Yeni Personel Ekle"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">

                    {/* Ad Soyad */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">
                            Ad Soyad <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ad soyad girin..."
                            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Telefon */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Telefon</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Telefon numarası..."
                            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* TC Kimlik No */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">TC Kimlik No</label>
                        <input
                            type="text"
                            value={tc}
                            onChange={(e) => setTc(e.target.value)}
                            placeholder="TC kimlik numarası..."
                            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Durum */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Durum</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full appearance-none rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground"
                        >
                            <option value="Aktif">Aktif</option>
                            <option value="Pasif">Pasif</option>
                        </select>
                    </div>

                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 border-t border-border p-6 rounded-b-xl bg-muted/40">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>}
                        Kaydet
                    </button>
                </div>

            </div>
        </div>
    );
}
