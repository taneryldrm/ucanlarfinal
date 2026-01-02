"use client";

import { Header } from "@/components/Header";
import { Plus, Trash2, Calendar, TrendingUp, TrendingDown, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { NewTransactionModal } from "@/components/NewTransactionModal";
import { cn } from "@/lib/utils";
import { getTransactions, supabase, deleteCollection, deleteExpense } from "@/lib/supabaseQueries";
import { toast } from "sonner";

export default function GelirGiderPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'thisMonth' | 'allTime' | 'custom'>('thisMonth');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const { getStats } = await import("@/lib/supabaseQueries");
      const { data, count } = await getTransactions(page, pageSize, filterType, dateRange);
      setTransactions(data || []);
      setTotalCount(count || 0);

      const statsData = await getStats(filterType, dateRange);
      setStats(statsData);

    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
    // Also fetch stats? 
    // Implementing a quick stats fetch here for better UX

  }, [page, filterType, dateRange.start, dateRange.end]);

  const getFilterLabel = () => {
    switch (filterType) {
      case 'thisMonth':
        return new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
      case 'allTime':
        return 'Tüm Zamanlar';
      case 'custom':
        return 'Özel Tarih Aralığı';
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleDelete = async (tx: any) => {
    if (!window.confirm("Bu işlemi silmek istediğinize emin misiniz?")) return;

    try {
      if (tx.type === 'income') {
        await deleteCollection(tx.id);
      } else {
        await deleteExpense(tx.id);
      }
      toast.success("İşlem başarıyla silindi");
      fetchTransactions();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Silme işlemi başarısız oldu");
    }
  };

  return (
    <>
      <Header title="Gelir / Gider" />
      <div className="p-8 space-y-6">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Gelir / Gider</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white transition-colors hover:bg-blue-700 shadow-md shadow-blue-200"
          >
            <Plus className="h-5 w-5" />
            Yeni İşlem
          </button>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
            <Calendar className="h-4 w-4" />
            <span>Tarih Aralığı:</span>
          </div>

          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => { setFilterType('thisMonth'); setPage(1); }}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                filterType === 'thisMonth'
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-slate-600 hover:bg-slate-200"
              )}
            >
              Bu Ay
            </button>
            <button
              onClick={() => { setFilterType('allTime'); setPage(1); }}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                filterType === 'allTime'
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-slate-600 hover:bg-slate-200"
              )}
            >
              Tüm Zamanlar
            </button>
            <button
              onClick={() => { setFilterType('custom'); setPage(1); }}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                filterType === 'custom'
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-slate-600 hover:bg-slate-200"
              )}
            >
              Özel Tarih
            </button>
          </div>

          {filterType === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setPage(1); }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500 max-w-[140px]"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setPage(1); }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500 max-w-[140px]"
              />
            </div>
          )}

          <span className="text-sm font-bold text-slate-400 md:ml-auto">
            {getFilterLabel()}
          </span>
        </div>

        {/* Stats Cards - Note: Currently 0 as not fetching aggregations separetely yet */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Income Card */}
          <div className="bg-green-50 rounded-xl border border-green-100 p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-green-700 font-bold text-sm">Genel Gelir</p>
              <h3 className="text-2xl font-black text-green-700">₺{stats.income.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          {/* Expense Card */}
          <div className="bg-red-50 rounded-xl border border-red-100 p-6 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-red-700 font-bold text-sm">Genel Gider</p>
              <h3 className="text-2xl font-black text-red-700">₺{stats.expense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-blue-700 font-bold text-sm">Net Bakiye</p>
              <h3 className="text-2xl font-black text-blue-700">₺{stats.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 min-h-[500px]">
          <h3 className="text-base font-bold text-slate-900 mb-6">Tüm İşlemler</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-slate-500 border-b border-slate-50">
                <tr>
                  <th className="px-4 py-4 font-medium w-24">Tip</th>
                  <th className="px-4 py-4 font-medium">Ad/Kategori</th>
                  <th className="px-4 py-4 font-medium">Açıklama</th>
                  <th className="px-4 py-4 font-medium">Tarih</th>
                  <th className="px-4 py-4 font-medium">Ödeme</th>
                  <th className="px-4 py-4 font-medium">İşlemi Yapan</th>
                  <th className="px-4 py-4 font-medium text-right">Tutar</th>
                  <th className="px-4 py-4 font-medium text-center w-16">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500">Yükleniyor...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500 italic">
                      Henüz kayıtlı işlem bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx, idx) => (
                    <tr key={tx.id || idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-4">
                        <span className={cn(
                          "inline-block w-full text-center py-1 rounded text-xs font-bold",
                          tx.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {tx.type === "income" ? "Gelir" : "Gider"}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-900">{tx.category || tx.source || '-'}</td>
                      <td className="px-4 py-4 text-slate-700 font-medium">{tx.description || '-'}</td>
                      <td className="px-4 py-4 text-slate-900 font-bold">{tx.date}</td>
                      <td className="px-4 py-4">
                        <span className="inline-block px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                          {tx.method || tx.payment_method || 'Nakit'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500">{tx.user || '-'}</td>
                      <td className={cn(
                        "px-4 py-4 text-right font-black",
                        tx.type === "income" ? "text-green-600" : "text-red-600"
                      )}>
                        {tx.type === "income" ? "+" : "-"}₺{tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleDelete(tx)}
                          className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="text-sm text-slate-500">
                Toplam {totalCount} kayıt, Sayfa {page} / {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Önceki
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
                >
                  Sonraki <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      <NewTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
