"use client";

import { X, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createCustomer, updateCustomer } from "@/lib/supabaseQueries";
import { toast } from "sonner";

interface NewCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    onSuccess?: (customer: any) => void;
}

export function NewCustomerModal({ isOpen, onClose, initialData, onSuccess }: NewCustomerModalProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(initialData?.name || "");
    const [type, setType] = useState(initialData?.type || "normal");
    const [phone, setPhone] = useState(initialData?.phone || "");
    const [taxId, setTaxId] = useState(initialData?.taxId || "");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");

    // Sync state with initialData when it changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || "");
            setType(initialData?.type || "normal");
            setPhone(initialData?.phone || "");
            setTaxId(initialData?.tax_id || initialData?.taxId || ""); // Handle both cases if DB field is tax_id
            setAddress(initialData?.address || "");
            setDescription(initialData?.description || "");
        }
    }, [initialData, isOpen]);

    const handleSave = async () => {
        if (!name) {
            toast.error("Müşteri adı zorunludur.");
            return;
        }

        setLoading(true);
        try {
            const customerData = {
                name,
                type,
                phone,
                taxId,
                address,
                description
            };

            let result;
            if (initialData?.id) {
                result = await updateCustomer(initialData.id, customerData);
                toast.success("Müşteri başarıyla güncellendi.");
            } else {
                result = await createCustomer(customerData);
                toast.success("Müşteri başarıyla oluşturuldu.");
            }

            if (onSuccess) onSuccess(result);
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(`İşlem başarısız: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                    <h2 className="text-xl font-bold text-slate-900">
                        {initialData ? "Müşteri Düzenle" : "Yeni Müşteri Ekle"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">

                    {/* Müşteri Adı */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                            Müşteri Adı <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Müşteri adını girin..."
                            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                        />
                    </div>

                    {/* Müşteri Tipi */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Müşteri Tipi</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                        >
                            <option value="normal">Normal</option>
                            <option value="düzenli">Düzenli</option>
                            <option value="sıkıntılı">Sıkıntılı</option>
                        </select>
                    </div>

                    {/* Telefon */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Telefon</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Telefon numarası..."
                            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                        />
                    </div>

                    {/* Vergi No */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Vergi No</label>
                        <input
                            type="text"
                            value={taxId}
                            onChange={(e) => setTaxId(e.target.value)}
                            placeholder="Vergi numarası..."
                            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                        />
                    </div>

                    {/* Adresler */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700">Adres</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Adres girin..."
                                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Açıklama */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Açıklama</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Müşteri hakkında notlar..."
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                        />
                    </div>

                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 border-t border-slate-100 p-6 bg-slate-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Vazgeç
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-md shadow-blue-200 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        Kaydet
                    </button>
                </div>

            </div>
        </div>
    );
}
