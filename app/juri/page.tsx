"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { readApplications } from "@/lib/applications";

type UserRole =
  | "Süper Admin"
  | "Admin"
  | "Program Yetkilisi"
  | "Değerlendirme Yetkilisi"
  | "Jüri"
  | "Mentor"
  | "Girişimci";

type PortalUser = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

type Venture = {
  id: string;
  name: string;
  sector: string;
  city: string;
  stage: string;
  assignedTo: string[];
  scores: Record<Criterion, number>;
  comment: string;
  recommendation: Recommendation;
};

type Criterion =
  | "Problem"
  | "Çözüm"
  | "Yenilikçilik"
  | "Pazar Potansiyeli"
  | "Ölçeklenebilirlik"
  | "Ekip";

type Recommendation = "Kabul Öner" | "Yedek Öner" | "Ret Öner" | "";

const usersStorageKey = "lidea-admin-users";
const jurySessionKey = "lidea-jury-session";
const evaluationsStorageKey = "lidea-jury-evaluations";

const allowedRoles: UserRole[] = [
  "Süper Admin",
  "Admin",
  "Program Yetkilisi",
  "Değerlendirme Yetkilisi",
  "Jüri",
  "Mentor",
];

const fallbackUsers: PortalUser[] = [
  {
    name: "Süper Admin",
    email: "admin@lideagirisim.com",
    password: "lideagirisimsuperadmin123",
    role: "Süper Admin",
  },
];

const criteria: Criterion[] = [
  "Problem",
  "Çözüm",
  "Yenilikçilik",
  "Pazar Potansiyeli",
  "Ölçeklenebilirlik",
  "Ekip",
];

const seedVentures: Venture[] = [];
const demoEvaluationIds = new Set(["EVL-001", "EVL-002", "EVL-003"]);

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600";

function getUsers() {
  if (typeof window === "undefined") return fallbackUsers;
  const raw = window.localStorage.getItem(usersStorageKey);
  if (!raw) return fallbackUsers;

  try {
    return JSON.parse(raw) as PortalUser[];
  } catch {
    return fallbackUsers;
  }
}

function getEvaluations() {
  if (typeof window === "undefined") return seedVentures;
  const raw = window.localStorage.getItem(evaluationsStorageKey);
  let savedVentures: Venture[] = [];

  try {
    savedVentures = raw
      ? (JSON.parse(raw) as Venture[]).filter((venture) => !demoEvaluationIds.has(venture.id))
      : [];
  } catch {
    savedVentures = [];
  }

  if (raw) {
    window.localStorage.setItem(evaluationsStorageKey, JSON.stringify(savedVentures));
  }

  const liveVentures = readApplications()
    .filter((application) => application.juryAssignees.length > 0)
    .map((application) => {
      const existing = savedVentures.find((venture) => venture.id === application.id);
      if (existing) return existing;

      return {
        id: application.id,
        name: application.startup,
        sector: application.sector,
        city: application.city,
        stage: application.stage,
        assignedTo: application.juryAssignees,
        scores: Object.fromEntries(criteria.map((criterion) => [criterion, 0])) as Record<Criterion, number>,
        comment: "",
        recommendation: "",
      } satisfies Venture;
    });

  if (!raw) return liveVentures;

  return [
    ...liveVentures,
    ...savedVentures.filter((venture) => !liveVentures.some((item) => item.id === venture.id)),
  ];
}

