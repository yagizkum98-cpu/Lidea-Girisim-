"use client";

import { FormEvent, useState } from "react";
import Header from "@/components/Header";

const applicationsStorageKey = "lidea-applications";

type StoredApplication = {
  id: string;
  founder: string;
  email: string;
  startup: string;
  period: string;
  sector: string;
  city: string;
  stage: string;
  teamSize: number;
  score: number;
  status: "Yeni";
  submittedAt: string;
};

function readApplications() {
  const saved = window.localStorage.getItem(applicationsStorageKey);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as StoredApplication[];
  } catch {
    return [];
  }
}

export default function Apply() {
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());
    const r = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (r.ok) {
      const applications = readApplications();
      const application: StoredApplication = {
        id: `LID-${Date.now().toString().slice(-6)}`,
        founder: String(data.name || ""),
        email: String(data.email || ""),
        startup: String(data.startup || ""),
        period: "3. Dönem",
        sector: String(data.sector || "Belirtilmedi"),
        city: String(data.city || ""),
        stage: String(data.stage || "Fikir"),
        teamSize: Number(data.teamSize || 1),
        score: 0,
        status: "Yeni",
        submittedAt: new Date().toISOString().slice(0, 10),
      };

      window.localStorage.setItem(
        applicationsStorageKey,
        JSON.stringify([application, ...applications]),
      );
      window.dispatchEvent(new Event("lidea-applications-updated"));
      setSent(true);
    }
  }

  return (
    <main>
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-20">
        <img
          src="/lidea-logo.svg"
          alt="Lidea Yalın Idea Girişim Programı"
          className="h-auto w-64 max-w-full"
        />
        <h1 className="mt-8 text-5xl font-black">3. Dönem Başvuru Formu</h1>
        <p className="mt-4 text-[#052f36]/65">
          Bu MVP formu demo amaçlıdır. API doğrulaması çalışır; kalıcı veritabanı
          sonraki fazda bağlanabilir.
        </p>
        {sent ? (
          <div className="mt-10 rounded-3xl border border-[#17e6d2]/30 bg-[#eafff8]/80 p-8 shadow-[0_0_28px_rgba(23,230,210,.22)]">
            <b>Başvuru alındı.</b>
            <p className="mt-2">Demo API isteği başarıyla tamamlandı.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10 grid gap-5">
            {[
              ["name", "Ad Soyad"],
              ["email", "E-posta"],
              ["phone", "Telefon"],
              ["startup", "Girişim Adı"],
              ["sector", "Sektör"],
              ["city", "Şehir"],
            ].map(([n, l]) => (
              <label className="font-bold" key={n}>
                {l}
                <input
                  name={n}
                  required
                  className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8] focus:shadow-[0_0_24px_rgba(23,230,210,.28)]"
                />
              </label>
            ))}
            <label className="font-bold">
              Girişim Aşaması
              <select name="stage" className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8]">
                <option>Fikir</option>
                <option>Prototip</option>
                <option>MVP</option>
                <option>İlk müşteriler</option>
                <option>Gelir elde ediyor</option>
              </select>
            </label>
            <label className="font-bold">
              Ekip Büyüklüğü
              <input
                name="teamSize"
                type="number"
                min="1"
                defaultValue="1"
                required
                className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8] focus:shadow-[0_0_24px_rgba(23,230,210,.28)]"
              />
            </label>
            <label className="font-bold">
              Hangi problemi çözüyorsunuz?
              <textarea
                name="problem"
                required
                rows={4}
                className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8] focus:shadow-[0_0_24px_rgba(23,230,210,.28)]"
              />
            </label>
            <label className="font-bold">
              Çözümünüz nedir?
              <textarea
                name="solution"
                required
                rows={4}
                className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8] focus:shadow-[0_0_24px_rgba(23,230,210,.28)]"
              />
            </label>
            <button className="mt-3 rounded-full bg-[#063f46] p-4 font-bold text-white shadow-[0_0_26px_rgba(23,230,210,.45)]">
              Başvuruyu Tamamla →
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
