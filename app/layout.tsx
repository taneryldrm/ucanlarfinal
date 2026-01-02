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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="tr">
            <body className={inter.className}>
                <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
                    {children}
                    <Toaster position="top-right" />
                </ThemeProvider>
            </body>
        </html>
    );
}
