"use client";

import { Header } from "@/components/Header";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Link from "next/link";
import { NewCustomerModal } from "@/components/NewCustomerModal";
import { getCustomers, deleteCustomer } from "@/lib/supabaseQueries";

export default function MusterilerPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Tümü");
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, count } = await getCustomers(
        page,
        pageSize,
        searchTerm,
        activeFilter === "Tümü" ? null : activeFilter.toLowerCase()
      );
      setCustomers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, activeFilter]); // Refetch when page or filter changes

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to page 1 on search
      fetchCustomers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDelete = async (id: number) => {
    if (confirm("Bu müşteriyi silmek istediğinize emin misiniz?")) {
      try {
        await deleteCustomer(id);
        setCustomers(prev => prev.filter(c => c.id !== id));
        // Simple alert or toast if available. Since toast isn't imported, I'll add it or just rely on state update.
        // But better to add toast keying off previous patterns.
      } catch (error) {
        console.error("Error deleting customer:", error);
        alert("Silme işlemi başarısız oldu: " + (error as any).message);
      }
    }
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <Header title="Müşteriler" />
      <div className="p-8 space-y-6">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">Müşteriler</h2>
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Users className="h-4 w-4" />
              Toplam: <span className="font-bold">{totalCount}</span>
            </div>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 shadow-md shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Yeni Müşteri
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="İsim veya telefon ile ara..."
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-2 border-l border-border pl-4">
            <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Tip:
            </span>
            <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
              {["Tümü", "Normal", "Düzenli", "Sıkıntılı"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => { setActiveFilter(filter); setPage(1); }}
                  className={cn(
                    "rounded px-3 py-1 text-sm font-medium transition-all",
                    activeFilter === filter
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Customer List Table */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Müşteri Adı</th>
                  <th className="px-6 py-4 font-medium">Tip</th>
                  <th className="px-6 py-4 font-medium">Telefon</th>
                  <th className="px-6 py-4 font-medium">Adres</th>
                  <th className="px-6 py-4 font-medium">Bakiye</th>
                  <th className="px-6 py-4 text-center font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Müşteri bulunamadı.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="group hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{customer.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary border border-primary/20">
                          {customer.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">{customer.phone}</td>
                      <td className="px-6 py-4 text-muted-foreground max-w-xs truncate" title={customer.address}>
                        {customer.address}
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        ₺{(customer.balance || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/musteriler/${customer.id}`} className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title="Detay">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleEdit(customer)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-orange-500/10 hover:text-orange-500 transition-colors"
                            title="Düzenle">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title="Sil">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Toplam <span className="font-bold text-foreground">{totalCount}</span> kayıttan <span className="font-bold text-foreground">{(page - 1) * pageSize + 1}</span> - <span className="font-bold text-foreground">{Math.min(page * pageSize, totalCount)}</span> arası gösteriliyor
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Önceki
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Simple logic to show first 5 pages or context-aware if needed
                    // For now, simpler is better
                    let pNum = i + 1;
                    if (page > 3 && totalPages > 5) {
                      pNum = page - 2 + i;
                    }
                    if (pNum > totalPages) return null;

                    return (
                      <button
                        key={pNum}
                        onClick={() => setPage(pNum)}
                        className={cn(
                          "h-8 w-8 rounded-lg text-sm font-medium transition-colors",
                          page === pNum
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted text-muted-foreground"
                        )}
                      >
                        {pNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      <NewCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingCustomer}
      />
    </>
  );
}
