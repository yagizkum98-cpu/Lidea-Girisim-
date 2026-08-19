"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "@/components/Header";
import { addAdminActivity, normalizeApplication, readApplications, writeApplications } from "@/lib/applications";

const programStorageKey = "lidea-program";

type ProgramSettings = {
  period: string;
  applicationOpen: boolean;
  applicationDeadline: string;
  requiredStages: string[];
};

const fallbackProgram: ProgramSettings = {
  period: "3. Dönem",
  applicationOpen: true,
  applicationDeadline: "",
  requiredStages: ["Fikir", "Prototip", "MVP", "İlk Müşteri", "Gelir Elde Ediyor"],
};

function readProgramSettings() {
  const saved = window.localStorage.getItem(programStorageKey);
  if (!saved) return fallbackProgram;

  try {
    return { ...fallbackProgram, ...(JSON.parse(saved) as ProgramSettings) };
  } catch {
    return fallbackProgram;
  }
}

export default function Apply() {
  const [sent, setSent] = useState(false);
  const [program, setProgram] = useState(fallbackProgram);

  useEffect(() => {
    const syncProgram = () => setProgram(readProgramSettings());
    syncProgram();
    window.addEventListener("storage", syncProgram);
    window.addEventListener("focus", syncProgram);
    window.addEventListener("lidea-program-updated", syncProgram);

    return () => {
      window.removeEventListener("storage", syncProgram);
      window.removeEventListener("focus", syncProgram);
      window.removeEventListener("lidea-program-updated", syncProgram);
    };
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!program.applicationOpen) return;

    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const applications = readApplications();
      const id = `LID-${Date.now().toString().slice(-6)}`;
      const application = normalizeApplication({
        id,
        applicationNumber: id,
        founder: String(data.name || ""),
        founderId: String(data.email || ""),
        email: String(data.email || ""),
        phone: String(data.phone || ""),
        startup: String(data.startup || ""),
        startupName: String(data.startup || ""),
        period: program.period,
        sector: String(data.sector || "Belirtilmedi"),
        city: String(data.city || ""),
        stage: String(data.stage || program.requiredStages[0] || "Fikir"),
        website: String(data.website || ""),
        teamSize: Number(data.teamSize || 1),
        score: 0,
        juryScore: 0,
        status: "Yeni",
        problem: String(data.problem || ""),
        solution: String(data.solution || ""),
        targetMarket: String(data.targetMarket || ""),
        businessModel: String(data.businessModel || ""),
        competitors: String(data.competitors || ""),
        differentiation: String(data.differentiation || ""),
        traction: String(data.traction || ""),
        futureGoals: String(data.futureGoals || ""),
        submittedAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString(),
      });

      writeApplications([application, ...applications]);
      addAdminActivity("Yeni başvuru alındı", application.startup);
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
        <h1 className="mt-8 text-5xl font-black">{program.period} Başvuru Formu</h1>
        <p className="mt-4 text-[#052f36]/65">
          Başvuru durumu ve kabul edilen girişim aşamaları admin panelindeki Program Yönetimi
          ayarlarına göre canlı güncellenir.
        </p>

        {!program.applicationOpen ? (
          <div className="mt-10 rounded-3xl border border-cyan-700/20 bg-white/80 p-8 shadow-[0_0_28px_rgba(23,230,210,.16)]">
            <b>Başvurular sona erdi.</b>
            <p className="mt-2 text-[#052f36]/65">
              {program.applicationDeadline
                ? `Son başvuru tarihi: ${program.applicationDeadline}`
                : "Yeni başvuru alımı şu anda kapalı."}
            </p>
          </div>
        ) : sent ? (
          <div className="mt-10 rounded-3xl border border-[#17e6d2]/30 bg-[#eafff8]/80 p-8 shadow-[0_0_28px_rgba(23,230,210,.22)]">
            <b>Başvuru alındı.</b>
            <p className="mt-2">Başvurunuz admin panelindeki canlı başvuru listesine iletildi.</p>
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
              ["website", "Web Sitesi"],
            ].map(([name, label]) => (
              <label className="font-bold" key={name}>
                {label}
                <input
                  name={name}
                  required
                  className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8] focus:shadow-[0_0_24px_rgba(23,230,210,.28)]"
                />
              </label>
            ))}
            <label className="font-bold">
              Girişim Aşaması
              <select
                name="stage"
                className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8]"
              >
                {program.requiredStages.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
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
            {[
              ["targetMarket", "Hedef Kitle"],
              ["businessModel", "İş Modeli"],
              ["competitors", "Rakipler"],
              ["differentiation", "Farklılaşma"],
              ["traction", "Mevcut Traction"],
              ["futureGoals", "Gelecek Hedefleri"],
            ].map(([name, label]) => (
              <label className="font-bold" key={name}>
                {label}
                <textarea
                  name={name}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8] focus:shadow-[0_0_24px_rgba(23,230,210,.28)]"
                />
              </label>
            ))}
            <button className="mt-3 rounded-full bg-[#063f46] p-4 font-bold text-white shadow-[0_0_26px_rgba(23,230,210,.45)]">
              Başvuruyu Tamamla →
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
