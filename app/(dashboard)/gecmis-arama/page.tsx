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

        <h2 className="text-2xl font-bold text-foreground">Geçmiş Arama</h2>

        {/* Search Criteria Box */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-foreground text-sm">Arama Kriterleri</h3>

          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Arama Terimi</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Müşteri adı, açıklama vb..."
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Tarih Aralığı</label>
              <div className="flex items-center gap-2">
                {!isAllTime && (
                  <>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-lg border border-input bg-background py-2 px-3 text-sm outline-none focus:border-ring text-foreground"
                    />
                    <span className="text-muted-foreground">-</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-lg border border-input bg-background py-2 px-3 text-sm outline-none focus:border-ring text-foreground"
                    />
                  </>
                )}

                <div className="flex items-center gap-2 pl-2 bg-muted/50 border border-border rounded-lg px-3 py-2">
                  <input
                    type="checkbox"
                    checked={isAllTime}
                    onChange={(e) => setIsAllTime(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Tüm Zamanlar</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-8 py-2.5 font-bold text-primary-foreground transition-colors hover:bg-primary/90 shadow-md shadow-primary/20 dark:shadow-none disabled:opacity-50"
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
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm min-h-[400px]">
          <h3 className="font-bold text-foreground mb-6">
            Sonuçlar {hasSearched && `(${searchResults.length})`}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Kaynak</th>
                  <th className="px-4 py-3 font-medium">Ad/İsim</th>
                  <th className="px-4 py-3 font-medium">Açıklama</th>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium">Tutar/Bakiye</th>
                  <th className="px-4 py-3 font-medium">Ek Bilgi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!hasSearched ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      Arama yapmak için yukarıdaki formu kullanın.
                    </td>
                  </tr>
                ) : searchResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      Kriterlere uygun kayıt bulunamadı.
                    </td>
                  </tr>
                ) : (
                  searchResults.map((result) => (
                    <tr key={result.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-4">
                        <span className="inline-block rounded px-2 py-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          {result.source}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold text-foreground uppercase">{result.name}</td>
                      <td className="px-4 py-4 text-foreground text-xs max-w-md">{result.description}</td>
                      <td className="px-4 py-4 font-medium text-foreground">{result.date}</td>
                      <td className="px-4 py-4 text-muted-foreground text-center">{result.amount}</td>
                      <td className="px-4 py-4 text-muted-foreground text-xs whitespace-pre-line">
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

