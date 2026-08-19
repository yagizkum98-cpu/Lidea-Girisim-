"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type ProgramStatus =
  | "Taslak"
  | "Başvurular Açık"
  | "Başvurular Kapandı"
  | "Değerlendirme"
  | "Program Aktif"
  | "Tamamlandı";

type Program = {
  id: string;
  name: string;
  period: string;
  description: string;
  quota: number;
  status: ProgramStatus;
  applicationOpen: boolean;
  applicationStart: string;
  applicationDeadline: string;
  programStart: string;
  programEnd: string;
  createdAt: string;
  applicationLimit: string;
  requiredStages: string[];
  pitchDeckRequired: boolean;
  kvkkRequired: boolean;
};

type ProgramStage = {
  id: string;
  programId: string;
  title: string;
  order: number;
  startDate: string;
  endDate: string;
  active: boolean;
  description: string;
};

const programStorageKey = "lidea-program";
const stagesStorageKey = "lidea-program-stages";
const adminSessionKey = "lidea-admin-session";
const usersStorageKey = "lidea-admin-users";

const statusOptions: ProgramStatus[] = [
  "Taslak",
  "Başvurular Açık",
  "Başvurular Kapandı",
  "Değerlendirme",
  "Program Aktif",
  "Tamamlandı",
];

const startupStages = ["Fikir", "Prototip", "MVP", "İlk Müşteri", "Gelir Elde Ediyor"];

const defaultProgram: Program = {
  id: "program-3",
  name: "Lidea Girişim Programı",
  period: "3. Dönem",
  description: "",
  quota: 40,
  status: "Başvurular Açık",
  applicationOpen: true,
  applicationStart: "",
  applicationDeadline: "",
  programStart: "",
  programEnd: "",
  createdAt: new Date().toISOString(),
  applicationLimit: "Sınırsız",
  requiredStages: startupStages,
  pitchDeckRequired: false,
  kvkkRequired: true,
};

const defaultStages: ProgramStage[] = [
  "Başvuru",
  "Ön Değerlendirme",
  "Jüri Değerlendirmesi",
  "Programa Kabul",
  "Eğitim",
  "Mentorluk",
  "MVP Geliştirme",
  "Demo Day",
].map((title, index) => ({
  id: `stage-${index + 1}`,
  programId: "program-3",
  title,
  order: index + 1,
  startDate: "",
  endDate: "",
  active: true,
  description: "",
}));

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600";

const labelClass = "grid gap-2 text-sm font-bold text-slate-700";

function readProgram() {
  if (typeof window === "undefined") return defaultProgram;
  const saved = window.localStorage.getItem(programStorageKey);
  if (!saved) {
    window.localStorage.setItem(programStorageKey, JSON.stringify(defaultProgram));
    return defaultProgram;
  }

  try {
    return { ...defaultProgram, ...(JSON.parse(saved) as Program) };
  } catch {
    window.localStorage.setItem(programStorageKey, JSON.stringify(defaultProgram));
    return defaultProgram;
  }
}

function readStages() {
  if (typeof window === "undefined") return defaultStages;
  const saved = window.localStorage.getItem(stagesStorageKey);
  if (!saved) {
    window.localStorage.setItem(stagesStorageKey, JSON.stringify(defaultStages));
    return defaultStages;
  }

  try {
    return JSON.parse(saved) as ProgramStage[];
  } catch {
    window.localStorage.setItem(stagesStorageKey, JSON.stringify(defaultStages));
    return defaultStages;
  }
}

function hasAdminSession() {
  if (typeof window === "undefined") return false;
  const sessionEmail = window.localStorage.getItem(adminSessionKey);
  const users = window.localStorage.getItem(usersStorageKey);
  if (!sessionEmail) return false;
  if (!users) return sessionEmail === "admin@lideagirisim.com";

  try {
    return (JSON.parse(users) as { email: string; role: string }[]).some(
      (user) =>
        user.email === sessionEmail &&
        ["Süper Admin", "Admin", "Program Yetkilisi"].includes(user.role),
    );
  } catch {
    return false;
  }
}

