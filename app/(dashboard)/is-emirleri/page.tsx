"use client";



import { Header } from "@/components/Header";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { NewJobModal } from "@/components/NewJobModal";
import { getWorkOrders, supabase } from "@/lib/supabaseQueries";
import { toast } from "sonner";

import { useUserRole } from "@/hooks/useUserRole";
import { PERMISSIONS, hasPermission } from "@/lib/rbac";

import { Suspense } from "react";

function IsEmirleriContent() {
  const { role } = useUserRole();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Default to today's date in YYYY-MM-DD format for input
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [editingJob, setEditingJob] = useState<any>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();

  async function fetchJobs() {
    setLoading(true);
    try {
      const { data, count } = await getWorkOrders(page, pageSize, '', selectedDate); // Search param empty for now
      setJobs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
  }, [page, selectedDate]); // Refetch when date or page changes

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setEditingJob(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const handleDelete = async (id: number) => {
    if (confirm("Bu iş emrini silmek istediğinize emin misiniz?")) {
      try {
        const { deleteWorkOrder } = await import("@/lib/supabaseQueries");
        await deleteWorkOrder(id);
        fetchJobs();
      } catch (err) {
        console.error(err);
        alert("Silinemedi: " + (err as any).message)
      }
    }
  };

  const handleEdit = (job: any) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const canDelete = hasPermission(role || undefined, PERMISSIONS.CAN_DELETE);

  return (
    <>
      <Header title="İş Emirleri" />
      <div className="p-8 space-y-6">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">İş Emirleri</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-card rounded-lg border border-border p-1">
              <span className="text-xs font-semibold text-muted-foreground px-2">Tarih:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
                className="px-2 py-1.5 text-sm font-bold text-foreground bg-muted/50 rounded border border-border hover:bg-muted outline-none"
              />
              <button
                onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setPage(1); }}
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded"
              >
                Bugün
              </button>
            </div>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 shadow-md shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              Yeni İş Emri
            </button>
          </div>
        </div>

        {/* Jobs List */}
        <div className="rounded-xl border border-border bg-card shadow-sm p-6 min-h-[500px]">
          <h3 className="text-sm font-bold text-foreground mb-4">Mevcut İş Emirleri</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Müşteri</th>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium">Açıklama</th>
                  <th className="px-4 py-3 font-medium">Personel</th>
                  <th className="px-4 py-3 font-medium">Tutar</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 text-right font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Yükleniyor...</td></tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Seçilen tarihte iş emri bulunamadı.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-4 font-bold text-foreground">{job.customer}</td>
                      <td className="px-4 py-4 text-foreground font-medium">
                        {new Date(job.date).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-4 text-foreground">{job.description}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded bg-muted/50 text-xs font-bold text-muted-foreground">
                          {/* Handle personnel generic or specialized display */}
                          {Array.isArray(job.personnel) ? job.personnel.join(", ") : (job.personnel || 'Belirsiz')}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold text-foreground">
                        ₺{(job.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded ${job.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          job.status === 'approved' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            job.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              job.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-muted text-muted-foreground'
                          }`}>
                          {job.status === 'pending' ? 'Onay Bekliyor' :
                            job.status === 'approved' ? 'Onaylandı' :
                              job.status === 'completed' ? 'Tamamlandı' :
                                job.status === 'cancelled' ? 'İptal' :
                                  job.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(job)}
                            className="px-3 py-1 rounded border border-border text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            Düzenle
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(job.id)}
                              className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )))}
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
                  className="flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium hover:bg-muted text-foreground disabled:opacity-50 disabled:text-muted-foreground"
                >
                  <ChevronLeft className="h-4 w-4" /> Önceki
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium hover:bg-muted text-foreground disabled:opacity-50 disabled:text-muted-foreground"
                >
                  Sonraki <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      <NewJobModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); fetchJobs(); }}
        initialData={editingJob}
        onSave={async (data) => {
          try {
            if (editingJob && editingJob.id) {
              const { updateWorkOrder } = await import("@/lib/supabaseQueries");
              await updateWorkOrder(editingJob.id, data);
              toast.success("İş emri güncellendi.");
            } else {
              const { createWorkOrder } = await import("@/lib/supabaseQueries");
              await createWorkOrder(data);
              toast.success("İş emri oluşturuldu.");
            }
            setIsModalOpen(false);
            fetchJobs();
          } catch (error: any) {
            console.error(error);
            // Toast is handled inside modal for detailed errors, but we can re-throw to let modal know if needed
            // However, our current Modal implementation catches errors inside its own handleSave and shows toast.
            // Wait, the Modal calls onSave. If onSave throws, the Modal catches it.
            throw error;
          }
        }}
      />
    </>
  );
}

export default function IsEmirleriPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Yükleniyor...</div>}>
      <IsEmirleriContent />
    </Suspense>
  );
}
