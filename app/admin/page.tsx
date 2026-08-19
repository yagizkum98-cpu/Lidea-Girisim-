"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ApplicationStatus =
  | "Yeni"
  | "İnceleniyor"
  | "Jüriye Gönderildi"
  | "Kabul"
  | "Yedek"
  | "Reddedildi";

type Application = {
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
  status: ApplicationStatus;
  submittedAt: string;
};

type AdminUser = {
  name: string;
  email: string;
  password: string;
  role:
    | "Süper Admin"
    | "Admin"
    | "Program Yetkilisi"
    | "Değerlendirme Yetkilisi"
    | "Mentor"
    | "Girişimci";
};

type Announcement = {
  id: string;
  to: string;
  title: string;
  message: string;
  createdAt: string;
};

const storageKey = "lidea-admin-users";
const sessionKey = "lidea-admin-session";
const announcementsStorageKey = "lidea-announcements";

const initialUsers: AdminUser[] = [
  {
    name: "Süper Admin",
    email: "admin@lideagirisim.com",
    password: "lideagirisimsuperadmin123",
    role: "Süper Admin",
  },
];

const menu = [
  "Dashboard",
  "Program Yönetimi",
  "Başvurular",
  "Girişimler",
  "Girişimciler",
  "Değerlendiriciler",
  "Mentorlar",
  "Eğitimler",
  "Etkinlikler",
  "Görevler",
  "Demo Day",
  "Dokümanlar",
  "Bildirimler",
  "Raporlar",
  "Landing Page Yönetimi",
  "Sistem Ayarları",
];

const statuses: ApplicationStatus[] = [
  "Yeni",
  "İnceleniyor",
  "Jüriye Gönderildi",
  "Kabul",
  "Yedek",
  "Reddedildi",
];

const applicationsSeed: Application[] = [
  {
    id: "LID-0301",
    founder: "Deniz Aral",
    email: "deniz@orbit.ai",
    startup: "Orbit AI",
    period: "3. Dönem",
    sector: "Yapay Zeka",
    city: "Muğla",
    stage: "MVP",
    teamSize: 4,
    score: 88,
    status: "Jüriye Gönderildi",
    submittedAt: "2026-08-12",
  },
  {
    id: "LID-0302",
    founder: "Elif Kaya",
    email: "elif@agrolink.com",
    startup: "AgroLink",
    period: "3. Dönem",
    sector: "Tarım Teknolojileri",
    city: "İzmir",
    stage: "Prototip",
    teamSize: 3,
    score: 79,
    status: "İnceleniyor",
    submittedAt: "2026-08-10",
  },
  {
    id: "LID-0303",
    founder: "Mert Yılmaz",
    email: "mert@edupulse.io",
    startup: "EduPulse",
    period: "3. Dönem",
    sector: "Eğitim",
    city: "İstanbul",
    stage: "İlk müşteriler",
    teamSize: 5,
    score: 92,
    status: "Kabul",
    submittedAt: "2026-08-08",
  },
  {
    id: "LID-0304",
    founder: "Sena Demir",
    email: "sena@mobilite.co",
    startup: "MobiLite",
    period: "2. Dönem",
    sector: "Mobilite",
    city: "Ankara",
    stage: "Fikir",
    teamSize: 2,
    score: 64,
    status: "Yedek",
    submittedAt: "2026-07-28",
  },
  {
    id: "LID-0305",
    founder: "Baran Ece",
    email: "baran@healthmap.app",
    startup: "HealthMap",
    period: "3. Dönem",
    sector: "Sağlık",
    city: "Antalya",
    stage: "MVP",
    teamSize: 6,
    score: 83,
    status: "Yeni",
    submittedAt: "2026-08-15",
  },
  {
    id: "LID-0306",
    founder: "Zeynep Acar",
    email: "zeynep@finbridge.co",
    startup: "FinBridge",
    period: "1. Dönem",
    sector: "Finans",
    city: "Bursa",
    stage: "Gelir elde ediyor",
    teamSize: 7,
    score: 55,
    status: "Reddedildi",
    submittedAt: "2026-06-21",
  },
];

const kpis = [
  ["327", "Başvuru"],
  ["85", "Ön Değerlendirmede"],
  ["40", "Programa Kabul"],
  ["24", "Aktif Mentor"],
  ["18", "Eğitim"],
  ["32", "Aktif Girişim"],
];

const selectClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-cyan-600";

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600";

