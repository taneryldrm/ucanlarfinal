"use client";

import { X, Loader2 } from "lucide-react";
import { useState } from "react";

interface NewUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    user?: any; // User to edit
}

export function NewUserModal({ isOpen, onClose, onSave, user }: NewUserModalProps) {
    // Helper to normalize DB roles to UI options
    const normalizeRole = (r: string) => {
        if (!r) return "Sekreter";
        const lower = r.toLowerCase();
        if (lower === "sistem yöneticisi" || lower === "yönetici" || lower === "yonetici") return "Yönetici";
        if (lower === "sekreter") return "Sekreter";
        if (lower === "saha sorumlusu") return "Saha Sorumlusu";
        if (lower === "şoför" || lower === "sofor") return "Şoför";
        if (lower === "veri girici") return "Veri Girici";
        return r; // Fallback (e.g. if already matches)
    };

    // Initialize state
    const [name, setName] = useState(user?.full_name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [role, setRole] = useState(normalizeRole(user?.role));
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Update state when user prop changes
    const [prevUser, setPrevUser] = useState(user);
    if (user !== prevUser) {
        setPrevUser(user);
        setName(user?.full_name || "");
        setEmail(user?.email || "");
        setRole(normalizeRole(user?.role));
        setPassword("");
    }

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name) return;
        setLoading(true);
        try {
            await onSave({
                id: user?.id, // Pass ID if editing
                name,
                email,
                role,
                password // Pass password
            });

            if (!user) {
                // Reset only if creating new
                setName("");
                setEmail("");
                setRole("Sekreter");
                setPassword("");
            }
            onClose();
        } catch (error) {
            console.error("Save failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-6 shrink-0">
                    <h2 className="text-xl font-bold text-slate-900">
                        {user ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-900">
                            Ad Soyad <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ad Soyad"
                            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-900">
                            E-posta
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-900">
                            Şifre {user && <span className="text-gray-400 font-normal">(Değiştirmek için doldurun)</span>}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={user ? "********" : "Şifre giriniz"}
                            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-900">Rol</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="Yönetici">Yönetici</option>
                            <option value="Sekreter">Sekreter</option>
                            <option value="Saha Sorumlusu">Saha Sorumlusu</option>
                            <option value="Şoför">Şoför</option>
                            <option value="Veri Girici">Veri Girici</option>
                        </select>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-700">
                        <strong>Not:</strong> Profil bilgileri veritabanında güncellenir. Şifre değişikliği için sistem yöneticisine başvurunuz (Auth servisi gerektirir).
                    </div>

                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 border-t border-slate-100 p-6 bg-slate-50 shrink-0 rounded-b-xl">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Kaydet
                    </button>
                </div>

            </div>
        </div>
    );
}

