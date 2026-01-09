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
        <div className="flex h-screen bg-background text-foreground transition-colors duration-300">
            <div className="hidden md:flex h-full">
                <Sidebar />
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto bg-background transition-colors duration-300">
                    {children}
                </main>
            </div>
        </div>
    );
}
