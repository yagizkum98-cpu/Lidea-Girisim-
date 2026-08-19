"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ApplicationStatus =
  | "Yeni"
  | "İnceleniyor"
  | "Eksik Bilgi"
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

type Activity = {
  time: string;
  title: string;
  detail: string;
};

const usersStorageKey = "lidea-admin-users";
const sessionKey = "lidea-admin-session";
const announcementsStorageKey = "lidea-announcements";
const applicationsStorageKey = "lidea-applications";
const activitiesStorageKey = "lidea-admin-activities";

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
  "Başvurular",
  "Girişimler",
  "Jüri",
  "Program",
  "Bildirimler",
  "Raporlar",
  "Ayarlar",
];

const statuses: ApplicationStatus[] = [
  "Yeni",
  "İnceleniyor",
  "Eksik Bilgi",
  "Jüriye Gönderildi",
  "Kabul",
  "Yedek",
  "Reddedildi",
];

const legacyDemoIds = new Set([
  "LID-0301",
  "LID-0302",
  "LID-0303",
  "LID-0304",
  "LID-0305",
  "LID-0306",
]);

const selectClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-cyan-600";

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600";

function readUsers() {
  if (typeof window === "undefined") return initialUsers;
  const saved = window.localStorage.getItem(usersStorageKey);
  if (!saved) return initialUsers;

  try {
    return JSON.parse(saved) as AdminUser[];
  } catch {
    return initialUsers;
  }
}

function readApplications() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(applicationsStorageKey);
  if (!saved) {
    window.localStorage.setItem(applicationsStorageKey, JSON.stringify([]));
    return [];
  }

  try {
    const applications = JSON.parse(saved) as Application[];
    const liveApplications = applications.filter((item) => !legacyDemoIds.has(item.id));
    if (liveApplications.length !== applications.length) {
      window.localStorage.setItem(applicationsStorageKey, JSON.stringify(liveApplications));
    }
    return liveApplications;
  } catch {
    window.localStorage.setItem(applicationsStorageKey, JSON.stringify([]));
    return [];
  }
}

function readActivities() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(activitiesStorageKey);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as Activity[];
  } catch {
    return [];
  }
}

