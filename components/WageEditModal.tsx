import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { PERMISSIONS, hasPermission } from "@/lib/rbac";

interface WageEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: any; // Using any for simplicity in mock, should be typed
    onSave: (updatedData: any) => void;
}

export function WageEditModal({ isOpen, onClose, initialData, onSave }: WageEditModalProps) {
    const { role } = useUserRole();
    const canManageAccruals = hasPermission(role || undefined, PERMISSIONS.CAN_MANAGE_ACCRUALS);

    const [formData, setFormData] = useState({
        devir: 0,
        hakedis: 0,
        odenen: 0,
        bakiye: 0
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                devir: initialData.devir || 0,
                hakedis: initialData.hakedis || 0,
                odenen: initialData.odenen || 0,
                bakiye: initialData.bakiye || 0
            });
        }
    }, [initialData]);

    useEffect(() => {
        // Auto calculate balance: Devir + Hakediş - Ödenen
        const newBakiye = Number(formData.devir) + Number(formData.hakedis) - Number(formData.odenen);
        setFormData(prev => ({ ...prev, bakiye: newBakiye }));
    }, [formData.devir, formData.hakedis, formData.odenen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...initialData, ...formData });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b p-4">
                    <h2 className="text-lg font-bold text-slate-900">Yevmiye Düzenle - {initialData?.name}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Dünden Devir</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="devir"
                                value={formData.devir === 0 ? '' : formData.devir}
                                placeholder="0"
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-200 py-3 px-4 text-sm font-bold text-slate-600 bg-slate-50 outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₺</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Bugün Hakediş</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="hakedis"
                                    value={formData.hakedis === 0 ? '' : formData.hakedis}
                                    placeholder="0"
                                    onChange={handleChange}
                                    disabled={!canManageAccruals}
                                    className={cn(
                                        "w-full rounded-lg border border-slate-200 py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 bg-green-50/50 border-green-200 focus:border-green-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                        !canManageAccruals && "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-500"
                                    )}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₺</span>
                            </div>
                            {!canManageAccruals && (
                                <p className="text-xs text-red-500 mt-1">Yetkiniz yok.</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Bugün Ödenen</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="odenen"
                                    value={formData.odenen === 0 ? '' : formData.odenen}
                                    placeholder="0"
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-200 py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 bg-red-50/50 border-red-200 focus:border-red-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₺</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <div className="flex justify-between items-center bg-slate-50 p-5 rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-700">Yeni Bakiye</span>
                            <span className={cn(
                                "text-2xl font-black",
                                formData.bakiye > 0 ? "text-red-600" : "text-green-600"
                            )}>
                                ₺{formData.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm shadow-blue-200"
                        >
                            <Save className="h-4 w-4" />
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
