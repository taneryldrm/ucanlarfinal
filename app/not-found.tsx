import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-4xl font-bold text-slate-800">404</h2>
            <p className="text-lg text-slate-600">Sayfa bulunamadı</p>
            <Link
                href="/"
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
                Ana Sayfaya Dön
            </Link>
        </div>
    );
}