function isThisWeek(date: string) {
  const submitted = new Date(`${date}T00:00:00`);
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);
  return submitted >= weekAgo && submitted <= now;
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [activeUser, setActiveUser] = useState<AdminUser | null>(null);
  const [loginError, setLoginError] = useState("");
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [applications, setApplications] = useState<Application[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filters, setFilters] = useState({
    period: "",
    sector: "",
    city: "",
    stage: "",
    status: "",
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
    window.localStorage.setItem(usersStorageKey, JSON.stringify(storedUsers));

    const sessionEmail = window.localStorage.getItem(sessionKey);
    const sessionUser = storedUsers.find((user) => user.email === sessionEmail);
    if (sessionUser) setActiveUser(sessionUser);

    setApplications(readApplications());
    setActivities(readActivities());

    const syncApplications = () => setApplications(readApplications());
    window.addEventListener("focus", syncApplications);
    window.addEventListener("storage", syncApplications);
    window.addEventListener("lidea-applications-updated", syncApplications);

    const savedAnnouncements = window.localStorage.getItem(announcementsStorageKey);
    if (savedAnnouncements) {
      try {
        setAnnouncements(JSON.parse(savedAnnouncements) as Announcement[]);
      } catch {
        setAnnouncements([]);
      }
    }

    return () => {
      window.removeEventListener("focus", syncApplications);
      window.removeEventListener("storage", syncApplications);
      window.removeEventListener("lidea-applications-updated", syncApplications);
    };
  }, []);

  function saveUsers(nextUsers: AdminUser[]) {
    setUsers(nextUsers);
    window.localStorage.setItem(usersStorageKey, JSON.stringify(nextUsers));
  }

  function saveActivities(nextActivities: Activity[]) {
    setActivities(nextActivities);
    window.localStorage.setItem(activitiesStorageKey, JSON.stringify(nextActivities));
  }

  function addActivity(title: string, detail: string) {
    const nextActivities = [
      {
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        title,
        detail,
      },
      ...activities,
    ].slice(0, 20);
    saveActivities(nextActivities);
  }

  function saveApplications(nextApplications: Application[]) {
    setApplications(nextApplications);
    window.localStorage.setItem(applicationsStorageKey, JSON.stringify(nextApplications));
    window.dispatchEvent(new Event("lidea-applications-updated"));
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
    const application = applications.find((item) => item.id === id);
    saveApplications(applications.map((item) => (item.id === id ? { ...item, status } : item)));
    if (application) addActivity(`${application.startup} durumu güncellendi`, status);
  }

  function updateScore(id: string, score: number) {
    saveApplications(
      applications.map((item) =>
        item.id === id ? { ...item, score: Math.max(0, Math.min(100, score)) } : item,
      ),
    );
  }

  function setStatusFilter(status: ApplicationStatus) {
    setFilters({ ...filters, status });
    setActiveMenu("Başvurular");
    window.history.replaceState({}, "", `/admin?status=${encodeURIComponent(status)}`);
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
    addActivity("Yeni yetkili eklendi", nextUser.name);
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
    addActivity("Girişimci duyurusu gönderildi", title);
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
        (!filters.status || item.status === filters.status) &&
        (!filters.teamSize || item.teamSize >= teamFilter) &&
        (!filters.minScore || item.score >= scoreFilter)
      );
    });
  }, [applications, filters]);

  const metrics = useMemo(() => {
    const count = (status: ApplicationStatus) =>
      applications.filter((item) => item.status === status).length;

    return {
      total: applications.length,
      week: applications.filter((item) => isThisWeek(item.submittedAt)).length,
      review: count("İnceleniyor"),
      missing: count("Eksik Bilgi"),
      jury: count("Jüriye Gönderildi"),
      accepted: count("Kabul"),
      waitlist: count("Yedek"),
      rejected: count("Reddedildi"),
      new: count("Yeni"),
    };
  }, [applications]);

  const statusProgress = applications.length
    ? Math.round(((metrics.review + metrics.jury + metrics.accepted) / applications.length) * 100)
    : 0;

  const recentApplications = applications
    .slice()
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 8);

  const uniqueOptions = (key: keyof Application) =>
    Array.from(new Set(applications.map((item) => String(item[key])).filter(Boolean)));

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
              Canlı başvuruları, yetkilileri, duyuruları ve program operasyonunu tek merkezden
              yönetin.
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
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-5">
            <p className="text-lg font-black tracking-tight">LIDEA ADMIN</p>
          </div>
          <nav className="grid gap-1 p-3">
            {menu.map((item) => (
              <button
                key={item}
                onClick={() => {
              if (item === "Başvurular") {
                window.location.href = "/admin/basvurular";
                return;
              }
              if (item === "Girişimler") {
                window.location.href = "/admin/girisimler";
                return;
              }
              if (item === "Program") {
                window.location.href = "/admin/program";
                return;
              }
                  setActiveMenu(item);
                }}
                className={`rounded-md px-3 py-2.5 text-left text-sm font-semibold transition ${
                  activeMenu === item
                    ? "bg-[#063f46] text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {item === "Dashboard" ? "●" : item === "Ayarlar" ? "⚙" : "▣"} {item}
              </button>
            ))}
            <div className="my-3 border-t border-slate-200" />
            <button
              onClick={logout}
              className="rounded-md px-3 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              ⇥ Çıkış
            </button>
          </nav>
        </aside>

        <section>
          <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">
                3. DÖNEM / GENEL BAKIŞ
              </p>
              <h1 className="mt-1 text-2xl font-black">Operasyon Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-lg">
                🔔
              </span>
              <div className="text-right">
                <p className="text-sm font-black">{activeUser.name}</p>
                <p className="text-xs text-slate-500">{activeUser.role}</p>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                [metrics.total, "Toplam Başvuru", `+${metrics.week} bu hafta`],
                [metrics.review, "İncelemede", "Admin aksiyonu bekliyor"],
                [metrics.jury, "Jüri Değerlendirmesinde", "Jüriye gönderildi"],
                [metrics.accepted, "Kabul Edildi", "Programa seçildi"],
              ].map(([value, label, sub]) => (
                <article
                  key={label}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-4xl font-black">{value}</p>
                  <p className="mt-2 text-sm font-black text-slate-700">{label}</p>
                  <p className="mt-1 text-xs font-semibold text-cyan-700">{sub}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black">Başvuru Durumu</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Bekleyen başvuruları birkaç saniyede görün.
                      </p>
                    </div>
                    <span className="text-sm font-black text-cyan-800">%{statusProgress}</span>
                  </div>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#063f46]"
                      style={{ width: `${statusProgress}%` }}
                    />
                  </div>
                  <div className="mt-6 grid gap-2">
                    {[
                      ["Yeni", metrics.new],
                      ["İnceleniyor", metrics.review],
                      ["Jüriye Gönderildi", metrics.jury],
                      ["Kabul", metrics.accepted],
                      ["Yedek", metrics.waitlist],
                      ["Reddedildi", metrics.rejected],
                    ].map(([status, count]) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status as ApplicationStatus)}
                        className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-4 py-3 text-left text-sm font-semibold hover:border-cyan-200 hover:bg-cyan-50"
                      >
                        <span>{status}</span>
                        <span className="font-black">{count}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
                    <div>
                      <h2 className="text-xl font-black">Son Başvurular</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Son 5-10 başvurunun hızlı görünümü.
                      </p>
                    </div>
                  <button
                    onClick={() => {
                      window.location.href = "/admin/basvurular";
                    }}
                      className="h-10 rounded-md bg-[#063f46] px-4 text-sm font-bold text-white"
                    >
                      Tüm Başvuruları Gör →
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500">
                        <tr>
                          <th className="px-5 py-4">Girişim</th>
                          <th className="px-5 py-4">Kurucu</th>
                          <th className="px-5 py-4">Aşama</th>
                          <th className="px-5 py-4">Tarih</th>
                          <th className="px-5 py-4">Durum</th>
                          <th className="px-5 py-4">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentApplications.length ? (
                          recentApplications.map((item) => (
                            <tr key={item.id}>
                              <td className="px-5 py-4 font-black">{item.startup}</td>
                              <td className="px-5 py-4">{item.founder || "-"}</td>
                              <td className="px-5 py-4">{item.stage}</td>
                              <td className="px-5 py-4">{item.submittedAt}</td>
                              <td className="px-5 py-4 font-semibold">{item.status}</td>
                              <td className="px-5 py-4">
                                <button
                                  onClick={() => {
                                    setFilters({ ...filters, status: item.status });
                                    setActiveMenu("Başvurular");
                                  }}
                                  className="font-black text-cyan-800"
                                >
                                  İncele →
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="px-5 py-8 text-slate-500" colSpan={6}>
                              Henüz canlı başvuru yok. 3. dönem başvuru formu doldurulunca burada
                              görünecek.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section id="applications" className="rounded-lg border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 p-5">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-black">Başvuru Yönetimi</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Canlı başvuruları filtreleyin, puanlayın ve süreç durumunu ilerletin.
                        </p>
                      </div>
                      <span className="rounded-md bg-cyan-50 px-3 py-2 text-sm font-black text-cyan-800">
                        {filteredApplications.length} kayıt
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-4 xl:grid-cols-7">
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
                        <option value="">Aşama</option>
                        {uniqueOptions("stage").map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                      <select
                        className={selectClass}
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      >
                        <option value="">Durum</option>
                        {statuses.map((status) => (
                          <option key={status}>{status}</option>
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
                        {filteredApplications.length ? (
                          filteredApplications.map((item) => (
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
                          ))
                        ) : (
                          <tr>
                            <td className="px-5 py-8 text-slate-500" colSpan={8}>
                              Filtreye uygun canlı başvuru bulunamadı.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              <aside className="space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-black">Hızlı İşlemler</h2>
                  <div className="mt-4 grid gap-3">
                    {[
                      ["Yeni Başvuru", "/basvuru"],
                      ["Başvuruları İncele", "/admin/basvurular"],
                      ["Jüriye Ata", "/juri"],
                      ["Program Takvimini Yönet", "/admin/program"],
                    ].map(([label, href]) => (
                      <a
                        key={label}
                        href={href}
                        className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                      >
                        {label} →
                      </a>
                    ))}
                  </div>
                </section>

                <section id="program" className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-black">LIDEA 3. DÖNEM</h2>
                  <div className="mt-5 space-y-4 text-sm">
                    <div>
                      <div className="flex justify-between font-bold">
                        <span>Başvurular</span>
                        <span>{applications.length ? "Aktif" : "Beklemede"}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-cyan-700"
                          style={{ width: applications.length ? "100%" : "8%" }}
                        />
                      </div>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <p className="text-xs font-bold text-slate-500">Son Başvuru</p>
                      <p className="mt-1 font-black">30.09.2026</p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <p className="text-xs font-bold text-slate-500">Programa Kabul</p>
                      <p className="mt-1 font-black">{metrics.accepted} Girişim</p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <p className="text-xs font-bold text-slate-500">Demo Day</p>
                      <p className="mt-1 font-black">Henüz planlanmadı</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-black">Son Aktiviteler</h2>
                  <div className="mt-4 space-y-4">
                    {activities.length ? (
                      activities.slice(0, 6).map((activity, index) => (
                        <div
                          key={`${activity.time}-${index}`}
                          className="grid grid-cols-[48px_1fr] gap-3"
                        >
                          <p className="text-xs font-black text-cyan-800">{activity.time}</p>
                          <div>
                            <p className="text-sm font-black">{activity.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{activity.detail}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">
                        Henüz aktivite yok.
                      </p>
                    )}
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
                </section>
              </aside>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
