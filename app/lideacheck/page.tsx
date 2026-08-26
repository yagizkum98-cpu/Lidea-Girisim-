"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { readAdminUsers, AdminUserRecord } from "@/lib/settings";
import { syncAcceptedApplicationsToStartups, Startup } from "@/lib/startups";
import {
  AttendanceRecord,
  DemoDayCandidate,
  DemoDayDecision,
  attendanceStats,
  attendanceStatuses,
  defaultDemoDayAnnouncement,
  lideaCheckTracks,
  readAttendanceRecords,
  readDemoDayCandidates,
  writeAttendanceRecords,
  writeDemoDayCandidates,
} from "@/lib/lideacheck";

type CheckUser = AdminUserRecord & { role: string };

const sessionKey = "lidea-check-session";
const allowedRoles = ["Süper Admin", "Yoklama Yetkilisi"];

const initialUsers: CheckUser[] = [
  {
    name: "Süper Admin",
    email: "admin@lideagirisim.com",
    password: "lideagirisimsuperadmin123",
    role: "Süper Admin",
    status: "Aktif",
  },
];

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-cyan-600";

function readCheckUsers() {
  const users = readAdminUsers();
  return users.length ? users : initialUsers;
}

function getStartupName(startups: Startup[], startupId: string) {
  return startups.find((startup) => startup.id === startupId)?.name || "Girişim";
}

