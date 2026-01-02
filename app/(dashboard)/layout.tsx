import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex h-screen bg-muted/40 text-foreground">
            <div className="hidden md:flex h-full border-r border-border bg-card">
                <Sidebar />
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
