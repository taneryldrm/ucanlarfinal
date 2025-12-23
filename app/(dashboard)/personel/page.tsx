"use client";

import { Header } from "@/components/Header";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Link from "next/link";
import { NewPersonnelModal } from "@/components/NewPersonnelModal";
import { getPersonnel, supabase } from "@/lib/supabaseQueries";

export default function PersonelPage() {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [editingPersonnel, setEditingPersonnel] = useState<any>(null);

  // Pagination & Search States
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchPersonnel() {
    setLoading(true);
    try {
      const { data, count } = await getPersonnel(page, pageSize, search);
      setPersonnel(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching personnel:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchPersonnel();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search]);

  const handleDelete = async (id: number) => {
    if (confirm("Bu personeli silmek istediğinize emin misiniz?")) {
      try {
        const { error } = await supabase.from('personnel').delete().eq('id', id);
        if (error) throw error;
        fetchPersonnel();
      } catch (err) {
        console.error("Delete error", err);
        alert("Silme işlemi başarısız oldu.");
      }
    }
  };

  const handleEdit = (person: any) => {
    setEditingPersonnel(person);
    setIsNewModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingPersonnel(null);
    setIsNewModalOpen(true);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <Header title="Personel" />
      <div className="p-8 space-y-6">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Personel</h2>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 shadow-md shadow-blue-200"
          >
            <Plus className="h-4 w-4" />
            Yeni Personel
          </button>
        </div>

        {/* Content Box */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">

          {/* Search Bar */}
          <div className="mb-6 max-w-md relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="İsim veya telefon ile ara..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          {/* Personnel Table */}
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-4 font-medium">Personel Adı</th>
                  <th className="px-4 py-4 font-medium">Telefon</th>
                  <th className="px-4 py-4 font-medium">TC No</th>
                  <th className="px-4 py-4 font-medium">Durum</th>
                  <th className="px-4 py-4 text-center font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">Yükleniyor...</td></tr>
                ) : personnel.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                ) : (
                  personnel.map((person) => (
                    <tr key={person.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 font-bold text-slate-800 uppercase text-xs">{person.full_name || person.name}</td>
                      <td className="px-4 py-4 font-medium text-slate-900 text-xs">{person.phone}</td>
                      <td className="px-4 py-4 text-slate-600 font-mono text-xs">{person.tc_no || person.tc}</td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          "inline-block rounded px-2 py-0.5 text-[10px] font-bold border",
                          person.status === "Aktif"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                          {person.status || 'Aktif'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/personel/${person.id}`}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            title="Detay"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleEdit(person)}
                            className="rounded p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                            title="Düzenle">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(person.id)}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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

      <NewPersonnelModal
        isOpen={isNewModalOpen}
        onClose={() => { setIsNewModalOpen(false); fetchPersonnel(); }}
        initialData={editingPersonnel}
      />
    </>
  );
}
