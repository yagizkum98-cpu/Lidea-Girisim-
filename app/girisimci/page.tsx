"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type UserRole =
  | "Süper Admin"
  | "Program Yetkilisi"
  | "Değerlendirme Yetkilisi"
  | "Girişimci";

type PortalUser = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

type StartupProfile = {
  name: string;
  logo: string;
  problem: string;
  solution: string;
  audience: string;
  businessModel: string;
  website: string;
};

const usersStorageKey = "lidea-admin-users";
const entrepreneurSessionKey = "lidea-entrepreneur-session";
const progressStorageKey = "lidea-entrepreneur-progress";
const profileStorageKey = "lidea-entrepreneur-profile";

const defaultProfile: StartupProfile = {
  name: "LideaCheck",
  logo: "LC",
  problem: "Erken aşama girişimler dağınık başvuru, belge ve program takibi nedeniyle hız kaybediyor.",
  solution: "Başvuru, mentorluk, görev ve demo day süreçlerini tek panelde görünür hale getiren yalın takip aracı.",
  audience: "Kuluçka programına kabul alan erken aşama girişim ekipleri ve program yöneticileri.",
  businessModel: "B2B SaaS abonelik, program başına lisans ve kurum içi kurulum modeli.",
  website: "https://lideagirisim.com",
};

const fallbackUsers: PortalUser[] = [
  {
    name: "Süper Admin",
    email: "admin@lideagirisim.com",
    password: "lideagirisimsuperadmin123",
    role: "Süper Admin",
  },
];

const menu = [
  "Dashboard",
  "Girişimim",
  "Başvurum",
  "Programım",
  "Eğitimler",
  "Mentorluk",
  "Dokümanlar",
  "Pitch Deck",
  "Demo Day",
  "Bildirimler",
  "Profil",
];

const journey = ["Başvuru", "Kabul", "Eğitim", "Mentorluk", "MVP", "Demo Day"];

const tasks = [
  ["Problem doğrulama görüşmeleri", "Tamamlandı", "12/12"],
  ["MVP ekran akışı", "Devam ediyor", "7/10"],
  ["Mentor notlarının yüklenmesi", "Bekliyor", "0/1"],
  ["Demo Day tek sayfa özet", "Devam ediyor", "2/5"],
];

const trainings = [
  ["İş Modeli Kanvası", "22 Ağustos 2026", "Canlı"],
  ["MVP ve Ürün Doğrulama", "29 Ağustos 2026", "Atölye"],
  ["Pitch Deck Hazırlığı", "5 Eylül 2026", "Online"],
];

const documents = [
  "Başvuru formu",
  "Kurucu özgeçmişleri",
  "Pitch deck taslağı",
  "KVKK onay metni",
];

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

function getProfile() {
  if (typeof window === "undefined") return defaultProfile;
  const raw = window.localStorage.getItem(profileStorageKey);
  if (!raw) return defaultProfile;

  try {
    return JSON.parse(raw) as StartupProfile;
  } catch {
    return defaultProfile;
  }
}

