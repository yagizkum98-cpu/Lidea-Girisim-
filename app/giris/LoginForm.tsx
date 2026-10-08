"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginForm({ target }: { target: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const [error, setError] = useState("");
  const panel = target.split(/[/?]/)[1];
  const title = panel === "admin" ? "Admin Paneli" : panel === "lideacheck" ? "Lidea Check" : "Girişimci Paneli";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const response = await fetch(panel === "girisimci" ? "/api/auth/entrepreneur" : "/api/auth/admin", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Giriş yapılamadı."); return; }
      router.replace(target); router.refresh();
    } catch { setError("Bağlantı kurulamadı. Tekrar deneyin."); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#f6fbfc] px-5 py-12 text-slate-950">
    <div className="w-full max-w-sm">
      <Link href="/"><Image src="/lidea-logo.svg" width={160} height={48} alt="Lidea" className="mb-10 h-12 w-auto" priority /></Link>
      <h1 className="text-2xl font-bold">{title}</h1>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <div><label htmlFor="email" className="mb-2 block text-sm font-semibold">E-posta</label><input id="email" name="email" type="email" autoComplete="username" required className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 outline-none focus:border-cyan-700" /></div>
        <div><label htmlFor="password" className="mb-2 block text-sm font-semibold">Şifre</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={72} className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 outline-none focus:border-cyan-700" /></div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="h-12 w-full rounded-md bg-[#063f46] font-semibold text-white disabled:opacity-60">{busy ? "Giriş yapılıyor..." : "Giriş Yap"}</button>
      </form>
    </div>
  </main>;
}
