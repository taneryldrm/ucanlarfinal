"use client";

import { useEffect } from "react";

export default function Error({
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
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-xl font-bold text-slate-800">Bir şeyler ters gitti!</h2>
            <p className="text-slate-500">{error.message}</p>
            <button
                onClick={() => reset()}
                className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
            >
                Tekrar Dene
            </button>
        </div>
    );
}