export default function LideaCheckPage() {
  const [activeUser, setActiveUser] = useState<CheckUser | null>(null);
  const [loginError, setLoginError] = useState("");
  const [notice, setNotice] = useState("");
  const [startups, setStartups] = useState<Startup[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [demoDay, setDemoDay] = useState<DemoDayCandidate[]>([]);

  useEffect(() => {
    const savedSession = window.localStorage.getItem(sessionKey);
    if (savedSession) {
      try {
        const sessionUser = JSON.parse(savedSession) as CheckUser;
        if (allowedRoles.includes(sessionUser.role)) setActiveUser(sessionUser);
      } catch {
        window.localStorage.removeItem(sessionKey);
      }
    }

    const sync = () => {
      setStartups(syncAcceptedApplicationsToStartups());
      setAttendance(readAttendanceRecords());
      setDemoDay(readDemoDayCandidates());
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("lidea-check-updated", sync);
    window.addEventListener("lidea-startups-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("lidea-check-updated", sync);
      window.removeEventListener("lidea-startups-updated", sync);
    };
  }, []);

  const stats = useMemo(() => attendanceStats(attendance), [attendance]);
  const preStats = useMemo(() => attendanceStats(attendance, "Ön Kuluçka"), [attendance]);
  const incubationStats = useMemo(() => attendanceStats(attendance, "Kuluçka"), [attendance]);
  const trackStatCards = [
    { track: "Ön Kuluçka", stats: preStats },
    { track: "Kuluçka", stats: incubationStats },
  ];
  const activeDemoDayList = demoDay.filter((candidate) => candidate.status !== "Reddedildi");
  const rejectedDemoDayList = demoDay.filter((candidate) => candidate.status === "Reddedildi");

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const user = readCheckUsers().find(
      (item) =>
        item.email.toLowerCase() === email &&
        item.password === password &&
        allowedRoles.includes(item.role) &&
        item.status !== "Pasif",
    );

    if (!user) {
      setLoginError("Bu panele sadece Süper Admin veya tanımlı Yoklama Yetkilisi giriş yapabilir.");
      return;
    }

    window.localStorage.setItem(sessionKey, JSON.stringify(user));
    setActiveUser(user);
    setLoginError("");
  }

  function logout() {
    window.localStorage.removeItem(sessionKey);
    setActiveUser(null);
  }

  function createAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startupId = String(form.get("startupId") || "");
    if (!startupId) {
      setNotice("Yoklama için önce bir girişim seçin.");
      return;
    }

    const nextRecord = {
      id: crypto.randomUUID(),
      startupId,
      startupName: getStartupName(startups, startupId),
      track: String(form.get("track") || "Ön Kuluçka") as AttendanceRecord["track"],
      week: Math.max(1, Number(form.get("week") || 1)),
      date: String(form.get("date") || new Date().toISOString().slice(0, 10)),
      quota: Math.max(0, Number(form.get("quota") || 0)),
      status: String(form.get("status") || "Geldi") as AttendanceRecord["status"],
      note: String(form.get("note") || ""),
      createdAt: new Date().toISOString(),
    } satisfies AttendanceRecord;

    const nextAttendance = [nextRecord, ...attendance];
    writeAttendanceRecords(nextAttendance);
    setAttendance(nextAttendance);
    setNotice("Yoklama kaydı eklendi. Sayılar otomatik güncellendi.");
    event.currentTarget.reset();
  }

  function createDemoDayCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startupId = String(form.get("startupId") || "");
    if (!startupId) {
      setNotice("Demo Day adayı için girişim seçin.");
      return;
    }

    const nextCandidate = {
      id: crypto.randomUUID(),
      startupId,
      startupName: getStartupName(startups, startupId),
      track: String(form.get("track") || "Ön Kuluçka") as DemoDayCandidate["track"],
      week: Math.max(1, Number(form.get("week") || 1)),
      status: "Aday",
      note: String(form.get("note") || ""),
      announcement: defaultDemoDayAnnouncement("Aday"),
      decidedAt: "",
      createdAt: new Date().toISOString(),
    } satisfies DemoDayCandidate;

    const nextDemoDay = [nextCandidate, ...demoDay];
    writeDemoDayCandidates(nextDemoDay);
    setDemoDay(nextDemoDay);
    setNotice("Girişim Demo Day son aşama aday listesine eklendi.");
    event.currentTarget.reset();
  }

  function decideDemoDayCandidate(candidateId: string, status: DemoDayDecision) {
    const nextDemoDay = demoDay.map((candidate) =>
      candidate.id === candidateId
        ? {
            ...candidate,
            status,
            announcement: defaultDemoDayAnnouncement(status),
            decidedAt: new Date().toISOString(),
          }
        : candidate,
    );
    writeDemoDayCandidates(nextDemoDay);
    setDemoDay(nextDemoDay);
    setNotice(status === "Reddedildi" ? "Girişim reddedilenler tarafına alındı ve stant mesajı oluşturuldu." : "Girişim Demo Day listesinde onaylandı.");
  }

  if (!activeUser) {
    return (
      <main className="min-h-screen bg-[#f6fbfc] px-6 py-10 text-slate-950">
        <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(0,86,102,.12)]">
          <Link href="/" className="text-sm font-black text-cyan-800">← Ana sayfa</Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-cyan-700">LideaCheck</p>
          <h1 className="mt-2 text-3xl font-black">Akıllı Yoklama Paneli</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Süper Admin ve ayarlardan tanımlanan Yoklama Yetkilisi dışında giriş kapalıdır.
          </p>
          {loginError ? <p className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{loginError}</p> : null}
          <form onSubmit={login} className="mt-6 grid gap-3">
            <input name="email" type="email" className={inputClass} placeholder="E-posta" />
            <input name="password" type="password" className={inputClass} placeholder="Şifre" />
            <button className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">
              Panele Gir
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6fbfc] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">LideaCheck</p>
            <h1 className="mt-1 text-3xl font-black">Akıllı Yoklama Paneli</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-slate-500">{activeUser.name} · {activeUser.role}</p>
            <button onClick={logout} className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold">
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        {notice ? <p className="mb-6 rounded-md border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">{notice}</p> : null}

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Toplam Yoklama", stats.total],
            ["Geldi", stats.present],
            ["Gelmedi", stats.absent],
            ["Kota", stats.quota],
          ].map(([label, value]) => (
            <article className="rounded-lg border border-slate-200 bg-white p-5" key={label}>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">{label}</p>
              <p className="mt-3 text-4xl font-black text-[#063f46]">{value}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="grid gap-6">
            <form onSubmit={createAttendance} className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-black">Haftalık Manuel Yoklama</h2>
              <div className="mt-4 grid gap-3">
                <select name="startupId" className={inputClass} defaultValue="">
                  <option value="">Girişim seç</option>
                  {startups.map((startup) => <option value={startup.id} key={startup.id}>{startup.name}</option>)}
                </select>
                <div className="grid gap-3 sm:grid-cols-2">
                  <select name="track" className={inputClass}>
                    {lideaCheckTracks.map((track) => <option key={track}>{track}</option>)}
                  </select>
                  <input name="week" type="number" min={1} className={inputClass} placeholder="Hafta" />
                  <input name="date" type="date" className={inputClass} />
                  <input name="quota" type="number" min={0} className={inputClass} placeholder="Kota" />
                </div>
                <select name="status" className={inputClass}>
                  {attendanceStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
                <input name="note" className={inputClass} placeholder="Not" />
              </div>
              <button className="mt-4 h-11 w-full rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">
                Yoklama Kaydet
              </button>
            </form>

            <form onSubmit={createDemoDayCandidate} className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-black">Demo Day Adayı Ekle</h2>
              <div className="mt-4 grid gap-3">
                <select name="startupId" className={inputClass} defaultValue="">
                  <option value="">Girişim seç</option>
                  {startups.map((startup) => <option value={startup.id} key={startup.id}>{startup.name}</option>)}
                </select>
                <div className="grid gap-3 sm:grid-cols-2">
                  <select name="track" className={inputClass}>
                    {lideaCheckTracks.map((track) => <option key={track}>{track}</option>)}
                  </select>
                  <input name="week" type="number" min={1} className={inputClass} placeholder="Son hafta" />
                </div>
                <input name="note" className={inputClass} placeholder="Adaylık notu" />
              </div>
              <button className="mt-4 h-11 w-full rounded-md bg-[#00a6c8] px-5 text-sm font-bold text-white">
                Son Aşama Listesine Ekle
              </button>
            </form>
          </div>

          <div className="grid gap-6">
            <section className="grid gap-4 md:grid-cols-2">
              {trackStatCards.map(({ track, stats: trackStats }) => (
                <article className="rounded-lg border border-slate-200 bg-white p-5" key={track}>
                  <h2 className="text-xl font-black">{track}</h2>
                  <div className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
                    <p><b className="block text-2xl">{trackStats.total}</b>Kayıt</p>
                    <p><b className="block text-2xl text-emerald-700">{trackStats.present}</b>Geldi</p>
                    <p><b className="block text-2xl text-red-700">{trackStats.absent}</b>Gelmedi</p>
                    <p><b className="block text-2xl text-cyan-800">%{trackStats.attendanceRate}</b>Oran</p>
                  </div>
                </article>
              ))}
            </section>

            <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-5">
                <h2 className="text-xl font-black">Canlı Yoklama Kayıtları</h2>
              </div>
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500">
                  <tr><th className="px-5 py-4">Hafta</th><th className="px-5 py-4">Girişim</th><th className="px-5 py-4">Alan</th><th className="px-5 py-4">Durum</th><th className="px-5 py-4">Kota</th><th className="px-5 py-4">Tarih</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.length ? attendance.map((record) => (
                    <tr key={record.id}>
                      <td className="px-5 py-4 font-black">{record.week}</td>
                      <td className="px-5 py-4">{record.startupName}</td>
                      <td className="px-5 py-4">{record.track}</td>
                      <td className={`px-5 py-4 font-black ${record.status === "Geldi" ? "text-emerald-700" : "text-red-700"}`}>{record.status}</td>
                      <td className="px-5 py-4">{record.quota}</td>
                      <td className="px-5 py-4">{record.date}</td>
                    </tr>
                  )) : <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">Henüz yoklama kaydı yok. Sistem sıfırdan başlar.</td></tr>}
                </tbody>
              </table>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-black">Demo Day Son Aşama Listesi</h2>
              <div className="mt-4 grid gap-3">
                {activeDemoDayList.length ? activeDemoDayList.map((candidate) => (
                  <article className="rounded-md bg-slate-50 p-4" key={candidate.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{candidate.startupName}</p>
                        <p className="mt-1 text-sm text-slate-500">{candidate.track} · Hafta {candidate.week} · {candidate.status}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => decideDemoDayCandidate(candidate.id, "Onaylandı")} className="h-9 rounded-md bg-emerald-700 px-3 text-xs font-black text-white">Onayla</button>
                        <button onClick={() => decideDemoDayCandidate(candidate.id, "Reddedildi")} className="h-9 rounded-md bg-slate-800 px-3 text-xs font-black text-white">Reddet</button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{candidate.announcement}</p>
                  </article>
                )) : <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">Henüz Demo Day adayı yok.</p>}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-black">Reddedilenler</h2>
              <div className="mt-4 grid gap-3">
                {rejectedDemoDayList.length ? rejectedDemoDayList.map((candidate) => (
                  <article className="rounded-md bg-slate-50 p-4" key={candidate.id}>
                    <p className="font-black">{candidate.startupName}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-600">{candidate.announcement}</p>
                  </article>
                )) : <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">Reddedilen girişim yok.</p>}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