export default function EntrepreneurPanel() {
  const [activeUser, setActiveUser] = useState<PortalUser | null>(null);
  const [loginError, setLoginError] = useState("");
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [progress, setProgress] = useState(45);
  const [profile, setProfile] = useState(defaultProfile);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const users = getUsers();
    const sessionEmail = window.localStorage.getItem(entrepreneurSessionKey);
    const sessionUser = users.find((user) => user.email === sessionEmail);
    if (sessionUser && ["Girişimci", "Süper Admin", "Program Yetkilisi"].includes(sessionUser.role)) {
      setActiveUser(sessionUser);
    }

    const savedProgress = Number(window.localStorage.getItem(progressStorageKey));
    setProgress(Number.isFinite(savedProgress) && savedProgress > 0 ? savedProgress : 45);
    setProfile(getProfile());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(progressStorageKey, String(progress));
    }
  }, [progress]);

  const completedSteps = useMemo(() => {
    return Math.max(1, Math.round((progress / 100) * journey.length));
  }, [progress]);

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const users = getUsers();
    const user = users.find(
      (item) => item.email.toLowerCase() === email && item.password === password,
    );

    if (!user || !["Girişimci", "Süper Admin", "Program Yetkilisi"].includes(user.role)) {
      setLoginError("Bu panele giriş için admin tarafından tanımlanmış girişimci hesabı gerekir.");
      return;
    }

    window.localStorage.setItem(entrepreneurSessionKey, user.email);
    setActiveUser(user);
    setLoginError("");
  }

  function logout() {
    window.localStorage.removeItem(entrepreneurSessionKey);
    setActiveUser(null);
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextProfile = {
      name: String(form.get("name") || ""),
      logo: String(form.get("logo") || ""),
      problem: String(form.get("problem") || ""),
      solution: String(form.get("solution") || ""),
      audience: String(form.get("audience") || ""),
      businessModel: String(form.get("businessModel") || ""),
      website: String(form.get("website") || ""),
    };

    setProfile(nextProfile);
    window.localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
    setNotice("Girişim profili güncellendi.");
  }

  function resetProgress() {
    setProgress(0);
  }

  if (!activeUser) {
    return (
      <main className="min-h-screen bg-[#f6fbfc] px-6 py-10 text-slate-950">
        <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_.9fr]">
          <div>
            <img src="/lidea-logo.svg" alt="Lidea" className="h-16 w-auto" />
            <h1 className="mt-10 max-w-xl text-5xl font-black tracking-tight">
              Girişimci Paneli
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              Girişim profilinizi, başvuru durumunuzu, program görevlerinizi, eğitimleri,
              mentorluk notlarını ve Demo Day hazırlıklarını tek yerden takip edin.
            </p>
          </div>

          <form
            onSubmit={login}
            className="rounded-lg border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,.08)]"
          >
            <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan-700">
              Yetkili Giriş
            </p>
            <h2 className="mt-3 text-3xl font-black">Tanımlı girişimci hesabı</h2>
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
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <img src="/lidea-logo.svg" alt="Lidea" className="h-12 w-auto" />
            <p className="mt-4 text-xs font-bold uppercase tracking-[.18em] text-cyan-700">
              Girişimci Paneli
            </p>
          </div>
          <nav className="grid gap-1 p-3">
            {menu.map((item) => (
              <button
                key={item}
                onClick={() => setActiveMenu(item)}
                className={`rounded-md px-3 py-2.5 text-left text-sm font-semibold transition ${
                  activeMenu === item
                    ? "bg-[#063f46] text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <section>
          <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">
                {activeMenu}
              </p>
              <h1 className="mt-1 text-2xl font-black">{profile.name} çalışma alanı</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-black">{activeUser.name}</p>
                <p className="text-xs text-slate-500">{activeUser.email}</p>
              </div>
              <button
                onClick={logout}
                className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold"
              >
                Çıkış
              </button>
            </div>
          </header>

          <div className="space-y-6 p-6">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan-700">
                    Program İlerlemesi
                  </p>
                  <h2 className="mt-2 text-5xl font-black">%{progress}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    aria-label="Program ilerleme yüzdesi"
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(event) => setProgress(Number(event.target.value))}
                    className="w-52 accent-cyan-700"
                  />
                  <button
                    onClick={resetProgress}
                    className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold"
                  >
                    Sıfırla
                  </button>
                </div>
              </div>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#063f46] via-cyan-600 to-[#8ad66f] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-6">
                {journey.map((step, index) => {
                  const done = index < completedSteps && progress > 0;
                  return (
                    <div
                      key={step}
                      className={`rounded-md border p-4 ${
                        done
                          ? "border-cyan-200 bg-cyan-50 text-cyan-950"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                    >
                      <p className="text-xl font-black">{done ? "✓" : index + 1}</p>
                      <p className="mt-2 text-sm font-bold">{step}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black">Girişimim</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Logo, problem, çözüm, hedef kitle, iş modeli ve web sitesi.
                      </p>
                    </div>
                    <span className="grid h-14 w-14 place-items-center rounded-md bg-[#063f46] text-lg font-black text-white">
                      {profile.logo || "LG"}
                    </span>
                  </div>

                  <form onSubmit={saveProfile} className="mt-6 grid gap-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <input name="name" defaultValue={profile.name} className={inputClass} />
                      <input name="logo" defaultValue={profile.logo} className={inputClass} />
                      <input name="website" defaultValue={profile.website} className={inputClass} />
                    </div>
                    <textarea
                      name="problem"
                      defaultValue={profile.problem}
                      rows={3}
                      className="rounded-md border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-600"
                    />
                    <textarea
                      name="solution"
                      defaultValue={profile.solution}
                      rows={3}
                      className="rounded-md border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-600"
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <textarea
                        name="audience"
                        defaultValue={profile.audience}
                        rows={3}
                        className="rounded-md border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-600"
                      />
                      <textarea
                        name="businessModel"
                        defaultValue={profile.businessModel}
                        rows={3}
                        className="rounded-md border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-600"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">
                        Profili Kaydet
                      </button>
                      {notice ? <p className="text-sm font-semibold text-cyan-800">{notice}</p> : null}
                    </div>
                  </form>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                  <article className="rounded-lg border border-slate-200 bg-white p-6">
                    <h2 className="text-xl font-black">Başvurum</h2>
                    <div className="mt-5 space-y-4">
                      <div className="rounded-md bg-cyan-50 p-4">
                        <p className="text-sm font-bold text-cyan-800">Başvuru Durumu</p>
                        <p className="mt-1 text-2xl font-black">Kabul</p>
                      </div>
                      <div className="rounded-md border border-slate-200 p-4">
                        <p className="text-sm font-bold">Eksik Belgeler</p>
                        <p className="mt-1 text-sm text-slate-500">Pitch deck final versiyonu bekleniyor.</p>
                      </div>
                    </div>
                  </article>

                  <article className="rounded-lg border border-slate-200 bg-white p-6">
                    <h2 className="text-xl font-black">Programım</h2>
                    <div className="mt-5 space-y-3">
                      {tasks.map(([task, status, count]) => (
                        <div key={task} className="rounded-md border border-slate-100 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black">{task}</p>
                            <span className="text-xs font-bold text-cyan-800">{count}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{status}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                </section>
              </div>

              <aside className="space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-black">Eğitimler</h2>
                  <div className="mt-4 space-y-3">
                    {trainings.map(([title, date, type]) => (
                      <div key={title} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                        <p className="text-sm font-black">{title}</p>
                        <p className="mt-1 text-xs text-slate-500">{date}</p>
                        <p className="mt-1 text-xs font-bold text-cyan-800">{type}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-black">Mentorluk</h2>
                  <div className="mt-4 rounded-md bg-[#063f46] p-4 text-white">
                    <p className="text-sm font-bold">Sıradaki görüşme</p>
                    <p className="mt-2 text-xl font-black">26 Ağustos 2026</p>
                    <p className="mt-1 text-sm text-white/70">Mahmut Dabbit ile ürün doğrulama</p>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-black">Dokümanlar</h2>
                  <div className="mt-4 space-y-2">
                    {documents.map((document) => (
                      <label key={document} className="flex items-center gap-3 text-sm font-semibold">
                        <input type="checkbox" defaultChecked={document !== "Pitch deck taslağı"} />
                        {document}
                      </label>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-black">Pitch Deck & Demo Day</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Sunum taslağı, jüri notları ve Demo Day hazırlık adımları bu alanda takip edilir.
                  </p>
                  <button className="mt-4 h-11 w-full rounded-md bg-cyan-700 px-4 text-sm font-bold text-white">
                    Pitch Deck Durumunu Aç
                  </button>
                </section>
              </aside>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
