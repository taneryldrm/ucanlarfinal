import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Uçanlar Temizlik Yönetim Paneli",
    description: "Uçanlar Temizlik Hizmetleri Yönetim Sistemi",
};

import { ThemeProvider } from "@/components/theme-provider";
import AuthProvider from "@/components/AuthProvider";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="tr">
            <body className={inter.className}>
                <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
                    <AuthProvider>
                        {children}
                        {/* Toaster is included in AuthProvider or can be here. 
                            AuthProvider in my previous step has <Toaster /> inside it.
                            So I should remove the Toaster here to avoid validation errors or duplicates?
                            Actually, my AuthProvider code HAS Toaster. 
                            So I will remove it from here. 
                        */}
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
