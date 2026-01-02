import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const supabase = createClient();

    // Server-Side Auth Check (Redundancy for Middleware)
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900">
            <div className="hidden md:flex h-full">
                <Sidebar />
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto bg-slate-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