function readUsers() {
  if (typeof window === "undefined") return initialUsers;
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return initialUsers;

  try {
    return JSON.parse(saved) as AdminUser[];
  } catch {
    return initialUsers;
  }
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [activeUser, setActiveUser] = useState<AdminUser | null>(null);
  const [loginError, setLoginError] = useState("");
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [applications, setApplications] = useState(applicationsSeed);
  const [filters, setFilters] = useState({
    period: "",
    sector: "",
    city: "",
    stage: "",
    teamSize: "",
    minScore: "",
  });
  const [userNotice, setUserNotice] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [announcementNotice, setAnnouncementNotice] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const storedUsers = readUsers();
    setUsers(storedUsers);
    window.localStorage.setItem(storageKey, JSON.stringify(storedUsers));

    const sessionEmail = window.localStorage.getItem(sessionKey);
    const sessionUser = storedUsers.find((user) => user.email === sessionEmail);
    if (sessionUser) setActiveUser(sessionUser);

    const savedAnnouncements = window.localStorage.getItem(announcementsStorageKey);
    if (savedAnnouncements) {
      try {
        setAnnouncements(JSON.parse(savedAnnouncements) as Announcement[]);
      } catch {
        setAnnouncements([]);
      }
    }
  }, []);

  function saveUsers(nextUsers: AdminUser[]) {
    setUsers(nextUsers);
    window.localStorage.setItem(storageKey, JSON.stringify(nextUsers));
  }

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const user = users.find(
      (item) => item.email.toLowerCase() === email && item.password === password,
    );

    if (!user) {
      setLoginError("E-posta veya şifre hatalı.");
      return;
    }

    window.localStorage.setItem(sessionKey, user.email);
    setActiveUser(user);
    setLoginError("");
  }

  function logout() {
    window.localStorage.removeItem(sessionKey);
    setActiveUser(null);
  }

  function moveApplication(id: string, status: ApplicationStatus) {
    setApplications((items) =>
      items.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  }

  function updateScore(id: string, score: number) {
    setApplications((items) =>
      items.map((item) =>
        item.id === id ? { ...item, score: Math.max(0, Math.min(100, score)) } : item,
      ),
    );
  }

  function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextUser: AdminUser = {
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || ""),
      role: String(form.get("role")) as AdminUser["role"],
    };

    if (!nextUser.name || !nextUser.email || !nextUser.password) {
      setUserNotice("Tüm yetkili alanlarını doldurun.");
      return;
    }

    if (users.some((user) => user.email.toLowerCase() === nextUser.email.toLowerCase())) {
      setUserNotice("Bu e-posta ile yetkili zaten tanımlı.");
      return;
    }

    saveUsers([...users, nextUser]);
    setUserNotice("Yeni yetkili tanımlandı.");
    event.currentTarget.reset();
  }

  function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeUser) return;

    const form = new FormData(event.currentTarget);
    const current = String(form.get("currentPassword") || "");
    const next = String(form.get("nextPassword") || "");

    if (current !== activeUser.password) {
      setPasswordNotice("Mevcut şifre hatalı.");
      return;
    }

    if (next.length < 8) {
      setPasswordNotice("Yeni şifre en az 8 karakter olmalı.");
      return;
    }

    const nextUsers = users.map((user) =>
      user.email === activeUser.email ? { ...user, password: next } : user,
    );
    saveUsers(nextUsers);
    setActiveUser({ ...activeUser, password: next });
    setPasswordNotice("Şifre güncellendi.");
    event.currentTarget.reset();
  }

  function sendAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const to = String(form.get("to") || "");
    const title = String(form.get("title") || "").trim();
    const message = String(form.get("message") || "").trim();

    if (!to || !title || !message) {
      setAnnouncementNotice("Duyuru alıcısı, başlık ve mesaj zorunlu.");
      return;
    }

    const nextAnnouncements = [
      {
        id: crypto.randomUUID(),
        to,
        title,
        message,
        createdAt: new Date().toLocaleString("tr-TR"),
      },
      ...announcements,
    ];
    setAnnouncements(nextAnnouncements);
    window.localStorage.setItem(announcementsStorageKey, JSON.stringify(nextAnnouncements));
    setAnnouncementNotice("Girişimciye duyuru gönderildi.");
    event.currentTarget.reset();
  }

  const filteredApplications = useMemo(() => {
    return applications.filter((item) => {
      const teamFilter = Number(filters.teamSize);
      const scoreFilter = Number(filters.minScore);

      return (
        (!filters.period || item.period === filters.period) &&
        (!filters.sector || item.sector === filters.sector) &&
        (!filters.city || item.city === filters.city) &&
        (!filters.stage || item.stage === filters.stage) &&
        (!filters.teamSize || item.teamSize >= teamFilter) &&
        (!filters.minScore || item.score >= scoreFilter)
      );
    });
  }, [applications, filters]);

  const uniqueOptions = (key: keyof Application) =>
    Array.from(new Set(applications.map((item) => String(item[key]))));

  if (!activeUser) {
    return (
      <main className="min-h-screen bg-[#f6fbfc] px-6 py-10 text-slate-950">
        <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[.95fr_1.05fr]">
          <div>
            <img src="/lidea-logo.svg" alt="Lidea" className="h-16 w-auto" />
            <h1 className="mt-10 max-w-xl text-5xl font-black tracking-tight">
              Admin ve Program Yönetim Paneli
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              Başvuruları, program süreçlerini, mentorları, eğitimleri, raporları ve
              landing page içeriklerini tek merkezden yönetin.
            </p>
          </div>

          <form
            onSubmit={login}
            className="rounded-lg border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,.08)]"
          >
            <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan-700">
              Güvenli Giriş
            </p>
            <h2 className="mt-3 text-3xl font-black">Yönetici hesabı</h2>
            <label className="mt-8 block text-sm font-bold">
              E-posta
              <input
                name="email"
                type="email"
                defaultValue="admin@lideagirisim.com"
                className={`${inputClass} mt-2 w-full`}
              />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Şifre
              <input
                name="password"
                type="password"
                defaultValue="lideagirisimsuperadmin123"
                className={`${inputClass} mt-2 w-full`}
              />
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
              Program Paneli
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
              <h1 className="mt-1 text-2xl font-black">Lidea Merkezi Yönetim</h1>
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

          <div className="space-y-6 p-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              {kpis.map(([value, label]) => (
                <article
                  key={label}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-3xl font-black">{value}</p>
                  <p className="mt-2 text-sm font-bold text-slate-500">{label}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <div className="rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-200 p-5">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black">Başvuru Yönetimi</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Başvuruları filtreleyin, puanlayın ve süreç durumunu ilerletin.
                      </p>
                    </div>
                    <span className="rounded-md bg-cyan-50 px-3 py-2 text-sm font-black text-cyan-800">
                      {filteredApplications.length} kayıt
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <select
                      className={selectClass}
                      value={filters.period}
                      onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                    >
                      <option value="">Dönem</option>
                      {uniqueOptions("period").map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                    <select
                      className={selectClass}
                      value={filters.sector}
                      onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                    >
                      <option value="">Sektör</option>
                      {uniqueOptions("sector").map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                    <select
                      className={selectClass}
                      value={filters.city}
                      onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    >
                      <option value="">Şehir</option>
                      {uniqueOptions("city").map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                    <select
                      className={selectClass}
                      value={filters.stage}
                      onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                    >
                      <option value="">Girişim aşaması</option>
                      {uniqueOptions("stage").map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                    <input
                      className={inputClass}
                      type="number"
                      min="1"
                      placeholder="Min. ekip"
                      value={filters.teamSize}
                      onChange={(e) => setFilters({ ...filters, teamSize: e.target.value })}
                    />
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Min. puan"
                      value={filters.minScore}
                      onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Başvuru</th>
                        <th className="px-5 py-4">Dönem</th>
                        <th className="px-5 py-4">Sektör</th>
                        <th className="px-5 py-4">Şehir</th>
                        <th className="px-5 py-4">Aşama</th>
                        <th className="px-5 py-4">Ekip</th>
                        <th className="px-5 py-4">Puan</th>
                        <th className="px-5 py-4">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredApplications.map((item) => (
                        <tr key={item.id} className="align-top">
                          <td className="px-5 py-4">
                            <p className="font-black">{item.startup}</p>
                            <p className="mt-1 text-slate-500">{item.founder}</p>
                            <p className="mt-1 text-xs text-slate-400">{item.id}</p>
                          </td>
                          <td className="px-5 py-4 font-semibold">{item.period}</td>
                          <td className="px-5 py-4">{item.sector}</td>
                          <td className="px-5 py-4">{item.city}</td>
                          <td className="px-5 py-4">{item.stage}</td>
                          <td className="px-5 py-4">{item.teamSize}</td>
                          <td className="px-5 py-4">
                            <input
                              aria-label={`${item.startup} değerlendirme puanı`}
                              className="h-10 w-20 rounded-md border border-slate-200 px-2 font-bold"
                              type="number"
                              min="0"
                              max="100"
                              value={item.score}
                              onChange={(e) => updateScore(item.id, Number(e.target.value))}
                            />
                          </td>
                          <td className="px-5 py-4">
                            <select
                              className={selectClass}
                              value={item.status}
                              onChange={(e) =>
                                moveApplication(item.id, e.target.value as ApplicationStatus)
                              }
                            >
                              {statuses.map((status) => (
                                <option key={status}>{status}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <aside className="space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-black">Durum Akışı</h2>
                  <div className="mt-5 space-y-3">
                    {statuses.map((status, index) => (
                      <div key={status} className="flex items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-md bg-[#063f46] text-xs font-black text-white">
                          {index + 1}
                        </span>
                        <span className="text-sm font-bold">{status}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-black">Şifre Değiştir</h2>
                  <form onSubmit={changePassword} className="mt-4 grid gap-3">
                    <input
                      name="currentPassword"
                      type="password"
                      placeholder="Mevcut şifre"
                      className={inputClass}
                    />
                    <input
                      name="nextPassword"
                      type="password"
                      placeholder="Yeni şifre"
                      className={inputClass}
                    />
                    <button className="h-11 rounded-md bg-[#063f46] px-4 text-sm font-bold text-white">
                      Güncelle
                    </button>
                  </form>
                  {passwordNotice ? (
                    <p className="mt-3 text-sm font-semibold text-cyan-800">{passwordNotice}</p>
                  ) : null}
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-black">Yetkili Tanımla</h2>
                  <form onSubmit={createUser} className="mt-4 grid gap-3">
                    <input name="name" placeholder="İsim" className={inputClass} />
                    <input name="email" type="email" placeholder="E-posta" className={inputClass} />
                    <input
                      name="password"
                      type="password"
                      placeholder="Geçici şifre"
                      className={inputClass}
                    />
                    <select name="role" className={selectClass} defaultValue="Program Yetkilisi">
                      <option>Admin</option>
                      <option>Program Yetkilisi</option>
                      <option>Değerlendirme Yetkilisi</option>
                      <option>Mentor</option>
                      <option>Girişimci</option>
                      <option>Süper Admin</option>
                    </select>
                    <button className="h-11 rounded-md bg-cyan-700 px-4 text-sm font-bold text-white">
                      Yetkili Ekle
                    </button>
                  </form>
                  {userNotice ? (
                    <p className="mt-3 text-sm font-semibold text-cyan-800">{userNotice}</p>
                  ) : null}
                  <div className="mt-5 space-y-3">
                    {users.map((user) => (
                      <div
                        key={user.email}
                        className="rounded-md border border-slate-100 bg-slate-50 p-3"
                      >
                        <p className="text-sm font-black">{user.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                        <p className="mt-1 text-xs font-bold text-cyan-800">{user.role}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-black">Girişimci Duyurusu</h2>
                  <form onSubmit={sendAnnouncement} className="mt-4 grid gap-3">
                    <select name="to" className={selectClass} defaultValue="">
                      <option value="">Girişimci seç</option>
                      {users
                        .filter((user) => user.role === "Girişimci")
                        .map((user) => (
                          <option key={user.email} value={user.email}>
                            {user.name} - {user.email}
                          </option>
                        ))}
                    </select>
                    <input name="title" placeholder="Duyuru başlığı" className={inputClass} />
                    <textarea
                      name="message"
                      placeholder="Duyuru mesajı"
                      rows={4}
                      className="rounded-md border border-slate-200 bg-white p-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600"
                    />
                    <button className="h-11 rounded-md bg-[#063f46] px-4 text-sm font-bold text-white">
                      Duyuru Gönder
                    </button>
                  </form>
                  {announcementNotice ? (
                    <p className="mt-3 text-sm font-semibold text-cyan-800">
                      {announcementNotice}
                    </p>
                  ) : null}
                  <div className="mt-5 space-y-3">
                    {announcements.slice(0, 3).map((announcement) => (
                      <div
                        key={announcement.id}
                        className="rounded-md border border-slate-100 bg-slate-50 p-3"
                      >
                        <p className="text-sm font-black">{announcement.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{announcement.to}</p>
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          {announcement.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
