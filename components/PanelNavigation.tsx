"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PanelNavigation({ allPanels, name }: { allPanels: boolean; name: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function logout() {
    setBusy(true);
    try {
      const response = await fetch("/api/auth/entrepreneur", { method: "DELETE" });
      if (response.ok) { localStorage.removeItem("lidea-admin-session"); router.replace("/giris"); router.refresh(); }
    } finally { setBusy(false); }
  }
  return <nav aria-label="Panel erişimi" className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700">
    <Link href="/">Lidea</Link>
    {allPanels && <Link href="/admin">Admin Paneli</Link>}
    <Link href="/girisimci">Girişimci Paneli</Link>
    {allPanels && <Link href="/lideacheck">Lidea Check</Link>}
    <span className="ml-auto">{name}</span>
    <button disabled={busy} onClick={logout} className="px-2 py-1 text-red-700 disabled:opacity-50">{busy ? "Çıkılıyor..." : "Çıkış Yap"}</button>
  </nav>;
}
