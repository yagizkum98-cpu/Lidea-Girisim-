"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Application,
  applicationFromApi,
  getApplicationProcess,
  getApplicationSubmissionCompletion,
} from "@/lib/applications";
import {
  EntrepreneurWorkspace,
  createManualStartupForEntrepreneur,
  findEntrepreneurApplication,
  findEntrepreneurStartup,
  getProgramProgress,
  readEntrepreneurMeetings,
  readEntrepreneurWorkspace,
  readProgramStages,
  saveEntrepreneurWorkspace,
  ProgramStage,
} from "@/lib/entrepreneur";
import {
  MentorAction,
  getMentorActionsForStartup,
  getMentoringMetrics,
  saveMentorAction,
} from "@/lib/mentors";
import { Notification as PlatformNotification, normalizeNotification, readNotificationsForUser } from "@/lib/notifications";
import { Startup, getStartupProfileCompletion, normalizeStartup, saveStartup } from "@/lib/startups";

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
  password?: string;
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
    password: "",
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
  const [programStages, setProgramStages] = useState<ProgramStage[]>([]);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [mentorActions, setMentorActions] = useState<MentorAction[]>([]);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [loginError, setLoginError] = useState("");
  const [notice, setNotice] = useState("");

  async function syncForUser(user: PortalUser) {
    if (user.role === "Girişimci") {
      try {
        const response = await fetch("/api/entrepreneur/me", { cache: "no-store" });
        if (response.ok) {
          const result = (await response.json()) as {
            application: Record<string, unknown> | null;
            startup: Record<string, unknown> | null;
            notifications: Record<string, unknown>[];
          };
          const remoteApplication = result.application ? applicationFromApi(result.application) : null;
          setApplication(remoteApplication);
          setStartup(
            result.startup
              ? normalizeStartup({
                  ...result.startup,
                  founder: remoteApplication?.founder || "",
                  traction: remoteApplication?.traction || "",
                })
              : null,
          );
          const typeMap: Record<string, PlatformNotification["type"]> = {
            ANNOUNCEMENT: "Duyuru",
            REMINDER: "Hatırlatma",
            STATUS_UPDATE: "Durum Güncellemesi",
            DOCUMENT_TASK: "Belge / Görev",
            EVENT: "Etkinlik",
          };
          setNotifications(
            result.notifications.map((item) =>
              normalizeNotification({
                ...item,
                type: typeMap[String(item.type)] || "Duyuru",
                status: "Gönderildi",
                recipients: Array.isArray(item.recipients)
                  ? item.recipients.map((recipient) => {
                      const value = recipient as Record<string, unknown>;
                      return {
                        name: user.name,
                        email: String(value.email || user.email),
                        role: "Girişimci",
                        sourceId: String(value.id || ""),
                        read: Boolean(value.readAt),
                        readAt: String(value.readAt || ""),
                      };
                    })
                  : [],
              }),
            ),
          );
          setWorkspace(readEntrepreneurWorkspace(user.email));
          setProgramStages(readProgramStages());
          return;
        }
      } catch {
        // The local workspace remains available while the database is offline.
      }
    }
    const currentStartup = findEntrepreneurStartup(user.email);
    setApplication(findEntrepreneurApplication(user.email));
    setStartup(currentStartup);
    setWorkspace(readEntrepreneurWorkspace(user.email));
    setProgramStages(readProgramStages());
    setMentorActions(getMentorActionsForStartup(currentStartup));
    setNotifications(readNotificationsForUser(user.email, user.role));
  }

  useEffect(() => {
    const sessionEmail = window.localStorage.getItem(entrepreneurSessionKey);
    const sessionUser = getUsers().find((user) => user.email === sessionEmail);
    if (sessionUser && ["Girişimci", "Süper Admin", "Admin", "Program Yetkilisi"].includes(sessionUser.role)) {
      setActiveUser(sessionUser);
      syncForUser(sessionUser);
    } else if (sessionEmail) {
      const entrepreneur = { name: sessionEmail.split("@")[0], email: sessionEmail, role: "Girişimci" as const };
      setActiveUser(entrepreneur);
      syncForUser(entrepreneur);
    }

    const sync = () => {
      const email = window.localStorage.getItem(entrepreneurSessionKey);
      const currentUser = getUsers().find((user) => user.email === email);
      if (currentUser) syncForUser(currentUser);
      else if (email) syncForUser({ name: email.split("@")[0], email, role: "Girişimci" });
    };
    const events = [
      "storage",
      "focus",
      "lidea-applications-updated",
      "lidea-startups-updated",
      "lidea-entrepreneur-workspaces-updated",
      "lidea-program-updated",
      "lidea-notifications-updated",
      "lidea-mentor-meetings-updated",
      "lidea-mentor-actions-updated",
    ];
    events.forEach((event) => window.addEventListener(event, sync));
    return () => events.forEach((event) => window.removeEventListener(event, sync));
  }, []);

  const meetings = useMemo(() => readEntrepreneurMeetings(startup), [startup]);
  const profileCompletion = useMemo(() => getStartupProfileCompletion(startup), [startup]);
  const progress = startup ? profileCompletion.percent : (workspace?.progress ?? 0);
  const applicationCompletion = useMemo(
    () => getApplicationSubmissionCompletion(application),
    [application],
  );
  const applicationProcess = useMemo(() => getApplicationProcess(application), [application]);
  const programProgress = useMemo(() => getProgramProgress(workspace), [workspace]);
  const currentProgramStage =
    programStages.find((stage) => stage.active) || programStages[0] || null;
  const mentoringMetrics = useMemo(
    () => getMentoringMetrics(startup, meetings, mentorActions),
    [meetings, mentorActions, startup],
  );
  const nextMentorMeeting = meetings
    .filter((meeting) => meeting.status === "Planlandı")
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
  const nextMeeting = meetings.find((meeting) => meeting.status === "Planlandı");
  const unreadCount = notifications.reduce(
    (sum, notification) =>
      sum +
      notification.recipients.filter(
        (recipient) => activeUser && recipient.email.toLowerCase() === activeUser.email.toLowerCase() && !recipient.read,
      ).length,
    0,
  );

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const user = getUsers().find(
      (item) => item.email.toLowerCase() === email && item.password === password && item.status !== "Pasif",
    );

    try {
      const response = await fetch("/api/auth/entrepreneur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const result = (await response.json()) as { user: PortalUser };
        window.localStorage.setItem(entrepreneurSessionKey, result.user.email);
        setActiveUser(result.user);
        await syncForUser(result.user);
        setLoginError("");
        return;
      }
    } catch {
      // Local admin login remains available while the database is offline.
    }

    if (!user || !["Girişimci", "Süper Admin", "Admin", "Program Yetkilisi"].includes(user.role)) {
      setLoginError("Bu panele giriş için admin tarafından tanımlanmış girişimci hesabı gerekir.");
      return;
    }

    window.localStorage.setItem(entrepreneurSessionKey, user.email);
    setActiveUser(user);
    syncForUser(user);
    setLoginError("");
  }

  async function logout() {
    await fetch("/api/auth/entrepreneur", { method: "DELETE" });
    window.localStorage.removeItem(entrepreneurSessionKey);
    setActiveUser(null);
    setApplication(null);
    setStartup(null);
    setWorkspace(null);
  }

  async function markNotificationRead(notification: PlatformNotification) {
    if (!activeUser) return;
    const recipient = notification.recipients.find(
      (item) => item.email.toLowerCase() === activeUser.email.toLowerCase(),
    );
    if (!recipient || recipient.read) return;
    const response = await fetch(`/api/notifications/${notification.id}/read`, { method: "PATCH" });
    if (response.ok) await syncForUser(activeUser);
  }

  function saveWorkspace(nextWorkspace: EntrepreneurWorkspace, message: string) {
    const updated = { ...nextWorkspace, updatedAt: new Date().toISOString() };
    saveEntrepreneurWorkspace(updated);
    setWorkspace(updated);
    setNotice(message);
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
    const completedStartup = {
      ...nextStartup,
      progress: getStartupProfileCompletion(nextStartup).percent,
    };
    saveStartup(completedStartup);
    setStartup(completedStartup);
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
            status: String(form.get("status") || "Bekliyor") as EntrepreneurWorkspace["tasks"][number]["status"],
            progress: "0/1",
          },
          ...workspace.tasks,
        ],
      },
      "Görev eklendi.",
    );
    event.currentTarget.reset();
  }

  function updateTaskStatus(taskId: string, status: EntrepreneurWorkspace["tasks"][number]["status"]) {
    if (!workspace) return;
    saveWorkspace(
      {
        ...workspace,
        tasks: workspace.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status,
                progress: status === "Tamamlandı" ? "1/1" : "0/1",
              }
            : task,
        ),
      },
      "Görev durumu güncellendi.",
    );
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

  function completeMentorAction(action: MentorAction) {
    const updatedAction = {
      ...action,
      status: "Tamamlandı" as const,
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    saveMentorAction(updatedAction);
    setMentorActions((actions) =>
      actions.map((item) => (item.id === action.id ? updatedAction : item)),
    );
    setNotice("Mentor aksiyonu tamamlandı.");
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
                  <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan-700">Profil Tamamlama</p>
                  <h2 className="mt-2 text-5xl font-black">%{progress}</h2>
                </div>
                <div className="rounded-md bg-slate-50 px-4 py-3 text-sm font-black text-slate-600">
                  {profileCompletion.completedCount} / {profileCompletion.totalCount} alan dolu
                </div>
              </div>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-[#063f46] via-cyan-600 to-[#8ad66f] transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-5">
                {profileCompletion.items.map((item, index) => (
                  <div key={item.label} className={`rounded-md border p-4 ${item.completed ? "border-cyan-200 bg-cyan-50 text-cyan-950" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                    <p className="text-xl font-black">{item.completed ? "✓" : index + 1}</p>
                    <p className="mt-2 text-sm font-bold">{item.label}</p>
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
                    <div className="mt-5 rounded-md bg-[#063f46] p-4 text-white">
                      <p className="text-sm font-bold text-white/70">Başvuru Durumu</p>
                      <p className="mt-2 text-2xl font-black">{applicationProcess.statusLabel}</p>
                      <p className="mt-2 text-sm leading-6 text-white/75">{applicationProcess.description}</p>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {[
                        [applicationCompletion.percent, "Başvuru Doluluğu", `${applicationCompletion.completedCount} / ${applicationCompletion.totalCount} alan dolu`],
                        [applicationProcess.percent, "Süreç İlerlemesi", application?.updatedAt?.slice(0, 10) || "Henüz güncelleme yok"],
                      ].map(([value, label, sub]) => (
                        <div key={label} className="rounded-md bg-slate-50 p-4">
                          <p className="text-3xl font-black">%{value}</p>
                          <p className="mt-1 text-xs font-bold uppercase tracking-[.12em] text-slate-500">{label}</p>
                          <p className="mt-2 text-xs font-semibold text-cyan-800">{sub}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-cyan-700 transition-all" style={{ width: `${applicationProcess.percent}%` }} />
                    </div>
                    <div className="mt-5 grid gap-2">
                      {applicationProcess.steps.map((step, index) => (
                        <div key={step.label} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-md bg-slate-50 p-3 text-sm">
                          <span className="font-black text-cyan-800">{String(index + 1).padStart(2, "0")}</span>
                          <span className="font-bold">{step.label}</span>
                          <span className="text-xs font-black text-slate-500">{step.state}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 space-y-3">
                      {[
                        ["Başvuru No", application?.applicationNumber || "-"],
                        ["Başvuru Tarihi", application?.submittedAt || "-"],
                        ["Durum", application?.status || "Başvuru yok"],
                        ["Dönem", application?.period || "3. Dönem"],
                        ["Program", application?.programTrack || "Henüz seçilmedi"],
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
                    <div className="mt-5 rounded-md bg-[#063f46] p-4 text-white">
                      <p className="text-sm font-bold text-white/70">Program İlerlemesi</p>
                      <p className="mt-2 text-4xl font-black">%{programProgress.percent}</p>
                      <p className="mt-2 text-sm text-white/75">
                        {programProgress.completedTasks} / {programProgress.totalTasks} görev tamamlandı
                      </p>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-cyan-700 transition-all" style={{ width: `${programProgress.percent}%` }} />
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-md bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">Şu Anki Aşama</p>
                        <p className="mt-2 font-black">{currentProgramStage?.title || "Aşama tanımlanmadı"}</p>
                        <p className="mt-1 text-xs text-slate-500">{currentProgramStage?.endDate || "Tarih yok"}</p>
                      </div>
                      <div className="rounded-md bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">Sıradaki Adım</p>
                        <p className="mt-2 font-black">{programProgress.nextTask?.title || "Görev yok"}</p>
                        <p className="mt-1 text-xs text-slate-500">{programProgress.nextTask?.dueDate || "Tarih yok"}</p>
                      </div>
                    </div>
                    {programProgress.overdueTasks.length ? (
                      <p className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-black text-orange-800">
                        {programProgress.overdueTasks.length} geciken görev var.
                      </p>
                    ) : null}
                    <div className="mt-5 grid gap-2">
                      {programStages.length ? (
                        programStages.map((stage, index) => (
                          <div key={stage.id} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-md bg-slate-50 p-3 text-sm">
                            <span className="font-black text-cyan-800">{String(index + 1).padStart(2, "0")}</span>
                            <span className="font-bold">{stage.title}</span>
                            <span className="text-xs font-black text-slate-500">{stage.active ? "Aktif" : "Pasif"}</span>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">Henüz canlı program aşaması yok.</p>
                      )}
                    </div>
                    <div className="mt-5 space-y-3">
                      {workspace?.tasks.length ? (
                        workspace.tasks.map((task) => (
                          <div key={task.id} className="rounded-md bg-slate-50 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-black">{task.title}</p>
                                <p className="mt-1 text-xs text-slate-500">{task.dueDate || "Tarih yok"}</p>
                              </div>
                              <select
                                className={inputClass}
                                value={task.status}
                                onChange={(event) =>
                                  updateTaskStatus(task.id, event.target.value as EntrepreneurWorkspace["tasks"][number]["status"])
                                }
                              >
                                <option>Bekliyor</option>
                                <option>Devam Ediyor</option>
                                <option>Tamamlandı</option>
                              </select>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">Henüz canlı görev yok.</p>
                      )}
                    </div>
                    <form onSubmit={addTask} className="mt-4 grid gap-3">
                      <input name="title" className={inputClass} placeholder="Görev başlığı" />
                      <input name="dueDate" type="date" className={inputClass} />
                      <select name="status" className={inputClass} defaultValue="Bekliyor">
                        <option>Bekliyor</option>
                        <option>Devam Ediyor</option>
                        <option>Tamamlandı</option>
                      </select>
                      <button className="h-11 rounded-md bg-cyan-700 px-4 text-sm font-bold text-white">Görev Ekle</button>
                    </form>
                  </article>
                </section>
              </div>

              <aside className="space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-black">Mentorluk</h2>
                  {startup?.mentor ? (
                    <>
                      <div className="mt-4 rounded-md bg-[#063f46] p-4 text-white">
                        <p className="text-sm font-bold text-white/70">Ana Mentorum</p>
                        <p className="mt-2 text-xl font-black">{startup.mentor.mentorName}</p>
                        <p className="mt-1 text-sm text-white/70">
                          {startup.mentor.expertise || "Mentorluk alanı girilmedi"}
                        </p>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {[
                          [
                            mentoringMetrics.meetingPercent,
                            "Görüşme",
                            `${mentoringMetrics.completedMeetings} / ${mentoringMetrics.targetMeetings || 0}`,
                          ],
                          [
                            mentoringMetrics.actionPercent,
                            "Aksiyon",
                            `${mentoringMetrics.completedActions} / ${mentoringMetrics.totalActions}`,
                          ],
                        ].map(([value, label, sub]) => (
                          <div key={label} className="rounded-md bg-slate-50 p-4">
                            <p className="text-2xl font-black">%{value}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[.12em] text-slate-500">{label}</p>
                            <p className="mt-2 text-xs font-black text-cyan-800">{sub}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-cyan-700 transition-all" style={{ width: `${mentoringMetrics.meetingPercent}%` }} />
                      </div>
                      <div className="mt-4 rounded-md bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">Sonraki Görüşme</p>
                        <p className="mt-2 font-black">
                          {nextMentorMeeting ? nextMentorMeeting.topic || "Konu girilmedi" : "Planlı görüşme yok"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {nextMentorMeeting ? `${nextMentorMeeting.date} ${nextMentorMeeting.time}` : "Mentor görüşme eklediğinde görünür."}
                        </p>
                      </div>
                      {mentoringMetrics.overdueActions.length ? (
                        <p className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-black text-orange-800">
                          {mentoringMetrics.overdueActions.length} geciken mentor aksiyonu var.
                        </p>
                      ) : null}
                      <div className="mt-4 space-y-2">
                        {mentorActions.length ? (
                          mentorActions.map((action) => (
                            <div key={action.id} className="rounded-md bg-slate-50 p-3 text-sm">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="font-black">{action.title || "Mentor aksiyonu"}</p>
                                  <p className="mt-1 text-xs text-slate-500">{action.deadline || "Tarih yok"} / {action.status}</p>
                                </div>
                                {action.status !== "Tamamlandı" ? (
                                  <button
                                    type="button"
                                    onClick={() => completeMentorAction(action)}
                                    className="h-9 rounded-md bg-cyan-700 px-3 text-xs font-black text-white"
                                  >
                                    Tamamla
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">Henüz canlı mentor aksiyonu yok.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="mt-4 rounded-md bg-slate-50 p-4">
                      <p className="text-sm font-black">Mentor eşleştirmesi bekleniyor</p>
                      <p className="mt-2 text-sm text-slate-500">Mentor ataması yapılınca görüşme ve aksiyon sayaçları canlı olarak artar.</p>
                    </div>
                  )}
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
                        <button
                          type="button"
                          key={notification.id}
                          onClick={() => markNotificationRead(notification)}
                          className="w-full rounded-md border border-cyan-100 bg-cyan-50 p-3 text-left"
                        >
                          <p className="text-sm font-black">{notification.title}</p>
                          <p className="mt-1 text-xs text-cyan-900">{notification.sentAt || notification.createdAt}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{notification.message}</p>
                        </button>
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
