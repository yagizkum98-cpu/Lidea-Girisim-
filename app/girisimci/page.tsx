"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Application } from "@/lib/applications";
import {
  EntrepreneurWorkspace,
  createManualStartupForEntrepreneur,
  defaultJourney,
  findEntrepreneurApplication,
  findEntrepreneurStartup,
  readEntrepreneurMeetings,
  readEntrepreneurWorkspace,
  saveEntrepreneurWorkspace,
} from "@/lib/entrepreneur";
import { Notification as PlatformNotification, readNotificationsForUser } from "@/lib/notifications";
import { Startup, saveStartup } from "@/lib/startups";

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
  status?: string;
};

const usersStorageKey = "lidea-admin-users";
const entrepreneurSessionKey = "lidea-entrepreneur-session";
const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600";

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

const fallbackUsers: PortalUser[] = [
  {
    name: "Süper Admin",
    email: "admin@lideagirisim.com",
    password: "lideagirisimsuperadmin123",
    role: "Süper Admin",
  },
];

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

export default function EntrepreneurPanel() {
  const [activeUser, setActiveUser] = useState<PortalUser | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [workspace, setWorkspace] = useState<EntrepreneurWorkspace | null>(null);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [loginError, setLoginError] = useState("");
  const [notice, setNotice] = useState("");

  function syncForUser(user: PortalUser) {
    setApplication(findEntrepreneurApplication(user.email));
    setStartup(findEntrepreneurStartup(user.email));
    setWorkspace(readEntrepreneurWorkspace(user.email));
    setNotifications(readNotificationsForUser(user.email, user.role));
  }

  useEffect(() => {
    const sessionEmail = window.localStorage.getItem(entrepreneurSessionKey);
    const sessionUser = getUsers().find((user) => user.email === sessionEmail);
    if (sessionUser && ["Girişimci", "Süper Admin", "Admin", "Program Yetkilisi"].includes(sessionUser.role)) {
      setActiveUser(sessionUser);
      syncForUser(sessionUser);
    }

    const sync = () => {
      const email = window.localStorage.getItem(entrepreneurSessionKey);
      const currentUser = getUsers().find((user) => user.email === email);
      if (currentUser) syncForUser(currentUser);
    };
    const events = [
      "storage",
      "focus",
      "lidea-applications-updated",
      "lidea-startups-updated",
      "lidea-entrepreneur-workspaces-updated",
      "lidea-notifications-updated",
      "lidea-mentor-meetings-updated",
    ];
    events.forEach((event) => window.addEventListener(event, sync));
    return () => events.forEach((event) => window.removeEventListener(event, sync));
  }, []);

  const meetings = useMemo(() => readEntrepreneurMeetings(startup), [startup]);
  const progress = startup?.progress ?? workspace?.progress ?? 0;
  const completedSteps = Math.round((progress / 100) * defaultJourney.length);
  const nextMeeting = meetings.find((meeting) => meeting.status === "Planlandı");
  const unreadCount = notifications.reduce(
    (sum, notification) =>
      sum +
      notification.recipients.filter(
        (recipient) => activeUser && recipient.email.toLowerCase() === activeUser.email.toLowerCase() && !recipient.read,
      ).length,
    0,
  );

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const user = getUsers().find(
      (item) => item.email.toLowerCase() === email && item.password === password && item.status !== "Pasif",
    );

    if (!user || !["Girişimci", "Süper Admin", "Admin", "Program Yetkilisi"].includes(user.role)) {
      setLoginError("Bu panele giriş için admin tarafından tanımlanmış girişimci hesabı gerekir.");
      return;
    }

    window.localStorage.setItem(entrepreneurSessionKey, user.email);
    setActiveUser(user);
    syncForUser(user);
    setLoginError("");
  }

  function logout() {
    window.localStorage.removeItem(entrepreneurSessionKey);
    setActiveUser(null);
    setApplication(null);
    setStartup(null);
    setWorkspace(null);
  }

  function saveWorkspace(nextWorkspace: EntrepreneurWorkspace, message: string) {
    const updated = { ...nextWorkspace, updatedAt: new Date().toISOString() };
    saveEntrepreneurWorkspace(updated);
    setWorkspace(updated);
    setNotice(message);
  }

  function updateProgress(value: number) {
    if (startup) {
      const nextStartup = { ...startup, progress: value, updatedAt: new Date().toISOString() };
      saveStartup(nextStartup);
      setStartup(nextStartup);
    }
    if (workspace) saveWorkspace({ ...workspace, progress: value }, "Program ilerlemesi güncellendi.");
  }

  function saveStartupProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!startup) return;
    const form = new FormData(event.currentTarget);
    const nextStartup = {
      ...startup,
      name: String(form.get("name") || ""),
      logo: String(form.get("logo") || ""),
      website: String(form.get("website") || ""),
      sector: String(form.get("sector") || ""),
      stage: String(form.get("stage") || ""),
      problem: String(form.get("problem") || ""),
      solution: String(form.get("solution") || ""),
      businessModel: String(form.get("businessModel") || ""),
      traction: String(form.get("traction") || ""),
      updatedAt: new Date().toISOString(),
    };
    saveStartup(nextStartup);
    setStartup(nextStartup);
    setNotice("Girişim profili kaydedildi.");
  }

  function createManualStartup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeUser) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    if (!name) {
      setNotice("Girişim adı zorunludur.");
      return;
    }
    const created = createManualStartupForEntrepreneur(activeUser.email, activeUser.name, name);
    setStartup(created);
    setWorkspace(readEntrepreneurWorkspace(activeUser.email));
    setNotice("Manuel girişim çalışma alanı oluşturuldu.");
    event.currentTarget.reset();
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    const form = new FormData(event.currentTarget);
    saveWorkspace(
      {
        ...workspace,
        tasks: [
          {
            id: crypto.randomUUID(),
            title: String(form.get("title") || ""),
            dueDate: String(form.get("dueDate") || ""),
            status: "Bekliyor",
            progress: "0/1",
          },
          ...workspace.tasks,
        ],
      },
      "Görev eklendi.",
    );
    event.currentTarget.reset();
  }

  function addDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    const form = new FormData(event.currentTarget);
    saveWorkspace(
      {
        ...workspace,
        documents: [
          {
            id: crypto.randomUUID(),
            type: String(form.get("type") || "Belge"),
            fileName: String(form.get("fileName") || ""),
            fileUrl: "#",
            uploadedAt: new Date().toISOString().slice(0, 10),
          },
          ...workspace.documents,
        ],
      },
      "Belge kaydı eklendi.",
    );
    event.currentTarget.reset();
  }

  if (!activeUser) {
    return (
      <main className="min-h-screen bg-[#f6fbfc] px-6 py-10 text-slate-950">
        <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_.9fr]">
          <div>
            <img src="/lidea-logo.svg" alt="Lidea" className="h-16 w-auto" />
            <h1 className="mt-10 max-w-xl text-5xl font-black tracking-tight">Girişimci Paneli</h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              Admin tarafından tanımlanan girişimci hesabıyla program durumunuzu, başvurunuzu,
              mentorluğu, dokümanları ve bildirimleri canlı takip edin.
            </p>
          </div>
          <form onSubmit={login} className="rounded-lg border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,.08)]">
            <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan-700">Yetkili Giriş</p>
            <h2 className="mt-3 text-3xl font-black">Tanımlı girişimci hesabı</h2>
            <label className="mt-8 block text-sm font-bold">
              E-posta
              <input name="email" type="email" className={`${inputClass} mt-2 w-full`} />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Şifre
              <input name="password" type="password" className={`${inputClass} mt-2 w-full`} />
            </label>
            {loginError ? <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{loginError}</p> : null}
            <button className="mt-6 h-12 w-full rounded-md bg-[#063f46] px-5 font-bold text-white">Giriş Yap</button>
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
            <p className="mt-4 text-xs font-bold uppercase tracking-[.18em] text-cyan-700">Girişimci Paneli</p>
          </div>
          <nav className="grid gap-1 p-3">
            {menu.map((item) => (
              <button
                key={item}
                onClick={() => setActiveMenu(item)}
                className={`rounded-md px-3 py-2.5 text-left text-sm font-semibold transition ${activeMenu === item ? "bg-[#063f46] text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {item === "Bildirimler" ? `Bildirimler (${unreadCount})` : item}
              </button>
            ))}
          </nav>
        </aside>

        <section>
          <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">{activeMenu}</p>
              <h1 className="mt-1 text-2xl font-black">{startup?.name || "Girişim çalışma alanı"}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-black">{activeUser.name}</p>
                <p className="text-xs text-slate-500">{activeUser.email}</p>
              </div>
              <button onClick={logout} className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold">Çıkış</button>
            </div>
          </header>

          <div className="space-y-6 p-6">
            {notice ? <p className="rounded-md border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">{notice}</p> : null}

            {!startup ? (
              <section className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-black">Canlı girişim kaydı bulunamadı</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Admin başvuruyu kabul ettiğinde girişim kaydı otomatik oluşur. İsterseniz bu hesap için manuel çalışma alanı oluşturabilirsiniz.
                </p>
                <form onSubmit={createManualStartup} className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                  <input name="name" className={inputClass} placeholder="Girişim adı" />
                  <button className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">Manuel Oluştur</button>
                </form>
              </section>
            ) : null}

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan-700">Program İlerlemesi</p>
                  <h2 className="mt-2 text-5xl font-black">%{progress}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <input aria-label="Program ilerleme yüzdesi" type="range" min="0" max="100" value={progress} onChange={(event) => updateProgress(Number(event.target.value))} className="w-52 accent-cyan-700" />
                  <button onClick={() => updateProgress(0)} className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold">Sıfırla</button>
                </div>
              </div>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-[#063f46] via-cyan-600 to-[#8ad66f] transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-7">
                {defaultJourney.map((step, index) => (
                  <div key={step} className={`rounded-md border p-4 ${index < completedSteps && progress > 0 ? "border-cyan-200 bg-cyan-50 text-cyan-950" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                    <p className="text-xl font-black">{index < completedSteps && progress > 0 ? "✓" : index + 1}</p>
                    <p className="mt-2 text-sm font-bold">{step}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-6">
                  <h2 className="text-xl font-black">Girişimim</h2>
                  {startup ? (
                    <form onSubmit={saveStartupProfile} className="mt-5 grid gap-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <input name="name" defaultValue={startup.name} className={inputClass} placeholder="Girişim adı" />
                        <input name="logo" defaultValue={startup.logo} className={inputClass} placeholder="Logo" />
                        <input name="website" defaultValue={startup.website} className={inputClass} placeholder="Web sitesi" />
                        <input name="sector" defaultValue={startup.sector} className={inputClass} placeholder="Sektör" />
                        <input name="stage" defaultValue={startup.stage} className={inputClass} placeholder="Aşama" />
                      </div>
                      {[
                        ["problem", "Problem", startup.problem],
                        ["solution", "Çözüm", startup.solution],
                        ["businessModel", "İş Modeli", startup.businessModel],
                        ["traction", "Traction", startup.traction],
                      ].map(([name, placeholder, value]) => (
                        <textarea key={name} name={name} defaultValue={value} rows={3} className="rounded-md border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-600" placeholder={placeholder} />
                      ))}
                      <button className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white md:w-fit">Profili Kaydet</button>
                    </form>
                  ) : (
                    <p className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-500">Girişim profili için önce canlı veya manuel girişim kaydı gerekir.</p>
                  )}
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                  <article className="rounded-lg border border-slate-200 bg-white p-6">
                    <h2 className="text-xl font-black">Başvurum</h2>
                    <div className="mt-5 space-y-3">
                      {[
                        ["Başvuru No", application?.applicationNumber || "-"],
                        ["Başvuru Tarihi", application?.submittedAt || "-"],
                        ["Durum", application?.status || "Başvuru yok"],
                        ["Dönem", application?.period || "3. Dönem"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-md bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">{label}</p>
                          <p className="mt-2 font-black">{value}</p>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-lg border border-slate-200 bg-white p-6">
                    <h2 className="text-xl font-black">Programım</h2>
                    <div className="mt-5 space-y-3">
                      {workspace?.tasks.length ? (
                        workspace.tasks.map((task) => (
                          <div key={task.id} className="rounded-md bg-slate-50 p-4">
                            <p className="text-sm font-black">{task.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{task.status} / {task.dueDate || "Tarih yok"}</p>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">Henüz canlı görev yok.</p>
                      )}
                    </div>
                    <form onSubmit={addTask} className="mt-4 grid gap-3">
                      <input name="title" className={inputClass} placeholder="Görev başlığı" />
                      <input name="dueDate" type="date" className={inputClass} />
                      <button className="h-11 rounded-md bg-cyan-700 px-4 text-sm font-bold text-white">Görev Ekle</button>
                    </form>
                  </article>
                </section>
              </div>

              <aside className="space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-black">Mentorluk</h2>
                  <div className="mt-4 rounded-md bg-[#063f46] p-4 text-white">
                    <p className="text-sm font-bold">Mentorum</p>
                    <p className="mt-2 text-xl font-black">{startup?.mentor?.mentorName || "Atanmadı"}</p>
                    <p className="mt-1 text-sm text-white/70">
                      {nextMeeting ? `${nextMeeting.date} ${nextMeeting.time} / ${nextMeeting.topic}` : "Planlı görüşme yok"}
                    </p>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-black">Dokümanlar</h2>
                  <div className="mt-4 space-y-2">
                    {[...(startup?.documents || []), ...(workspace?.documents || [])].length ? (
                      [...(startup?.documents || []), ...(workspace?.documents || [])].map((document) => (
                        <div key={document.id} className="rounded-md bg-slate-50 p-3 text-sm">
                          <p className="font-black">{document.type}</p>
                          <p className="mt-1 text-slate-500">{document.fileName}</p>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">Henüz belge yok.</p>
                    )}
                  </div>
                  <form onSubmit={addDocument} className="mt-4 grid gap-3">
                    <input name="type" className={inputClass} placeholder="Belge türü" />
                    <input name="fileName" className={inputClass} placeholder="Dosya adı" />
                    <button className="h-11 rounded-md bg-cyan-700 px-4 text-sm font-bold text-white">Belge Ekle</button>
                  </form>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-black">Bildirimler</h2>
                    <span className="rounded-md bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-800">{unreadCount}</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {notifications.length ? (
                      notifications.map((notification) => (
                        <div key={notification.id} className="rounded-md border border-cyan-100 bg-cyan-50 p-3">
                          <p className="text-sm font-black">{notification.title}</p>
                          <p className="mt-1 text-xs text-cyan-900">{notification.sentAt || notification.createdAt}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{notification.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">Henüz bildirim yok.</p>
                    )}
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-black">Pitch Deck & Demo Day</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Durum: {workspace?.pitchDeckStatus || "Bekliyor"} / Demo Day: {startup?.status === "Demo Day Hazır" ? "Hazır" : "Hazırlanıyor"}
                  </p>
                </section>
              </aside>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
