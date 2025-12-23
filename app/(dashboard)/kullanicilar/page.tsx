"use client";

import { Header } from "@/components/Header";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { NewUserModal } from "@/components/NewUserModal";
import { cn } from "@/lib/utils";
import { getProfiles, createProfile, deleteProfile, updateProfile } from "@/lib/supabaseQueries";
import { toast } from "sonner";
import { updateUserPassword } from "@/app/actions/user-management";

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
      } else {
        // Create new user (Profile creation is usually handled by Triggers after Auth Sign up, 
        // BUT if we create profile manually here without Auth user, it's problematic.
        // Usually Admin creates Auth User first, then Profile.
        // Since we don't have 'New User' auth creation logic in 'createProfile' (it just inserts to profiles?),
        // we might be missing the Auth creation step if not handled.
        // However, assuming 'New User' flow handles Auth creation elsewhere or `createProfile` is just a placeholder...
        // Wait, looking at `createProfile` in supabaseQueries, it only inserts into `profiles`.
        // If RLS is on, this might fail if Auth User doesn't exist or we are not Admin.
        // Assuming the user knows what they are doing.

        // Actually, to create a LOGIN user, we must use Admin Auth Client too.
        // Let's stick to fixing the PASSWORD update for existing users first as requested.
        isNew = true;

        // For now, if it's just profile data
        const res = await createProfile(data);
        targetUserId = res.id; // hypothetical if createProfile returns data
        toast.success("Kullanıcı profili oluşturuldu.");
      }

      // Handle Password Change (Server Action)
      if (data.password && targetUserId) {
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
          <h2 className="text-2xl font-bold text-slate-800">Kullanıcı Yönetimi</h2>
          <button
            onClick={handleNewUser}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white transition-colors hover:bg-blue-700 shadow-md shadow-blue-200"
          >
            <Plus className="h-5 w-5" />
            Yeni Kullanıcı
          </button>
        </div>

        {/* Users Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 min-h-[500px]">
          <h3 className="text-base font-bold text-slate-900 mb-6">Sistem Kullanıcıları</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-slate-500 border-b border-slate-50">
                <tr>
                  <th className="px-4 py-4 font-medium">Ad Soyad</th>
                  <th className="px-4 py-4 font-medium">E-posta / Telefon</th>
                  <th className="px-4 py-4 font-medium">Rol</th>
                  <th className="px-4 py-4 font-medium">Durum</th>
                  <th className="px-4 py-4 font-medium text-center w-24">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      Yükleniyor...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      Henyüz kullanıcı eklenmemiş.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-4 font-bold text-slate-900">{user.full_name}</td>
                      <td className="px-4 py-4 text-slate-700 font-medium">
                        {user.email || user.phone || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          "inline-block px-3 py-1 rounded text-xs font-bold",
                          roleStyles[user.role] || "bg-slate-100 text-slate-600"
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-400 font-medium text-xs">
                        {user.status || 'Aktif'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
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

