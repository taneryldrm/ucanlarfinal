"use client";

import { Header } from "@/components/Header";
import { Search } from "lucide-react";
import { useState } from "react";
import { searchGeneral } from "@/lib/supabaseQueries";

export default function GecmisAramaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Date Filters
  const [isAllTime, setIsAllTime] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSearch = async () => {
    // If filtering by date, we allow empty search term (to seeing all transactions in a range)
    if (!searchTerm.trim() && isAllTime) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const dateRange = isAllTime ? undefined : { start: startDate, end: endDate };
      const results = await searchGeneral(searchTerm, dateRange);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      <Header title="Geçmiş Arama" />
      <div className="p-8 space-y-6">

        <h2 className="text-2xl font-bold text-slate-800">Geçmiş Arama</h2>

        {/* Search Criteria Box */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Arama Kriterleri</h3>

          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-slate-700">Arama Terimi</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Müşteri adı, açıklama vb..."
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Tarih Aralığı</label>
              <div className="flex items-center gap-2">
                {!isAllTime && (
                  <>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-lg border border-slate-300 py-2 px-3 text-sm outline-none focus:border-blue-500"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-lg border border-slate-300 py-2 px-3 text-sm outline-none focus:border-blue-500"
                    />
                  </>
                )}

                <div className="flex items-center gap-2 pl-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <input
                    type="checkbox"
                    checked={isAllTime}
                    onChange={(e) => setIsAllTime(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Tüm Zamanlar</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-2.5 font-bold text-white transition-colors hover:bg-blue-700 shadow-md shadow-blue-200 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin">⌛</span>
              ) : (
                <Search className="h-4 w-4" />
              )}
              Ara
            </button>
          </div>
        </div>

        {/* Results Box */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm min-h-[400px]">
          <h3 className="font-bold text-slate-800 mb-6">
            Sonuçlar {hasSearched && `(${searchResults.length})`}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Kaynak</th>
                  <th className="px-4 py-3 font-medium">Ad/İsim</th>
                  <th className="px-4 py-3 font-medium">Açıklama</th>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium">Tutar/Bakiye</th>
                  <th className="px-4 py-3 font-medium">Ek Bilgi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {!hasSearched ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      Arama yapmak için yukarıdaki formu kullanın.
                    </td>
                  </tr>
                ) : searchResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      Kriterlere uygun kayıt bulunamadı.
                    </td>
                  </tr>
                ) : (
                  searchResults.map((result) => (
                    <tr key={result.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-4">
                        <span className="inline-block rounded px-2 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
                          {result.source}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-800 uppercase">{result.name}</td>
                      <td className="px-4 py-4 text-slate-700 text-xs max-w-md">{result.description}</td>
                      <td className="px-4 py-4 font-medium text-slate-900">{result.date}</td>
                      <td className="px-4 py-4 text-slate-500 text-center">{result.amount}</td>
                      <td className="px-4 py-4 text-slate-500 text-xs whitespace-pre-line">
                        {result.extraInfo.split("|").map((line: string, i: number) => (
                          <div key={i}>{line.trim()}</div>
                        ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </>
  );
}

