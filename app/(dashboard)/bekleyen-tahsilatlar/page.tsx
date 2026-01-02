"use client";

import { Header } from "@/components/Header";
import { Search, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getPendingCollectionsPaginated } from "@/lib/supabaseQueries";

export default function BekleyenTahsilatlarPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [pendingCollections, setPendingCollections] = useState<any[]>([]);

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [totalPendingAmount, setTotalPendingAmount] = useState(0);

    async function fetchCollections() {
        setLoading(true);
        try {
            const { data, count } = await getPendingCollectionsPaginated(page, pageSize, searchTerm);
            setPendingCollections(data || []);
            setTotalCount(count || 0);

            // Calculate total pending for the page (or ideally global if possible, but let's just sum current page for the card for now to show movement)
            // or we need a global sum query.
            // For now, let's sum the fetched page.
            const sum = data?.reduce((acc: number, curr: any) => acc + (curr.pending || 0), 0) || 0;
            setTotalPendingAmount(sum);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCollections();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, searchTerm]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <>
            <Header title="Bekleyen Tahsilatlar" />
            <div className="p-8 space-y-6">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">Bekleyen Tahsilatlar</h2>
                    <div className="flex items-center gap-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 px-3 py-1 text-sm font-medium text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-800/30">
                        <CreditCard className="h-4 w-4" />
                        Toplam Bekleyen (Bu Sayfa): <span className="font-bold">₺{totalPendingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* Content Box */}
                <div className="rounded-xl border border-border bg-card shadow-sm p-6">

                    {/* Search Bar */}
                    <div className="mb-6 max-w-md relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            placeholder="Müşteri ara..."
                            className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left text-sm">
                            <thead className="text-muted-foreground border-b border-border">
                                <tr>
                                    <th className="px-4 py-4 font-medium">Müşteri</th>
                                    <th className="px-4 py-4 font-medium">Telefon</th>
                                    <th className="px-4 py-4 font-medium">Son İşlem Tarihi</th>
                                    <th className="px-4 py-4 font-bold text-foreground text-right">Bekleyen Tutar</th>
                                    <th className="px-4 py-4 text-center font-medium">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Yükleniyor...</td></tr>
                                ) : pendingCollections.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            Bekleyen tahsilat bulunmamaktadır.
                                        </td>
                                    </tr>
                                ) : (
                                    pendingCollections.map((item, index) => (
                                        <tr key={index} className="group hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-4 font-bold text-foreground">{item.name}</td>
                                            <td className="px-4 py-4 text-muted-foreground">{item.phone || '-'}</td>
                                            <td className="px-4 py-4 text-muted-foreground">{item.lastTransactionDate}</td>
                                            <td className="px-4 py-4 text-right font-bold text-orange-600 dark:text-orange-400">
                                                ₺{item.pending.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <Link
                                                    href={`/gunluk-kasa?customerId=${item.id}&customerName=${encodeURIComponent(item.name)}&amount=${item.pending}`}
                                                    className="inline-flex items-center justify-center rounded bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 transition-colors shadow-sm shadow-green-200 dark:shadow-none"
                                                >
                                                    Tahsil Et
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                            <div className="text-sm text-muted-foreground">
                                Toplam {totalCount} kayıt, Sayfa {page} / {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50 text-foreground"
                                >
                                    <ChevronLeft className="h-4 w-4" /> Önceki
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50 text-foreground"
                                >
                                    Sonraki <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}

                </div>

            </div>
        </>
    );
}
