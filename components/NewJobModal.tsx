"use client";

import { X, Search, Plus, Calendar, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { getCustomers, getPersonnel } from "@/lib/supabaseQueries";
import { toast } from "sonner";
import { NewCustomerModal } from "./NewCustomerModal";

interface NewJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    onSave?: (data: any) => Promise<void>;
}

export function NewJobModal({ isOpen, onClose, initialData, onSave }: NewJobModalProps) {
    // Customer Search State
    const [customerSearch, setCustomerSearch] = useState("");
    const [foundCustomers, setFoundCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(initialData?.customer || null);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [showCustomerResults, setShowCustomerResults] = useState(false);

    // New Customer Modal State
    const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

    // Staff Search State
    const [staffSearch, setStaffSearch] = useState("");
    const [foundStaff, setFoundStaff] = useState<any[]>([]);

    // Logic: load initial batch of staff, then filter or search
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(initialData?.staffIds || []);

    // Other Form States
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [staffCount, setStaffCount] = useState(initialData?.staffCount || 1);
    const [description, setDescription] = useState(initialData?.description || "");
    const [address, setAddress] = useState(initialData?.address || "");
    const [amount, setAmount] = useState(initialData?.amount || "");

    // Recurring State
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState("once_week");
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [recurringEndDate, setRecurringEndDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 3);
        return d.toISOString().split('T')[0];
    });

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initial Load for Staff
    useEffect(() => {
        if (isOpen) {
            getPersonnel(1, 50).then(res => {
                if (res.data) setFoundStaff(res.data);
            });
        }
    }, [isOpen]);

    // Sync state with initialData when modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Edit Mode
                // Edit Mode
                // Use customerObj if available (from new query), else fallback provided struct or null
                const cust = initialData.customerObj || initialData.customer || null;
                setSelectedCustomer(cust);
                setCustomerSearch(cust?.name || (typeof initialData.customer === 'string' ? initialData.customer : "") || "");
                setDate(initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                setDescription(initialData.description || "");
                setAddress(initialData.address || "");
                // Explicitly handle amount: if present use it, else empty string. 
                // Ensuring 0 is treated as a value, but undefined/null as empty.
                const initialAmount = initialData.amount !== undefined && initialData.amount !== null ? String(initialData.amount) : "";
                setAmount(initialAmount);

                setStaffCount(initialData.personnel_count || 1);
                setSelectedStaffIds(initialData.assigned_staff || []);
                setIsRecurring(initialData.is_recurring || false);
                setFrequency(initialData.frequency || "once_week");
            } else {
                // New Mode - Reset to clean state
                setSelectedCustomer(null);
                setCustomerSearch("");
                setDate(new Date().toISOString().split('T')[0]);
                setDescription("");
                setAddress("");
                setAmount(""); // Force empty string to show placeholder
                setStaffCount(1);
                setSelectedStaffIds([]);
                setIsRecurring(false);
                setFrequency("once_week");
            }
            // Clear search results
            setFoundCustomers([]);
            setShowCustomerResults(false);
        }
    }, [isOpen, initialData]);

    // Customer Search Logic (Debounced)
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (!customerSearch.trim()) {
            setFoundCustomers([]);
            setShowCustomerResults(false);
            return;
        }

        // Don't search if the search text matches the selected customer's name exactly (avoids re-triggering on selection)
        if (selectedCustomer && customerSearch === selectedCustomer.name) {
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearchingCustomer(true);
            try {
                const { data } = await getCustomers(1, 10, customerSearch);
                setFoundCustomers(data || []);
                setShowCustomerResults(true);
            } catch (error) {
                console.error(error);
            } finally {
                setIsSearchingCustomer(false);
            }
        }, 300);

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [customerSearch, selectedCustomer]);

    const handleSelectCustomer = (customer: any) => {
        setSelectedCustomer(customer);
        setCustomerSearch(customer.name);

        // Handle Address Auto-fill
        let defaultAddress = "";
        const rawAddr = customer.address_json || customer.address;

        if (Array.isArray(rawAddr) && rawAddr.length > 0) {
            const firstAddr = rawAddr[0];
            defaultAddress = (typeof firstAddr === 'object' && firstAddr !== null) ? (firstAddr.address || "") : String(firstAddr);
        } else if (rawAddr) {
            defaultAddress = (typeof rawAddr === 'object' && rawAddr !== null) ? (rawAddr.address || "") : String(rawAddr);
        }
        setAddress(defaultAddress);

        setShowCustomerResults(false);
    };

    const toggleStaff = (id: string) => {
        setSelectedStaffIds(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const toggleDay = (day: string, maxSelection: number) => {
        setSelectedDays(prev => {
            if (prev.includes(day)) {
                return prev.filter(d => d !== day);
            }
            if (prev.length >= maxSelection) {
                return prev;
            }
            return [...prev, day];
        });
    };

    const handleSave = async () => {
        if (!selectedCustomer) {
            toast.error("Lütfen bir müşteri seçin.");
            return;
        }
        if (!date) {
            toast.error("Lütfen tarih seçin.");
            return;
        }

        const payload = {
            customer_id: selectedCustomer.id,
            date,
            description,
            address,
            price: parseFloat(amount || "0"),
            personnel_count: staffCount,
            is_recurring: isRecurring,
            frequency: isRecurring ? frequency : null,
            recurring_days: isRecurring ? selectedDays : [],
            recurring_end_date: isRecurring ? recurringEndDate : null,
            assigned_staff: selectedStaffIds
        };

        try {
            console.log("Saving payload:", payload);
            if (onSave) {
                await onSave(payload);
                onClose();
            } else {
                toast.success("Kayıt işlemi (Demo): Başarılı");
                onClose();
            }
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error("Hata oluştu: " + (error.message || error.toString()));
        }
    };

    if (!isOpen) return null;

    // Helper to get available addresses from selected customer
    const rawCustomerAddresses = selectedCustomer?.address_json || selectedCustomer?.address;
    const availableAddresses: string[] = rawCustomerAddresses
        ? (Array.isArray(rawCustomerAddresses)
            ? rawCustomerAddresses.map((a: any) => typeof a === 'object' && a !== null ? (a.address || JSON.stringify(a)) : String(a))
            : [typeof rawCustomerAddresses === 'object' ? (rawCustomerAddresses.address || "") : String(rawCustomerAddresses)])
        : [];

    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-3xl rounded-xl bg-card border border-border shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-border p-6 shrink-0">
                    <h2 className="text-xl font-bold text-card-foreground">
                        {initialData ? "İş Emri Düzenle" : "Yeni İş Emri Oluştur"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Müşteri Seçimi */}
                    <div className="space-y-2 relative">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-foreground">
                                Müşteri <span className="text-red-500">*</span>
                            </label>
                            <button
                                onClick={() => setIsNewCustomerModalOpen(true)}
                                className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                <Plus className="h-3 w-3" />
                                Yeni Müşteri Oluştur
                            </button>
                        </div>

                        <NewCustomerModal
                            isOpen={isNewCustomerModalOpen}
                            onClose={() => setIsNewCustomerModalOpen(false)}
                            onSuccess={(newCustomer) => {
                                handleSelectCustomer(newCustomer);
                            }}
                        />

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value);
                                    if (selectedCustomer && e.target.value !== selectedCustomer.name) {
                                        setSelectedCustomer(null); // Reset selection if user types
                                    }
                                }}
                                placeholder="Müşteri ara (isim veya telefon)..."
                                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground placeholder:text-muted-foreground"
                            />
                            {isSearchingCustomer && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {showCustomerResults && foundCustomers.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {foundCustomers.map(customer => (
                                    <button
                                        key={customer.id}
                                        onClick={() => handleSelectCustomer(customer)}
                                        className="w-full text-left px-4 py-3 hover:bg-muted/50 border-b border-border last:border-0"
                                    >
                                        <div className="font-bold text-popover-foreground text-sm">{customer.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {customer.phone} - {
                                                (() => {
                                                    const addr = Array.isArray(customer.address) ? customer.address[0] : customer.address;
                                                    if (typeof addr === 'object' && addr !== null) {
                                                        return addr.address || addr.label || JSON.stringify(addr);
                                                    }
                                                    return addr;
                                                })()
                                            }
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {showCustomerResults && foundCustomers.length === 0 && customerSearch.length > 2 && !isSearchingCustomer && (
                            <div className="absolute z-10 w-full mt-1 bg-popover p-4 text-sm text-muted-foreground text-center border border-border rounded-lg shadow-lg">
                                Sonuç bulunamadı.
                            </div>
                        )}
                    </div>

                    {/* Tarih ve Personel Sayısı */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground">
                                İş Tarihi <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground">
                                Personel Sayısı <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={staffCount}
                                onChange={(e) => setStaffCount(Number(e.target.value))}
                                min={1}
                                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground"
                            />
                        </div>
                    </div>

                    {/* Personel Seçimi */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">
                            Personel Seçimi <span className="text-xs font-normal text-muted-foreground">(Opsiyonel)</span>
                        </label>
                        <div className="rounded-lg border border-input p-4 space-y-3">
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={staffSearch}
                                    onChange={(e) => setStaffSearch(e.target.value)}
                                    placeholder="Listede ara..."
                                    className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {foundStaff
                                    .filter(s => s.full_name?.toLowerCase().includes(staffSearch.toLowerCase()) || s.name?.toLowerCase().includes(staffSearch.toLowerCase()))
                                    .map((staff) => (
                                        <label key={staff.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedStaffIds.includes(staff.id)}
                                                onChange={() => toggleStaff(staff.id)}
                                                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                                            />
                                            <span className="text-sm font-medium text-foreground">{staff.full_name || staff.name}</span>
                                        </label>
                                    ))}
                                {foundStaff.length === 0 && <div className="text-xs text-muted-foreground text-center py-2">Personel bulunamadı</div>}
                            </div>
                        </div>
                    </div>

                    {/* Açıklama ve Adres */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground">Açıklama</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="İş açıklaması..."
                                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground placeholder:text-muted-foreground"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-foreground">Adres</label>
                                {availableAddresses.length > 1 && (
                                    <select
                                        className="text-xs border border-input bg-background rounded px-2 py-1 outline-none focus:border-ring max-w-[150px] truncate"
                                        onChange={(e) => setAddress(e.target.value)}
                                        value={""} // Always show placeholder behavior, or manage state properly? 
                                    // Better: "Adres Seç" option as first
                                    >
                                        <option value="" disabled>Kayıtlı Adresler</option>
                                        {availableAddresses.map((addr, i) => (
                                            <option key={i} value={addr}>{addr}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="İş adresi..."
                                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-blue-500/10 text-foreground placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>

                    {/* Tutar */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">
                            Tutar (₺) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Tekrarlayan İş Emri */}
                    <div className="space-y-4 pt-2 border-t border-border">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                            />
                            <span className="text-sm font-bold text-foreground">Tekrarlayan İş Emri</span>
                        </label>

                        {isRecurring && (
                            <div className="space-y-4 pl-6 animate-in slide-in-from-top-2 duration-200">
                                {/* Sıklık Seçimi */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">Sıklık</label>
                                    <select
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value)}
                                        className="w-full appearance-none rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground"
                                    >
                                        <option value="once_week">Haftada 1</option>
                                        <option value="twice_week">Haftada 2</option>
                                        <option value="once_month">Ayda 1</option>
                                    </select>
                                </div>

                                {/* Bitiş Tarihi */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">Bitiş Tarihi</label>
                                    <input
                                        type="date"
                                        value={recurringEndDate}
                                        onChange={(e) => setRecurringEndDate(e.target.value)}
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground"
                                    />
                                </div>

                                {/* Haftada 1 Seçimi */}
                                {frequency === 'once_week' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-foreground">Gün Seçimi</label>
                                        <div className="flex flex-wrap gap-2">
                                            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
                                                <button
                                                    key={day}
                                                    onClick={() => toggleDay(day, 1)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded text-sm font-medium border transition-colors",
                                                        selectedDays.includes(day)
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                                                    )}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Haftada 2 Seçimi */}
                                {frequency === 'twice_week' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-foreground">Gün Seçimi (En fazla 2)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
                                                <button
                                                    key={day}
                                                    onClick={() => toggleDay(day, 2)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded text-sm font-medium border transition-colors",
                                                        selectedDays.includes(day)
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                                                    )}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Ayda 1 Seçimi */}
                                {frequency === 'once_month' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-foreground">Gün Seçimi</label>
                                        <select className="w-full appearance-none rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground">
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                <option key={day} value={day}>{day}. Gün</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Bitiş Tarihi */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">
                                        Bitiş Tarihi <span className="text-xs font-normal text-muted-foreground">(Opsiyonel)</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 border-t border-border p-6 bg-muted/40 shrink-0 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                    >
                        Kaydet
                    </button>
                </div>

            </div>
        </div>
    );
}
