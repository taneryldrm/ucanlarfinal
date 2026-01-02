"use client";

import { Header } from "@/components/Header";
import { MessageSquare, Calendar, Trash2, ArrowRight, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getCrmWhatsapp, deleteCrmWhatsapp } from "@/lib/supabaseQueries";
import { NewJobModal } from "@/components/NewJobModal";
import { toast } from "sonner";

export default function AIRandevuPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function fetchMessages() {
    try {
      setLoading(true);
      const data = await getCrmWhatsapp();
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Bu mesajı silmek istediğinize emin misiniz?")) return;
    try {
      await deleteCrmWhatsapp(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      toast.success("Mesaj silindi.");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Silme işlemi başarısız.");
    }
  };

  const handleCreateJob = (message: any) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
  };

  return (
    <>
      <Header title="AI Randevu" />
      <div className="p-8 space-y-6">

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">AI Randevu Talepleri</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            WhatsApp Entegrasyonu Aktif
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="text-center p-12 text-slate-500">Yükleniyor...</div>
          ) : messages.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-12 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Henüz yeni talep yok</h3>
              <p className="text-sm text-slate-500 font-medium">WhatsApp hattından gelen randevu talepleri burada listelenecektir.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

                  {/* Icon & Content */}
                  <div className="flex gap-4 flex-1">
                    <div className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div className="space-y-3 w-full">
                      <div className="flex items-center justify-between md:justify-start gap-3">
                        <h3 className="font-bold text-slate-900 text-lg">{msg.sender_name || msg.phone_number || "Bilinmeyen Numara"}</h3>
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
                          {msg.created_at ? new Date(msg.created_at).toLocaleString('tr-TR') : 'Tarih Yok'}
                        </span>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-4 text-slate-700 text-sm leading-relaxed border border-slate-100">
                        "{msg.message_content || msg.raw_message}"
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {msg.phone_number && (
                          <span className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded">
                            📱 {msg.phone_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                    <button
                      onClick={() => handleCreateJob(msg)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 shadow-sm whitespace-nowrap"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      İş Emri Oluştur
                    </button>
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 hover:border-red-300 whitespace-nowrap"
                    >
                      <Trash2 className="h-4 w-4" />
                      Sil
                    </button>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Modal - Passes pre-filled data */}
      <NewJobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedMessage ? {
          customer: selectedMessage.sender_name || selectedMessage.phone_number,
          description: selectedMessage.message_content || selectedMessage.raw_message,
          // We could try to parse date from message, but let's default to today or let user pick
          date: new Date().toLocaleDateString('tr-TR'),
          address: "", // CRM might not retrieve address parsed yet
          amount: "0"
        } : undefined}
      />
    </>
  );
}
