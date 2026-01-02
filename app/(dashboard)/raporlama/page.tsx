"use client";

import { Header } from "@/components/Header";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  FileText,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useState, useEffect } from "react";
import { getReportingStats, getCustomerPerformanceStats } from "@/lib/supabaseQueries";

export default function RaporlamaPage() {
  const [activeTab, setActiveTab] = useState<"genel" | "musteri" | "tahsilat">("genel");
  const [period, setPeriod] = useState<"6months" | "year" | "lastyear">("year");
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<any>({
    trendData: [],
    profitData: [],
    summary: { income: 0, expense: 0, profit: 0, jobs: 0 }
  });

  const [customerStats, setCustomerStats] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [reportData, custData] = await Promise.all([
          getReportingStats(period),
          getCustomerPerformanceStats()
        ]);

        setData(reportData);
        setCustomerStats(custData);
      } catch (error) {
        console.error("Failed to load report data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [period]);

  const totalBilled = customerStats.reduce((sum, c) => sum + c.billed, 0);
  const totalCollected = customerStats.reduce((sum, c) => sum + c.collected, 0);
  const totalPending = customerStats.reduce((sum, c) => sum + c.pending, 0);
  const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

  return (
    <>
      <Header title="Raporlama" />
      <div className="p-8 space-y-8">

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Raporlama & Analitik</h2>
            <p className="text-slate-500">İş performansı ve finansal analiz</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 outline-none hover:border-slate-300"
            >
              <option value="6months">Son 6 Ay</option>
              <option value="year">Bu Yıl</option>
              {/* <option value="lastyear">Geçen Yıl</option> */}
            </select>
            <button
              onClick={() => window.location.reload()}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Bu Ay Gelir</p>
                <h3 className="mt-2 text-3xl font-bold text-slate-900">
                  ₺{data.summary.income.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="rounded-lg bg-green-50 p-2 text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            {/* Trend info could be added if we compare with prev month */}
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Bu Ay Gider</p>
                <h3 className="mt-2 text-3xl font-bold text-slate-900">
                  ₺{data.summary.expense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="rounded-lg bg-red-50 p-2 text-red-600">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Bu Ay Kar</p>
                <h3 className="mt-2 text-3xl font-bold text-slate-900">
                  ₺{data.summary.profit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Bu Ay İşler</p>
                <h3 className="mt-2 text-3xl font-bold text-slate-900">{data.summary.jobs}</h3>
              </div>
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab("genel")}
              className={cn(
                "border-b-2 py-4 text-sm font-medium transition-colors",
                activeTab === "genel"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              )}
            >
              Genel Bakış
            </button>
            <button
              onClick={() => setActiveTab("musteri")}
              className={cn(
                "border-b-2 py-4 text-sm font-medium transition-colors",
                activeTab === "musteri"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              )}
            >
              Müşteri Analizi
            </button>
            <button
              onClick={() => setActiveTab("tahsilat")}
              className={cn(
                "border-b-2 py-4 text-sm font-medium transition-colors",
                activeTab === "tahsilat"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              )}
            >
              Tahsilat Analizi
            </button>
          </nav>
        </div>

        {/* Content based on Tab */}
        {activeTab === "genel" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Gelir-Gider Trendi */}
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Gelir-Gider Trendi</h3>
              </div>
              <div className="h-80 w-full">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-slate-400">Yükleniyor...</div>
                ) : data.trendData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-400">Veri bulunamadı.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#64748B" fontSize={12} tickMargin={10} />
                      <YAxis axisLine={false} tickLine={false} stroke="#64748B" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line type="monotone" dataKey="gelir" name="Gelir" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: "#22c55e", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="gider" name="Gider" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Kar Trendi */}
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Kar Trendi</h3>
              </div>
              <div className="h-80 w-full">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-slate-400">Yükleniyor...</div>
                ) : data.profitData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-400">Veri bulunamadı.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.profitData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#64748B" fontSize={12} tickMargin={10} />
                      <YAxis axisLine={false} tickLine={false} stroke="#64748B" fontSize={12} />
                      <Tooltip
                        cursor={{ fill: '#F1F5F9' }}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="kar" name="Kar" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Müşteri Analizi Content */}
        {activeTab === "musteri" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6">
                <h3 className="font-bold text-slate-900">Müşteri Performans Analizi</h3>
                <p className="text-sm text-slate-500">Müşteri bazlı finansal hareketler</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Müşteri</th>
                      <th className="px-6 py-4 text-right font-medium">Toplam Faturalanan</th>
                      <th className="px-6 py-4 text-right font-medium">Tahsil Edilen</th>
                      <th className="px-6 py-4 text-right font-medium">Bekleyen</th>
                      <th className="px-6 py-4 text-center font-medium">İş Sayısı</th>
                      <th className="px-6 py-4 text-center font-medium">Tahsilat Oranı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan={6} className="p-8 text-center text-slate-500">Yükleniyor...</td></tr>
                    ) : customerStats.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-slate-500">Veri bulunamadı.</td></tr>
                    ) : (
                      customerStats.map((customer) => (
                        <tr key={customer.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-700">{customer.name}</td>
                          <td className="px-6 py-4 text-right font-medium text-slate-900">
                            ₺{customer.billed.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-green-600">
                            ₺{customer.collected.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-red-600">
                            ₺{customer.pending.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-center font-medium text-slate-600">{customer.jobs}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={cn(
                              "inline-block rounded px-2 py-1 text-xs font-bold text-white",
                              customer.rate >= 50 ? "bg-green-500" : customer.rate > 0 ? "bg-orange-500" : "bg-red-500"
                            )}>
                              {customer.rate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tahsilat Analizi Content */}
        {activeTab === "tahsilat" && (
          <div className="space-y-6">
            {/* Tahsilat Summary Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-white p-6 text-center shadow-sm">
                <h4 className="text-sm font-medium text-slate-500">Toplam Faturalanan</h4>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  ₺{totalBilled.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>
                <div className="mt-1 text-xs text-slate-400">Tüm zamanlar</div>
              </div>
              <div className="rounded-xl border border-green-100 bg-green-50 p-6 shadow-sm">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-green-600">Tahsil Edilen</h4>
                  <div className="mt-2 text-2xl font-bold text-green-700">
                    ₺{totalCollected.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-1 text-xs font-medium text-green-600">
                    <span>{collectionRate.toFixed(1)}% tahsilat oranı</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 p-6 shadow-sm">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-red-600">Bekleyen Tahsilat</h4>
                  <div className="mt-2 text-2xl font-bold text-red-700">
                    ₺{totalPending.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 text-xs font-medium text-red-600">{100 - collectionRate}% kalan</div>
                </div>
              </div>
            </div>

            {/* Progress Bar Section */}
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Tahsilat Oranı Görünümü</h3>
                <span className="font-bold text-green-600">{collectionRate.toFixed(1)}%</span>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm font-medium">
                  <span className="text-slate-600">Tahsilat Oranı</span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-green-500" style={{ width: `${Math.min(100, collectionRate)}%` }}></div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-green-50 p-4">
                  <div className="text-xs font-medium text-green-600">Tahsil Edilen</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-green-700">
                      ₺{totalCollected.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="rounded-lg bg-red-50 p-4">
                  <div className="text-xs font-medium text-red-600">Bekleyen</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-red-700">
                      ₺{totalPending.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                    <ArrowDownRight className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
