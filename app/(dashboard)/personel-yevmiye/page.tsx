"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Search, Calendar, Filter, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WageEditModal } from "@/components/WageEditModal";
import { getDailyPersonnelSummary, upsertPayrollRecord } from "@/lib/supabaseQueries";
import { toast } from "sonner";

export default function PersonelYevmiyePage() {
  const [wageList, setWageList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWage, setEditingWage] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showBalanceOnly, setShowBalanceOnly] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await getDailyPersonnelSummary(selectedDate, showBalanceOnly);
      setWageList(data);
    } catch (error) {
      console.error("Error fetching wages:", error);
      toast.error("Veriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  // Reload when filters change
  useEffect(() => {
    fetchData();
  }, [selectedDate, showBalanceOnly]);

  const filteredList = wageList.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (person: any) => {
    setEditingWage(person);
    setIsModalOpen(true);
  };

  const handleSave = async (updatedData: any) => {
    try {
      // Calls Supabase to save to payroll_records
      // 'updatedData' comes from Modal: { id (personId), devir, hakedis, odenen, description }
      // We need 'date' as well.
      await upsertPayrollRecord({
        personnel_id: updatedData.id,
        date: selectedDate,
        daily_wage: updatedData.hakedis,
        paid_amount: updatedData.odenen,

        description: updatedData.description
      });

      toast.success("Kayıt güncellendi.");
      setIsModalOpen(false);
      setEditingWage(null);
      fetchData(); // Refresh list to get updated calculations/ids

    } catch (error) {
      console.error("Error saving wage:", error);
      toast.error("Kaydetme başarısız.");
    }
  };

  return (
    <>
      <Header title="Personel Yevmiye" />
      <div className="p-8 space-y-6">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Personel Yevmiye</h2>
        </div>

        {/* Content Box */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">

          {/* Filters Bar */}
          <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="İsim ile ara..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            {/* Date Picker */}
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
              />
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            {/* Toggle Balance Only */}
            <button
              onClick={() => setShowBalanceOnly(!showBalanceOnly)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                showBalanceOnly
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              <Filter className="h-4 w-4" />
              Bakiyesi Olanlar
            </button>

          </div>

          {/* Yevmiye Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-4 font-medium">Ad Soyad</th>
                  <th className="px-4 py-4 font-medium">Telefon</th>
                  <th className="px-4 py-4 font-medium">Bugün Çalıştığı İş</th>
                  <th className="px-4 py-4 font-bold text-slate-700 text-right">Devir</th>
                  <th className="px-4 py-4 font-bold text-slate-700 text-right">Hakediş</th>
                  <th className="px-4 py-4 font-bold text-slate-700 text-right">Ödenen</th>
                  <th className="px-4 py-4 font-bold text-slate-700 text-right">Bakiye</th>
                  <th className="px-4 py-4 text-center font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      Yükleniyor...
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      Kayıt bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((person) => (
                    <tr key={person.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 font-bold text-slate-800 uppercase text-xs">{person.name}</td>
                      <td className="px-4 py-4 font-medium text-slate-900 text-xs">{person.phone || '-'}</td>
                      <td className="px-4 py-4 text-slate-600 text-xs">{person.job}</td>
                      <td className="px-4 py-4 text-right font-bold text-slate-600">
                        ₺{person.devir.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-green-600">
                        ₺{person.hakedis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-red-600">
                        ₺{person.odenen.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={cn(
                        "px-4 py-4 text-right font-black",
                        person.bakiye > 0 ? "text-red-700" : "text-slate-900"
                      )}>
                        ₺{person.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleEdit(person)}
                          className="rounded border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transform active:scale-95 transition-all"
                        >
                          Düzenle
                        </button>
                      </td>
                    </tr>
                  )))}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      <WageEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingWage}
        onSave={handleSave}
      />
    </>
  );
}