export default function ProgramManagementPage() {
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState("Genel");
  const [program, setProgram] = useState(defaultProgram);
  const [stages, setStages] = useState(defaultStages);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setAuthorized(hasAdminSession());
    setProgram(readProgram());
    setStages(readStages());
  }, []);

  function saveProgram(nextProgram: Program, message = "Program bilgileri kaydedildi.") {
    setProgram(nextProgram);
    window.localStorage.setItem(programStorageKey, JSON.stringify(nextProgram));
    window.dispatchEvent(new Event("lidea-program-updated"));
    setNotice(message);
  }

  function saveStages(nextStages: ProgramStage[], message = "Program aşamaları kaydedildi.") {
    const ordered = nextStages
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((stage, index) => ({ ...stage, order: index + 1 }));
    setStages(ordered);
    window.localStorage.setItem(stagesStorageKey, JSON.stringify(ordered));
    window.dispatchEvent(new Event("lidea-program-updated"));
    setNotice(message);
  }

  function saveGeneral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const status = String(form.get("status")) as ProgramStatus;
    saveProgram({
      ...program,
      name: String(form.get("name") || ""),
      period: String(form.get("period") || ""),
      description: String(form.get("description") || ""),
      quota: Number(form.get("quota") || 0),
      programStart: String(form.get("programStart") || ""),
      programEnd: String(form.get("programEnd") || ""),
      status,
      applicationOpen: status === "Başvurular Açık" ? true : program.applicationOpen,
    });
  }

  function saveApplicationSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const applicationOpen = form.get("applicationOpen") === "open";
    const requiredStages = startupStages.filter((stage) => form.get(stage) === "on");

    saveProgram(
      {
        ...program,
        applicationOpen,
        status: applicationOpen ? "Başvurular Açık" : "Başvurular Kapandı",
        applicationDeadline: String(form.get("applicationDeadline") || ""),
        applicationLimit: String(form.get("applicationLimit") || "Sınırsız"),
        requiredStages,
        pitchDeckRequired: form.get("pitchDeckRequired") === "yes",
        kvkkRequired: true,
      },
      "Başvuru ayarları kaydedildi.",
    );
  }

  function updateStage(id: string, patch: Partial<ProgramStage>) {
    setStages((items) => items.map((stage) => (stage.id === id ? { ...stage, ...patch } : stage)));
  }

  function addStage() {
    saveStages([
      ...stages,
      {
        id: crypto.randomUUID(),
        programId: program.id,
        title: "Yeni Aşama",
        order: stages.length + 1,
        startDate: "",
        endDate: "",
        active: true,
        description: "",
      },
    ]);
  }

  function moveStage(id: string, direction: -1 | 1) {
    const index = stages.findIndex((stage) => stage.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= stages.length) return;

    const nextStages = stages.slice();
    [nextStages[index], nextStages[targetIndex]] = [nextStages[targetIndex], nextStages[index]];
    saveStages(nextStages);
  }

  const activeStageCount = useMemo(
    () => stages.filter((stage) => stage.active).length,
    [stages],
  );

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#f6fbfc] px-6 py-10 text-slate-950">
        <section className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <img src="/lidea-logo.svg" alt="Lidea" className="h-14 w-auto" />
          <h1 className="mt-8 text-3xl font-black">Program Yönetimi</h1>
          <p className="mt-3 text-slate-500">
            Bu ekranı kullanmak için önce admin paneline süper admin, admin veya program yetkilisi
            hesabıyla giriş yapın.
          </p>
          <Link
            href="/admin"
            className="mt-6 inline-flex h-11 items-center rounded-md bg-[#063f46] px-5 text-sm font-bold text-white"
          >
            Admin Girişine Git
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6fbfc] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-5">
            <p className="text-lg font-black tracking-tight">LIDEA ADMIN</p>
          </div>
          <nav className="grid gap-1 p-3">
            {[
              ["Dashboard", "/admin"],
              ["Başvurular", "/admin/basvurular"],
              ["Girişimler", "/admin/girisimler"],
              ["Jüri", "/juri"],
              ["Değerlendiriciler", "/admin/degerlendiriciler"],
              ["Mentorlar", "/admin/mentorlar"],
              ["Program", "/admin/program"],
              ["Bildirimler", "/admin/bildirimler"],
              ["Raporlar", "/admin"],
              ["Ayarlar", "/admin"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className={`rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                  label === "Program"
                    ? "bg-[#063f46] text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {label === "Program" ? "●" : label === "Ayarlar" ? "⚙" : "▣"} {label}
              </Link>
            ))}
          </nav>
        </aside>

        <section>
          <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">
                PROGRAM YÖNETİMİ
              </p>
              <h1 className="mt-1 text-2xl font-black">
                {program.name} / {program.period}
              </h1>
            </div>
            <div className="rounded-md border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-900">
              Durum: {program.applicationOpen ? "● Başvurular Açık" : "○ Başvurular Kapalı"}
            </div>
          </header>

          <div className="space-y-6 p-6">
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <h2 className="text-3xl font-black">{program.name}</h2>
                  <p className="mt-2 text-lg font-bold text-slate-500">{program.period}</p>
                  <p className="mt-4 text-sm font-bold text-cyan-800">Durum: {program.status}</p>
                </div>
                <button
                  onClick={() => setTab("Genel")}
                  className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white"
                >
                  Düzenle
                </button>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                {[
                  ["Kontenjan", `${program.quota} Girişim`],
                  ["Aktif Aşama", String(activeStageCount)],
                  ["Son Başvuru", program.applicationDeadline || "Tarih girilmedi"],
                  ["Demo Day", stages.find((stage) => stage.title === "Demo Day")?.startDate || "Tarih belirlenmedi"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-black">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
              {["Genel", "Takvim", "Başvuru Ayarları", "Aşamalar"].map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`h-10 rounded-md px-4 text-sm font-black ${
                    tab === item ? "bg-[#063f46] text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {notice ? (
              <p className="rounded-md border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">
                {notice}
              </p>
            ) : null}

            {tab === "Genel" ? (
              <form
                onSubmit={saveGeneral}
                className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6"
              >
                <h2 className="text-xl font-black">Program Bilgileri</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className={labelClass}>
                    Program Adı
                    <input name="name" defaultValue={program.name} className={inputClass} />
                  </label>
                  <label className={labelClass}>
                    Dönem
                    <input name="period" defaultValue={program.period} className={inputClass} />
                  </label>
                  <label className={labelClass}>
                    Kontenjan
                    <input
                      name="quota"
                      type="number"
                      min="1"
                      defaultValue={program.quota}
                      className={inputClass}
                    />
                  </label>
                  <label className={labelClass}>
                    Program Durumu
                    <select name="status" defaultValue={program.status} className={inputClass}>
                      {statusOptions.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    Başlangıç Tarihi
                    <input
                      name="programStart"
                      type="date"
                      defaultValue={program.programStart}
                      className={inputClass}
                    />
                  </label>
                  <label className={labelClass}>
                    Bitiş Tarihi
                    <input
                      name="programEnd"
                      type="date"
                      defaultValue={program.programEnd}
                      className={inputClass}
                    />
                  </label>
                </div>
                <label className={labelClass}>
                  Kısa Açıklama
                  <textarea
                    name="description"
                    defaultValue={program.description}
                    rows={4}
                    className="rounded-md border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-600"
                  />
                </label>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setProgram(readProgram())} className="h-11 rounded-md border border-slate-200 px-5 text-sm font-bold">
                    İptal
                  </button>
                  <button className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">
                    Değişiklikleri Kaydet
                  </button>
                </div>
              </form>
            ) : null}

            {tab === "Takvim" ? (
              <section className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-xl font-black">Program Takvimi</h2>
                  <button
                    onClick={() => saveStages(stages, "Takvim kaydedildi.")}
                    className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white"
                  >
                    Takvimi Kaydet
                  </button>
                </div>
                <div className="mt-6 grid gap-4">
                  {stages.map((stage, index) => (
                    <div
                      key={stage.id}
                      className="grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 md:grid-cols-[40px_1fr_170px_170px]"
                    >
                      <span className="text-xl font-black text-cyan-800">
                        {index === 0 ? "✓" : stage.active ? "●" : "○"}
                      </span>
                      <input
                        value={stage.title}
                        onChange={(event) => updateStage(stage.id, { title: event.target.value })}
                        className={inputClass}
                      />
                      <input
                        type="date"
                        value={stage.startDate}
                        onChange={(event) =>
                          updateStage(stage.id, { startDate: event.target.value })
                        }
                        className={inputClass}
                      />
                      <input
                        type="date"
                        value={stage.endDate}
                        onChange={(event) => updateStage(stage.id, { endDate: event.target.value })}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={addStage}
                  className="mt-5 h-11 rounded-md border border-slate-200 bg-white px-5 text-sm font-black"
                >
                  + Aşama Ekle
                </button>
              </section>
            ) : null}

            {tab === "Başvuru Ayarları" ? (
              <form
                onSubmit={saveApplicationSettings}
                className="grid gap-6 rounded-lg border border-slate-200 bg-white p-6"
              >
                <h2 className="text-xl font-black">Başvuru Ayarları</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
                    <p className="text-sm font-black">Başvuru Durumu</p>
                    <label className="mt-4 flex items-center gap-3 text-sm font-semibold">
                      <input
                        type="radio"
                        name="applicationOpen"
                        value="open"
                        defaultChecked={program.applicationOpen}
                      />
                      Başvurular Açık
                    </label>
                    <label className="mt-3 flex items-center gap-3 text-sm font-semibold">
                      <input
                        type="radio"
                        name="applicationOpen"
                        value="closed"
                        defaultChecked={!program.applicationOpen}
                      />
                      Başvurular Kapalı
                    </label>
                  </div>
                  <label className={labelClass}>
                    Son Başvuru
                    <input
                      name="applicationDeadline"
                      type="datetime-local"
                      defaultValue={program.applicationDeadline}
                      className={inputClass}
                    />
                  </label>
                  <label className={labelClass}>
                    Başvuru Limiti
                    <select
                      name="applicationLimit"
                      defaultValue={program.applicationLimit}
                      className={inputClass}
                    >
                      <option>Sınırsız</option>
                      <option>100</option>
                      <option>250</option>
                      <option>500</option>
                    </select>
                  </label>
                  <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
                    <p className="text-sm font-black">Zorunlu Pitch Deck</p>
                    <label className="mt-4 flex items-center gap-3 text-sm font-semibold">
                      <input
                        type="radio"
                        name="pitchDeckRequired"
                        value="yes"
                        defaultChecked={program.pitchDeckRequired}
                      />
                      Evet
                    </label>
                    <label className="mt-3 flex items-center gap-3 text-sm font-semibold">
                      <input
                        type="radio"
                        name="pitchDeckRequired"
                        value="no"
                        defaultChecked={!program.pitchDeckRequired}
                      />
                      Hayır
                    </label>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black">Başvurabilecek Aşamalar</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-5">
                    {startupStages.map((stage) => (
                      <label key={stage} className="flex items-center gap-2 text-sm font-semibold">
                        <input
                          name={stage}
                          type="checkbox"
                          defaultChecked={program.requiredStages.includes(stage)}
                        />
                        {stage}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-black">KVKK Onayı</p>
                  <p className="mt-2 text-sm text-slate-500">Zorunlu</p>
                </div>
                <button className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white md:w-fit">
                  Ayarları Kaydet
                </button>
              </form>
            ) : null}

            {tab === "Aşamalar" ? (
              <section className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-xl font-black">Program Aşamaları</h2>
                  <button
                    onClick={() => saveStages(stages)}
                    className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white"
                  >
                    Aşamaları Kaydet
                  </button>
                </div>
                <div className="mt-6 grid gap-3">
                  {stages.map((stage, index) => (
                    <div
                      key={stage.id}
                      className="grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 md:grid-cols-[48px_1fr_120px_88px]"
                    >
                      <p className="text-lg font-black text-cyan-800">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <input
                        value={stage.title}
                        onChange={(event) => updateStage(stage.id, { title: event.target.value })}
                        className={inputClass}
                      />
                      <label className="flex items-center gap-2 text-sm font-bold">
                        <input
                          type="checkbox"
                          checked={stage.active}
                          onChange={(event) =>
                            updateStage(stage.id, { active: event.target.checked })
                          }
                        />
                        Aktif
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => moveStage(stage.id, -1)}
                          className="h-10 w-10 rounded-md border border-slate-200 bg-white font-black"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStage(stage.id, 1)}
                          className="h-10 w-10 rounded-md border border-slate-200 bg-white font-black"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addStage}
                  className="mt-5 h-11 rounded-md border border-slate-200 bg-white px-5 text-sm font-black"
                >
                  + Yeni Aşama Ekle
                </button>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
