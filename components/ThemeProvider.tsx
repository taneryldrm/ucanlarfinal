"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "default" | "purple";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>("default");
    const [mounted, setMounted] = useState(false);

    // Load theme from localStorage on mount
    useEffect(() => {
        setMounted(true);
        try {
            const savedTheme = localStorage.getItem("ucanlar-theme") as Theme;
            if (savedTheme && (savedTheme === "default" || savedTheme === "purple")) {
                setTheme(savedTheme);
            }
        } catch (e) {
            // localStorage not available
        }
    }, []);

    // Apply theme class to html element
    useEffect(() => {
        if (!mounted) return;

        try {
            const html = document.documentElement;

            // Remove existing theme classes
            html.classList.remove("purple");

            // Add new theme class if purple
            if (theme === "purple") {
                html.classList.add("purple");
            }

            // Save to localStorage
            localStorage.setItem("ucanlar-theme", theme);
        } catch (e) {
            // localStorage not available
        }
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme(prev => prev === "default" ? "purple" : "default");
    };

    // Always provide context, even before mounted
    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        // Return default values instead of throwing error
        return {
            theme: "default" as Theme,
            setTheme: () => { },
            toggleTheme: () => { }
        };
    }
    return context;
}
