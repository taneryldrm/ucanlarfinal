"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
                    <h2 className="text-2xl font-bold">Bir şeyler yanlış gitti!</h2>
                    <p className="text-slate-600">{error.message}</p>
                    <button
                        onClick={() => reset()}
                        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                        Tekrar Dene
                    </button>
                </div>
            </body>
        </html>
    );
}
