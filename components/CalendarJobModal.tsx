"use client";

import { X, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    jobs: any[];
}

export function CalendarJobModal({ isOpen, onClose, date, jobs }: CalendarJobModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl rounded-xl bg-card border border-border shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-border p-6 shrink-0 bg-muted/30">
                    <h2 className="text-xl font-bold text-foreground">{date} - İş Detayları</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">

                    {jobs.map((job, idx) => (
                        <div key={idx} className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">

                            {/* Job Header */}
                            <div className="flex items-start justify-between">
                                <h3 className="text-lg font-bold text-foreground">{job.customer}</h3>
                                <span className={cn(
                                    "px-3 py-1 rounded text-xs font-bold uppercase",
                                    job.status === "Onaylanmadı" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                )}>
                                    {job.status}
                                </span>
                            </div>

                            {/* Job Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-muted-foreground uppercase">Açıklama:</span>
                                    <p className="text-sm font-medium text-foreground">{job.description}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-muted-foreground uppercase">Adres:</span>
                                    <p className="text-sm font-medium text-foreground">{job.address}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-muted-foreground uppercase">Tutar:</span>
                                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{job.amount}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-muted-foreground uppercase">Personel Sayısı:</span>
                                    <p className="text-sm font-bold text-foreground">{job.staffCount}</p>
                                </div>
                            </div>

                            {/* Staff List */}
                            <div className="space-y-3 pt-4 border-t border-border">
                                <h4 className="text-sm font-bold text-foreground">Çalışan Personel:</h4>
                                <div className="bg-muted/30 rounded-lg border border-border overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-muted-foreground border-b border-border bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-2 font-medium text-xs">Personel Adı</th>
                                                <th className="px-4 py-2 font-medium text-xs">Rol</th>
                                                <th className="px-4 py-2 font-medium text-xs">Telefon</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {job.assignedStaff.map((staff: any, sIdx: number) => (
                                                <tr key={sIdx}>
                                                    <td className="px-4 py-2 font-bold text-foreground text-xs">{staff.name}</td>
                                                    <td className="px-4 py-2 text-muted-foreground text-xs">{staff.role}</td>
                                                    <td className="px-4 py-2 text-muted-foreground text-xs">{staff.phone}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    ))}

                </div>

            </div>
        </div>
    );
}