export default function JuryPanel() {
  const [activeUser, setActiveUser] = useState<PortalUser | null>(null);
  const [loginError, setLoginError] = useState("");
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const users = getUsers();
    const sessionEmail = window.localStorage.getItem(jurySessionKey);
    const sessionUser = users.find((user) => user.email === sessionEmail);
    if (sessionUser && allowedRoles.includes(sessionUser.role)) setActiveUser(sessionUser);

    const savedVentures = getEvaluations();
    setVentures(savedVentures);
    setSelectedId(savedVentures[0]?.id || "");
  }, []);

  function persistVentures(nextVentures: Venture[]) {
    setVentures(nextVentures);
    window.localStorage.setItem(evaluationsStorageKey, JSON.stringify(nextVentures));
  }

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const user = getUsers().find(
      (item) => item.email.toLowerCase() === email && item.password === password,
    );

    if (!user || !allowedRoles.includes(user.role)) {
      setLoginError("Bu panele yalnızca süper admin, admin, yetkili veya mentor girebilir.");
      return;
    }

    window.localStorage.setItem(jurySessionKey, user.email);
    setActiveUser(user);
    setLoginError("");
  }

  function logout() {
    window.localStorage.removeItem(jurySessionKey);
    setActiveUser(null);
  }

  const visibleVentures = useMemo(() => {
    if (!activeUser) return [];
    if (["Süper Admin", "Admin", "Program Yetkilisi"].includes(activeUser.role)) return ventures;
    return ventures.filter((venture) =>
      venture.assignedTo.some((email) => email.toLowerCase() === activeUser.email.toLowerCase()),
    );
  }, [activeUser, ventures]);

  const selectedVenture =
    visibleVentures.find((venture) => venture.id === selectedId) || visibleVentures[0];

  function updateScore(criterion: Criterion, value: number) {
    if (!selectedVenture) return;
    const score = Math.max(0, Math.min(10, value));
    persistVentures(
      ventures.map((venture) =>
        venture.id === selectedVenture.id
          ? { ...venture, scores: { ...venture.scores, [criterion]: score } }
          : venture,
      ),
    );
  }

  function updateComment(comment: string) {
    if (!selectedVenture) return;
    persistVentures(
      ventures.map((venture) =>
        venture.id === selectedVenture.id ? { ...venture, comment } : venture,
      ),
    );
  }

  function updateRecommendation(recommendation: Recommendation) {
    if (!selectedVenture) return;
    persistVentures(
      ventures.map((venture) =>
        venture.id === selectedVenture.id ? { ...venture, recommendation } : venture,
      ),
    );
  }

  const total = selectedVenture
    ? criteria.reduce((sum, criterion) => sum + selectedVenture.scores[criterion], 0)
    : 0;

  if (!activeUser) {
    return (
      <main className="min-h-screen bg-[#f6fbfc] px-6 py-10 text-slate-950">
        <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_.9fr]">
          <div>
            <img src="/lidea-logo.svg" alt="Lidea" className="h-16 w-auto" />
            <h1 className="mt-10 max-w-xl text-5xl font-black tracking-tight">
              Jüri ve Değerlendirici Paneli
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              Atanan girişimleri puanlayın, yorumlayın ve kabul, yedek veya ret önerinizi
              Excel kullanmadan tek panelden yönetin.
            </p>
          </div>

          <form
            onSubmit={login}
            className="rounded-lg border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,.08)]"
          >
            <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan-700">
              Değerlendirici Girişi
            </p>
            <h2 className="mt-3 text-3xl font-black">Tanımlı yetkili hesabı</h2>
            <label className="mt-8 block text-sm font-bold">
              E-posta
              <input name="email" type="email" className={`${inputClass} mt-2 w-full`} />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Şifre
              <input name="password" type="password" className={`${inputClass} mt-2 w-full`} />
            </label>
            {loginError ? (
              <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {loginError}
              </p>
            ) : null}
            <button className="mt-6 h-12 w-full rounded-md bg-[#063f46] px-5 font-bold text-white">
              Giriş Yap
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6fbfc] text-slate-950">
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">
            Jüri / Değerlendirici Paneli
          </p>
          <h1 className="mt-1 text-2xl font-black">Atanan Girişim Değerlendirmeleri</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-black">{activeUser.name}</p>
            <p className="text-xs text-slate-500">{activeUser.role}</p>
          </div>
          <button
            onClick={logout}
            className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold"
          >
            Çıkış
          </button>
        </div>
      </header>

      <div className="grid gap-6 p-6 xl:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3 px-1 py-2">
            <h2 className="text-lg font-black">Girişimler</h2>
            <span className="rounded-md bg-cyan-50 px-3 py-1 text-sm font-black text-cyan-800">
              {visibleVentures.length}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {visibleVentures.map((venture) => (
              <button
                key={venture.id}
                onClick={() => setSelectedId(venture.id)}
                className={`w-full rounded-md border p-4 text-left transition ${
                  selectedVenture?.id === venture.id
                    ? "border-cyan-500 bg-cyan-50"
                    : "border-slate-100 bg-slate-50 hover:border-slate-200"
                }`}
              >
                <p className="font-black">{venture.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {venture.sector} • {venture.city} • {venture.stage}
                </p>
                <p className="mt-2 text-xs font-bold text-cyan-800">
                  {venture.recommendation || "Öneri bekliyor"}
                </p>
              </button>
            ))}
          </div>
        </aside>

        {selectedVenture ? (
          <section className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan-700">
                    {selectedVenture.id}
                  </p>
                  <h2 className="mt-2 text-4xl font-black">{selectedVenture.name}</h2>
                  <p className="mt-2 text-slate-500">
                    {selectedVenture.sector} / {selectedVenture.city} / {selectedVenture.stage}
                  </p>
                </div>
                <div className="rounded-lg bg-[#063f46] px-6 py-5 text-white">
                  <p className="text-sm font-bold text-white/70">Toplam</p>
                  <p className="mt-1 text-4xl font-black">{total} / 60</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {criteria.map((criterion) => (
                  <label
                    key={criterion}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-black">{criterion}</span>
                      <span className="text-lg font-black">
                        {selectedVenture.scores[criterion]} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={selectedVenture.scores[criterion]}
                      onChange={(event) => updateScore(criterion, Number(event.target.value))}
                      className="mt-4 w-full accent-cyan-700"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
              <section className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-black">Değerlendirici Yorumu</h2>
                <textarea
                  value={selectedVenture.comment}
                  onChange={(event) => updateComment(event.target.value)}
                  rows={8}
                  className="mt-5 w-full rounded-md border border-slate-200 bg-white p-4 text-sm leading-6 outline-none focus:border-cyan-600"
                />
              </section>

              <aside className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-black">Öneri</h2>
                <div className="mt-5 grid gap-3">
                  {(["Kabul Öner", "Yedek Öner", "Ret Öner"] as Recommendation[]).map(
                    (recommendation) => (
                      <button
                        key={recommendation}
                        onClick={() => updateRecommendation(recommendation)}
                        className={`h-12 rounded-md border px-4 text-sm font-black transition ${
                          selectedVenture.recommendation === recommendation
                            ? "border-[#063f46] bg-[#063f46] text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {recommendation}
                      </button>
                    ),
                  )}
                </div>
                <div className="mt-6 rounded-md bg-cyan-50 p-4">
                  <p className="text-sm font-bold text-cyan-900">Kayıt durumu</p>
                  <p className="mt-1 text-sm text-cyan-800">
                    Puan, yorum ve öneriler tarayıcı yerel verisinde canlı saklanır.
                  </p>
                </div>
              </aside>
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-black">Atanmış girişim bulunamadı</h2>
            <p className="mt-2 text-slate-500">
              Bu kullanıcıya henüz değerlendirme atanmamış.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
