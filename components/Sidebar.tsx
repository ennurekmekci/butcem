"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const pathname = usePathname();

  return (
    <aside
      className={`bg-white p-4 shadow-sm transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"
        }`}
    >
      <div className="flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-2xl font-bold text-slate-900">
            BütçeM
          </h1>
        )}

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="mt-8 space-y-3">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 ${pathname === "/dashboard"
            ? "bg-slate-200 font-medium text-slate-900"
            : "text-slate-700 hover:bg-slate-100"
            }`}
        >
          <span>🏠</span>
          {!isCollapsed && <span>Ana Sayfa</span>}
        </Link>

        <Link
          href="/transactions"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 ${pathname === "/transactions"
            ? "bg-slate-200 font-medium text-slate-900"
            : "text-slate-700 hover:bg-slate-100"
            }`}
        >
          <span>💳</span>
          {!isCollapsed && <span>İşlemler</span>}
        </Link>

        <Link
          href="/history"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 ${pathname === "/history"
            ? "bg-slate-200 font-medium text-slate-900"
            : "text-slate-700 hover:bg-slate-100"
            }`}
        >
          <span>🕘</span>
          {!isCollapsed && <span>Geçmiş</span>}
        </Link>

        <Link
          href="/categories"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 ${pathname === "/categories"
            ? "bg-slate-200 font-medium text-slate-900"
            : "text-slate-700 hover:bg-slate-100"
            }`}
        >
          <span>🏷️</span>
          {!isCollapsed && <span>Kategori Kuralları</span>}
        </Link>

        <Link
          href="/budgets"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 ${pathname === "/budgets"
            ? "bg-slate-200 font-medium text-slate-900"
            : "text-slate-700 hover:bg-slate-100"
            }`}
        >
          <span>🎯</span>
          {!isCollapsed && <span>Bütçeler</span>}
        </Link>

        <Link
          href="/goals"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 ${pathname === "/goals"
              ? "bg-slate-200 font-medium text-slate-900"
              : "text-slate-700 hover:bg-slate-100"
            }`}
        >
          <span>💰</span>
          {!isCollapsed && <span>Tasarruf Hedefleri</span>}
        </Link>

        <Link
          href="/account"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 ${pathname === "/account"
            ? "bg-slate-200 font-medium text-slate-900"
            : "text-slate-700 hover:bg-slate-100"
            }`}
        >
          <span>👤</span>
          {!isCollapsed && <span>Hesap</span>}
        </Link>
      </nav>
    </aside>
  );
}