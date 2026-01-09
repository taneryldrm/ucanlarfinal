"use client";

import { X, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createCustomer, updateCustomer } from "@/lib/supabaseQueries";
import { toast } from "sonner";
import { useTheme } from "@/components/ThemeProvider";

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
    const { theme } = useTheme();
    const isPurple = theme === "purple";

    // Changed to array
    const [addresses, setAddresses] = useState<string[]>([""]);
    const [description, setDescription] = useState("");

    // Sync state with initialData when it changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || "");
            setType(initialData?.type || "normal");
            setPhone(initialData?.phone || "");
            setTaxId(initialData?.tax_id || initialData?.taxId || "");

            // Handle Address: Use address_json (new column)
            let initialAddresses = [""];
            const rawAddresses = initialData?.address_json;

            if (rawAddresses) {
                if (Array.isArray(rawAddresses)) {
                    initialAddresses = rawAddresses.length > 0 ? rawAddresses.map((a: any) => {
                        if (typeof a === 'object' && a !== null) return a.address || "";
                        return String(a);
                    }) : [""];
                } else if (typeof rawAddresses === 'string') {
                    // Should be array but valid text is possible in bad migration state
                    initialAddresses = [rawAddresses];
                }
            } else if (initialData?.address) {
                // Fallback to legacy address if accessible or present in object
                if (Array.isArray(initialData.address)) {
                    initialAddresses = initialData.address.map(String);
                } else {
                    initialAddresses = [String(initialData.address)];
                }
            }
            setAddresses(initialAddresses);

            setDescription(initialData?.description || "");
        } else {
            // Reset when closed (optional but good practice)
            setAddresses([""]);
        }
    }, [initialData, isOpen]);

    const handleAddAddress = () => {
        setAddresses([...addresses, ""]);
    };

    const handleRemoveAddress = (index: number) => {
        const newAddresses = addresses.filter((_, i) => i !== index);
        setAddresses(newAddresses.length > 0 ? newAddresses : [""]);
    };

    const handleAddressChange = (index: number, value: string) => {
        const newAddresses = [...addresses];
        newAddresses[index] = value;
        setAddresses(newAddresses);
    };

    const handleSave = async () => {
        if (!name) {
            toast.error("Müşteri adı zorunludur.");
            return;
        }

        // Filter out empty addresses
        const validAddresses = addresses.filter(a => a.trim() !== "");

        setLoading(true);
        try {
            const customerData = {
                name,
                type,
                phone,
                taxId,
                addresses: validAddresses, // Send array
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
            <div className="w-full max-w-2xl rounded-xl bg-card shadow-2xl animate-in fade-in zoom-in duration-200 transition-colors">

                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-border p-6">
                    <h2 className="text-xl font-bold text-foreground">
                        {initialData ? "Müşteri Düzenle" : "Yeni Müşteri Ekle"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">

                    {/* Müşteri Adı */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Müşteri Adı <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Müşteri adını girin..."
                            className={cn(
                                "w-full rounded-lg border px-4 py-2.5 text-sm text-foreground bg-background outline-none transition-colors",
                                isPurple
                                    ? "border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
                                    : "border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            )}
                        />
                    </div>

                    {/* Müşteri Tipi */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Müşteri Tipi</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className={cn(
                                "w-full appearance-none rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors",
                                isPurple
                                    ? "border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
                                    : "border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            )}
                        >
                            <option value="normal">Normal</option>
                            <option value="düzenli">Düzenli</option>
                            <option value="sıkıntılı">Sıkıntılı</option>
                        </select>
                    </div>

                    {/* Telefon */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Telefon</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Telefon numarası..."
                            className={cn(
                                "w-full rounded-lg border px-4 py-2.5 text-sm text-foreground bg-background outline-none transition-colors",
                                isPurple
                                    ? "border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
                                    : "border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            )}
                        />
                    </div>

                    {/* Vergi No */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Vergi No</label>
                        <input
                            type="text"
                            value={taxId}
                            onChange={(e) => setTaxId(e.target.value)}
                            placeholder="Vergi numarası..."
                            className={cn(
                                "w-full rounded-lg border px-4 py-2.5 text-sm text-foreground bg-background outline-none transition-colors",
                                isPurple
                                    ? "border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
                                    : "border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            )}
                        />
                    </div>

                    {/* Adresler */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground">Adresler</label>
                            <button
                                type="button"
                                onClick={handleAddAddress}
                                className={cn(
                                    "text-xs font-medium flex items-center gap-1 transition-colors",
                                    isPurple ? "text-purple-600 hover:text-purple-700" : "text-blue-600 hover:text-blue-700"
                                )}
                            >
                                <Plus className="h-3 w-3" />
                                Adres Ekle
                            </button>
                        </div>
                        <div className="space-y-2">
                            {addresses.map((addr, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={addr}
                                        onChange={(e) => handleAddressChange(index, e.target.value)}
                                        placeholder={`Adres ${index + 1}...`}
                                        className={cn(
                                            "w-full rounded-lg border px-4 py-2.5 text-sm text-foreground bg-background outline-none transition-colors",
                                            isPurple ? "border-purple-200 focus:border-purple-500" : "border-border focus:border-blue-500"
                                        )}
                                    />
                                    {addresses.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveAddress(index)}
                                            className="p-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Adresi Sil"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Açıklama */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Açıklama</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Müşteri hakkında notlar..."
                            rows={3}
                            className={cn(
                                "w-full rounded-lg border px-4 py-2.5 text-sm text-foreground bg-background outline-none transition-colors",
                                isPurple
                                    ? "border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
                                    : "border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            )}
                        />
                    </div>

                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 border-t border-border p-6 bg-muted/50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                    >
                        Vazgeç
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={cn(
                            "rounded-lg px-6 py-2 text-sm font-medium text-white disabled:opacity-50 flex items-center gap-2 transition-colors",
                            isPurple
                                ? "bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200"
                                : "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"
                        )}
                    >
                        {loading && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        Kaydet
                    </button>
                </div>

            </div>
        </div>
    );
}
