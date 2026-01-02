"use client";

import { Header } from "@/components/Header";
import { Printer, Calendar, Clock, Users, Check, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getWorkOrders, approveWorkOrder } from "@/lib/supabaseQueries";
import { useUserRole } from "@/hooks/useUserRole";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { toast } from "sonner";

export default function GunlukProgramPage() {
  // Default to today
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const { role } = useUserRole();
  const canApprove = hasPermission(role || undefined, PERMISSIONS.CAN_APPROVE_WORK_ORDER);

  // Fetch logic
  const fetchDailyJobs = async () => {
    setLoading(true);
    try {
      // Fetch all jobs for the date (pageSize 100 to be safe for a day view)
      const { data } = await getWorkOrders(1, 100, "", selectedDate);
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching daily jobs:", error);
      toast.error("Günlük işler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyJobs();
  }, [selectedDate]);

  // Derived stats
  // Personnel is string "Name1, Name2" or "Belirsiz". 
  // To count unique staff, we might need to parse strings or use the 'assigned_staff' ID array if we mapped it.
  // getWorkOrders now maps 'assigned_staff' (IDs). We can use that.
  const uniqueStaffIds = new Set(jobs.flatMap(j => j.assigned_staff || []));
  const totalStaff = uniqueStaffIds.size;

  const handleApprove = async (id: string) => {
    try {
      await approveWorkOrder(id);
      toast.success("İş emri onaylandı.");
      fetchDailyJobs(); // Refresh
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Onaylama başarısız.");
    }
  };

  const handleApproveAll = async () => {
    // Optional: Implement approve all if needed. For now simple loop or single bulk endpoint.
    // User logic was client side mock.
    // Let's implement loop for now (safest without new backend func)
    try {
      const pending = jobs.filter(j => j.status === 'pending');
      await Promise.all(pending.map(j => approveWorkOrder(j.id)));
      toast.success("Tüm işler onaylandı.");
      fetchDailyJobs();
    } catch (error) {
      toast.error("Toplu onay işleminde hata.");
    }
  };

  return (
    <>
      <div className="print:hidden">
        <Header title="Günlük Program" />
        <div className="p-8 space-y-6">

          {/* ... (Header and Stats sections remain same) ... */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold text-foreground">Günlük İş Programı</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Printer className="h-4 w-4" />
                Yazdır
              </button>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2 py-1.5 text-sm font-bold text-foreground bg-muted/50 rounded border border-border hover:bg-muted outline-none"
                />
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded"
                >
                  Bugün
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
              <div className="rounded-full bg-blue-50 dark:bg-blue-900/20 p-3">
                <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam İş</p>
                <h3 className="text-3xl font-bold text-foreground">{jobs.length}</h3>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
              <div className="rounded-full bg-green-50 dark:bg-green-900/20 p-3">
                <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Çalışan Personel</p>
                <h3 className="text-3xl font-bold text-foreground">{totalStaff}</h3>
              </div>
            </div>
          </div>

          {/* Daily Tasks List */}
          <div className="rounded-xl border border-border bg-card shadow-sm p-6 min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-foreground">Günün İşleri</h3>
              {canApprove && (
                <button
                  onClick={handleApproveAll}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors shadow-sm shadow-green-200 dark:shadow-none"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Hepsini Onayla
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-4 font-medium">Müşteri</th>
                    <th className="px-4 py-4 font-medium">Personel</th>
                    <th className="px-4 py-4 font-medium">Açıklama</th>
                    <th className="px-4 py-4 font-medium">Adres</th>
                    <th className="px-4 py-4 font-medium">Durum</th>
                    <th className="px-4 py-4 text-right font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Yükleniyor...</td></tr>
                  ) : jobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Seçilen tarihte planlanmış iş bulunmamaktadır.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr
                        key={job.id}
                        className="hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedJob(job)}
                      >
                        <td className="px-4 py-4 font-bold text-foreground">{job.customer}</td>
                        <td className="px-4 py-4">
                          <span className="inline-block rounded bg-muted/50 px-3 py-1 text-xs font-bold text-muted-foreground uppercase border border-border">
                            {job.personnel || 'Belirsiz'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-foreground max-w-[200px] truncate">{job.description}</td>
                        <td className="px-4 py-4 text-muted-foreground font-medium max-w-[200px] truncate">{job.address}</td>
                        <td className="px-4 py-4">
                          <span className={cn(
                            "inline-block px-3 py-1 text-xs font-bold rounded",
                            job.status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" :
                              job.status === "pending" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" :
                                "bg-muted text-muted-foreground border border-border"
                          )}>
                            {job.status === 'pending' ? 'Onay Bekliyor' :
                              job.status === 'approved' ? 'Onaylandı' :
                                job.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                            {job.status !== "approved" && canApprove && (
                              <button
                                onClick={() => handleApprove(job.id)}
                                className="px-4 py-1.5 rounded border border-border text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-sm"
                              >
                                Onayla
                              </button>
                            )}
                            {job.status === "approved" && (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-bold px-4 py-1.5">
                                <Check className="h-4 w-4" />
                                Onaylandı
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      </div>

      {/* --- DETAIL POPUP MODAL --- */}
      {
        selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-border p-4 bg-muted/40">
                <h3 className="font-bold text-lg text-foreground">İş Detayı</h3>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <span className="sr-only">Kapat</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Müşteri</label>
                  <div className="text-base font-bold text-foreground mt-1">{selectedJob.customer}</div>
                  {selectedJob.customer_phone && (
                    <div className="text-sm text-muted-foreground">{selectedJob.customer_phone}</div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Personel</label>
                  <div className="mt-1">
                    <span className="inline-block rounded bg-muted/50 border border-border px-3 py-1 text-sm font-bold text-muted-foreground uppercase">
                      {selectedJob.personnel || 'Belirsiz'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Durum</label>
                  <div className="mt-1">
                    <span className={cn(
                      "inline-block px-3 py-1 text-xs font-bold rounded",
                      selectedJob.status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" :
                        selectedJob.status === "pending" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" :
                          "bg-muted text-muted-foreground border border-border"
                    )}>
                      {selectedJob.status === 'pending' ? 'Onay Bekliyor' :
                        selectedJob.status === 'approved' ? 'Onaylandı' :
                          selectedJob.status}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/20 border border-border">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                    Adres
                  </label>
                  <div className="text-sm text-foreground mt-2 font-medium whitespace-pre-wrap">
                    {selectedJob.address || '-'}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/20 border border-border">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Açıklama</label>
                  <div className="text-sm text-foreground mt-2 whitespace-pre-wrap">
                    {selectedJob.description || '-'}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-border bg-muted/40 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted"
                >
                  Kapat
                </button>
                {selectedJob.status !== "approved" && canApprove && (
                  <button
                    onClick={() => {
                      handleApprove(selectedJob.id);
                      setSelectedJob(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 dark:shadow-none"
                  >
                    Onayla
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* --- PRINT VIEW --- */}
      <div className="hidden print:block p-4 font-sans text-xs bg-white text-black min-h-screen">
        {/* Header - Top Line */}
        <div className="flex justify-between border-b border-black pb-2 mb-2 font-bold text-[10px]">
          <div>
            <div>VERGI KIMLIK NUMARASI: 8840638625</div>
            <div>SOYADI (UNVANI): UÇANLAR TEMİZLİK</div>
          </div>
          {/* Placeholder for Logo if needed, or just space */}
          <div className="text-right">
            <div>MAKINA NO: ........................</div>
            <div>SIRA NO: ........................</div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-1">
          <h1 className="text-sm font-bold uppercase">GÜNÜ MOBİL İŞ PROGRAMI</h1>
          <div className="text-[10px] font-bold mt-1">
            Tarih: {selectedDate.split('-').reverse().join('/')}
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse border border-black text-[9px] mt-2">
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="border border-black p-1 w-8">Sıra No</th>
              <th className="border border-black p-1">Müşteri Ad - Unvan</th>
              <th className="border border-black p-1 w-20">Müşteri Tel</th>
              <th className="border border-black p-1">Personel Ad</th>
              <th className="border border-black p-1 w-48">Yapılacak İş ve Açıklamalar</th>
              <th className="border border-black p-1">İş Adresi</th>
              <th className="border border-black p-1 w-16">Ücret</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, i) => (
              <tr key={job.id}>
                <td className="border border-black p-1 text-center font-bold">{i + 1}</td>
                <td className="border border-black p-1 font-bold">{job.customer}</td>
                <td className="border border-black p-1 text-center">{job.customer_phone || '-'}</td>
                <td className="border border-black p-1 font-bold">{job.personnel}</td>
                <td className="border border-black p-1">{job.description}</td>
                <td className="border border-black p-1">{job.address}</td>
                <td className="border border-black p-1 text-right">{job.amount ? `₺${job.amount}` : '-'}</td>
              </tr>
            ))}
            {/* Fill empty rows to make it look like a full form */}
            {Array.from({ length: Math.max(0, 25 - jobs.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border border-black p-1 h-6 text-center">{jobs.length + i + 1}</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
