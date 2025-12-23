"use client";

import { Search, Loader2, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getCustomers } from "@/lib/supabaseQueries";
import { cn } from "@/lib/utils";

interface CustomerSelectProps {
    onSelect: (customer: any) => void;
    placeholder?: string;
    className?: string;
    defaultValue?: string;
}

export function CustomerSelect({ onSelect, placeholder = "Müşteri ara...", className, defaultValue = "" }: CustomerSelectProps) {
    const [search, setSearch] = useState(defaultValue);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle clicks outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (query: string) => {
        setSearch(query);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (!query.trim()) {
            setResults([]);
            setShowResults(false);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                // Fetch only first 5 for compact dropdown
                const { data } = await getCustomers(1, 5, query);
                setResults(data || []);
                setShowResults(true);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }, 300);
    };

    const handleSelect = (customer: any) => {
        setSearch(customer.name);
        onSelect(customer);
        setShowResults(false);
    };

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => { if (results.length > 0) setShowResults(true); }}
                placeholder={placeholder}
                className="w-full rounded border border-slate-200 py-1.5 pl-8 pr-2 text-xs outline-none focus:border-green-500 transition-colors"
            />
            {loading && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                </div>
            )}

            {showResults && results.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto min-w-[200px]">
                    {results.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => handleSelect(c)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                        >
                            <div className="font-bold text-slate-900 text-xs">{c.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">{c.phone}</div>
                        </button>
                    ))}
                </div>
            )}
            {showResults && results.length === 0 && !loading && search.length > 1 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 text-center">
                    <span className="text-xs text-slate-500">Sonuç yok</span>
                </div>
            )}
        </div>
    );
}
