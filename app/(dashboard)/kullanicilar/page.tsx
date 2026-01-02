"use client";

import { Header } from "@/components/Header";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { NewUserModal } from "@/components/NewUserModal";
import { cn } from "@/lib/utils";
import { getProfiles, createProfile, deleteProfile, updateProfile } from "@/lib/supabaseQueries";
import { toast } from "sonner";
import { updateUserPassword, createUser } from "@/app/actions/user-management";


const roleStyles: Record<string, string> = {
  "Yönetici": "bg-blue-600 text-white",
  "Saha Sorumlusu": "bg-slate-200 text-slate-800",
  "Şoför": "bg-slate-100 text-slate-600",
  "Sekreter": "bg-slate-100 text-slate-600",
  "Veri Girici": "bg-slate-100 text-slate-600"
};

export default function KullanicilarPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getProfiles();
      setUsers(data || []);
    } catch (error) {
      toast.error("Kullanıcılar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



  const handleUserSave = async (data: any) => {
    console.log("handleUserSave called with:", data);
    try {
      let isNew = false;
      let targetUserId = data.id;

      if (data.id) {
        // Update existing user profile
        console.log("Updating user:", data.id);
        await updateProfile(data.id, data);
        toast.success("Profil bilgileri güncellendi.");
        targetUserId = data.id;
      } else {
        // Create new user (Auth + Profile) using Server Action
        const result = await createUser(data);
        if (!result.success) {
          throw new Error(result.message);
        }
        toast.success("Kullanıcı başarıyla oluşturuldu.");
        // Password set during creation, so no need to call updatePassword again
        isNew = true;
      }

      // Handle Password Change (Server Action) - Only for updates
      if (data.password && targetUserId && !isNew) {
        const result = await updateUserPassword(targetUserId, data.password);
        if (result.success) {
          toast.success("Şifre güncellendi.");
        } else {
          toast.error("Şifre güncellenemedi: " + result.message);
        }
      }

      await fetchData(); // Wait for data refresh
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("handleUserSave error:", error);
      toast.error("İşlem başarısız: " + (error as any)?.message || "Bilinmeyen hata");
      // throw error; // Don't throw, just show error
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleNewUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;
    try {
      await deleteProfile(id);
      toast.success("Kullanıcı silindi.");
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) {
      toast.error("Silme işlemi başarısız.");
    }
  };

  return (
    <>
      <Header title="Kullanıcılar" />
      <div className="p-8 space-y-6">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Kullanıcı Yönetimi</h2>
          <button
            onClick={handleNewUser}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-bold text-primary-foreground transition-colors hover:bg-primary/90 shadow-md shadow-primary/20 dark:shadow-none"
          >
            <Plus className="h-5 w-5" />
            Yeni Kullanıcı
          </button>
        </div>

        {/* Users Table */}
        <div className="rounded-xl border border-border bg-card shadow-sm p-6 min-h-[500px]">
          <h3 className="text-base font-bold text-foreground mb-6">Sistem Kullanıcıları</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-4 font-medium">Ad Soyad</th>
                  <th className="px-4 py-4 font-medium">E-posta / Telefon</th>
                  <th className="px-4 py-4 font-medium">Rol</th>
                  <th className="px-4 py-4 font-medium">Durum</th>
                  <th className="px-4 py-4 font-medium text-center w-24">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      Yükleniyor...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      Henyüz kullanıcı eklenmemiş.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-4 font-bold text-foreground">{user.full_name}</td>
                      <td className="px-4 py-4 text-foreground font-medium">
                        {user.email || user.phone || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          "inline-block px-3 py-1 rounded text-xs font-bold",
                          roleStyles[user.role] || "bg-muted text-muted-foreground"
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground font-medium text-xs">
                        {user.status || 'Aktif'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/10 text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      <NewUserModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedUser(null); }}
        onSave={handleUserSave}
        user={selectedUser}
      />
    </>
  );
}

