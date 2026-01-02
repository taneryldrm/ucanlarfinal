"use client";

import { Moon, Sun, Palette } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
            <button
                onClick={() => setTheme("light")}
                className={cn(
                    "rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground",
                    theme === "light"
                        ? "bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-blue-400"
                        : "text-muted-foreground"
                )}
                title="Aydınlık Tema"
            >
                <Sun className="h-4 w-4" />
                <span className="sr-only">Aydınlık</span>
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={cn(
                    "rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground",
                    theme === "dark"
                        ? "bg-slate-700 text-slate-100"
                        : "text-muted-foreground"
                )}
                title="Karanlık Tema"
            >
                <Moon className="h-4 w-4" />
                <span className="sr-only">Karanlık</span>
            </button>
            <button
                onClick={() => setTheme("purple")}
                className={cn(
                    "rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground",
                    theme === "purple"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-muted-foreground"
                )}
                title="Mor Tema"
            >
                <Palette className="h-4 w-4" />
                <span className="sr-only">Mor</span>
            </button>
        </div>
    );
}
