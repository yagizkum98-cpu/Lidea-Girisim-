"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ReportsSnapshot, createReportsMetrics, readReportsSnapshot, toCsv } from "@/lib/reports";

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-cyan-600";

const sidebarLinks = [
  ["Dashboard", "/admin"],
  ["Başvurular", "/admin/basvurular"],
  ["Girişimler", "/admin/girisimler"],
  ["Değerlendiriciler", "/admin/degerlendiriciler"],
  ["Mentorlar", "/admin/mentorlar"],
  ["Jüri", "/juri"],
  ["Program", "/admin/program"],
  ["Bildirimler", "/admin/bildirimler"],
  ["Raporlar", "/admin/raporlar"],
  ["Ayarlar", "/admin/ayarlar"],
];

const emptySnapshot: ReportsSnapshot = {
  applications: [],
  startups: [],
  evaluators: [],
  mentors: [],
  notifications: [],
  mentorMeetings: [],
};

function Bars({ data }: { data: Record<string, number> }) {
  const max = Math.max(...Object.values(data), 1);
  return (
    <div className="space-y-3">
      {Object.entries(data).map(([label, value]) => (
        <div key={label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-bold">{label}</span>
            <span className="font-black">{value}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-cyan-700" style={{ width: `${Math.round((value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [snapshot, setSnapshot] = useState<ReportsSnapshot>(emptySnapshot);
  const [tab, setTab] = useState("Genel Bakış");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const sync = () => setSnapshot(readReportsSnapshot());
    sync();
    ["storage", "focus", "lidea-applications-updated", "lidea-startups-updated", "lidea-evaluators-updated", "lidea-mentors-updated", "lidea-mentor-meetings-updated", "lidea-notifications-updated"].forEach((event) =>
      window.addEventListener(event, sync),
    );
    return () =>
      ["storage", "focus", "lidea-applications-updated", "lidea-startups-updated", "lidea-evaluators-updated", "lidea-mentors-updated", "lidea-mentor-meetings-updated", "lidea-notifications-updated"].forEach((event) =>
        window.removeEventListener(event, sync),
      );
  }, []);

  const metrics = useMemo(() => createReportsMetrics(snapshot), [snapshot]);

  function downloadCsv(kind: string) {
    const rows =
      kind === "applications"
        ? snapshot.applications.map((item) => ({
            id: item.id,
            startup: item.startup,
            founder: item.founder,
            status: item.status,
            sector: item.sector,
            city: item.city,
            score: item.juryScore,
          }))
        : kind === "startups"
          ? snapshot.startups.map((item) => ({
              id: item.id,
              name: item.name,
              founder: item.founder,
              status: item.status,
              stage: item.stage,
              mentor: item.mentor?.mentorName || "",
            }))
          : snapshot.mentorMeetings.map((item) => ({
              mentor: item.mentorName,
              startup: item.startupName,
              date: item.date,
              status: item.status,
              topic: item.topic,
            }));
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `lidea-${kind}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("CSV dosyası hazırlandı.");
  }

  return (
    <main className="min-h-screen bg-[#f6fbfc] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-5">
            <p className="text-lg font-black tracking-tight">LIDEA ADMIN</p>
          </div>
          <nav className="grid gap-1 p-3 text-sm font-semibold">
            {sidebarLinks.map(([label, href]) => (
              <Link key={label} href={href} className={`rounded-md px-3 py-2.5 ${label === "Raporlar" ? "bg-[#063f46] text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {label === "Raporlar" ? "●" : label === "Ayarlar" ? "⚙" : "▣"} {label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">Lidea Girişim Programı / 3. Dönem</p>
              <h1 className="mt-1 text-3xl font-black">Raporlar</h1>
              <p className="mt-2 text-sm text-slate-500">Canlı veri ve dışa aktarım</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input className={inputClass} type="date" />
              <input className={inputClass} type="date" />
            </div>
          </div>

          {notice ? <p className="mt-5 rounded-md border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">{notice}</p> : null}

          <section className="mt-6 grid gap-3 md:grid-cols-5">
            {[
              [metrics.overview.applications, "Başvuru"],
              [metrics.overview.accepted, "Kabul"],
              [metrics.overview.evaluators, "Değerlendirici"],
              [metrics.overview.mentors, "Mentor"],
              [metrics.overview.remainingJury, "Jüriye Kalan"],
            ].map(([value, label]) => (
              <article key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-3xl font-black">{value}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[.12em] text-slate-500">{label}</p>
              </article>
            ))}
          </section>

          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap gap-2">
              {["Genel Bakış", "Başvurular", "Girişimler", "Değerlendirme", "Mentorluk", "Jüri"].map((item) => (
                <button key={item} onClick={() => setTab(item)} className={`h-10 rounded-md px-4 text-sm font-black ${tab === item ? "bg-[#063f46] text-white" : "bg-slate-50 text-slate-600"}`}>
                  {item}
                </button>
              ))}
            </div>
          </section>

          {tab === "Genel Bakış" ? (
            <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-black">Başvuru → Kabul Dönüşümü</h2>
                <div className="mt-5 space-y-4 text-center">
                  {[
                    ["Başvuru", metrics.overview.applications],
                    ["Ön Eleme", metrics.application.statusCounts["İnceleniyor"] || 0],
                    ["Final", metrics.application.statusCounts["Jüriye Gönderildi"] || 0],
                    ["Kabul", metrics.overview.accepted],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md bg-slate-50 p-4">
                      <p className="text-2xl font-black">{value}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[.12em] text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <aside className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-black">Kabul Oranı</h2>
                <p className="mt-5 text-5xl font-black">%{metrics.overview.conversionRate}</p>
                <div className="mt-6 grid gap-3">
                  <button onClick={() => downloadCsv("applications")} className="h-11 rounded-md bg-[#063f46] px-4 text-sm font-bold text-white">Başvurular CSV</button>
                  <button onClick={() => downloadCsv("startups")} className="h-11 rounded-md border border-slate-200 px-4 text-sm font-bold">Girişimler CSV</button>
                  <button onClick={() => downloadCsv("meetings")} className="h-11 rounded-md border border-slate-200 px-4 text-sm font-bold">Mentorluk CSV</button>
                </div>
              </aside>
            </section>
          ) : null}

          {tab === "Başvurular" ? (
            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <article className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-black">Başvuru Durumları</h2>
                <div className="mt-5"><Bars data={metrics.application.statusCounts} /></div>
              </article>
              <article className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-black">Sektör Dağılımı</h2>
                <div className="mt-5"><Bars data={metrics.application.sectorCounts} /></div>
              </article>
            </section>
          ) : null}

          {tab === "Girişimler" ? (
            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <article className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-black">Girişim Aşamaları</h2>
                <div className="mt-5"><Bars data={metrics.startup.stageCounts} /></div>
              </article>
              <article className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-black">Girişim Durumu</h2>
                <div className="mt-5"><Bars data={metrics.startup.statusCounts as Record<string, number>} /></div>
              </article>
            </section>
          ) : null}

          {tab === "Değerlendirme" ? (
            <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-black">Değerlendirme</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[[metrics.evaluation.totalAssignments, "Toplam Atama"], [metrics.evaluation.completed, "Tamamlanan"], [metrics.evaluation.waiting, "Bekleyen"]].map(([value, label]) => (
                  <div key={label} className="rounded-md bg-slate-50 p-4"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{label}</p></div>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                {metrics.evaluation.rows.map((row) => (
                  <div key={row.name} className="grid gap-2 rounded-md bg-slate-50 p-4 text-sm md:grid-cols-4">
                    <b>{row.name}</b><span>Atama: {row.assigned}</span><span>Tamamlanan: {row.completed}</span><span>Bekleyen: {row.waiting}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {tab === "Mentorluk" ? (
            <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-black">Mentorluk</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                {[[metrics.mentorship.activeMentors, "Aktif Mentor"], [metrics.mentorship.assignments, "Mentor Ataması"], [metrics.mentorship.completedMeetings, "Tamamlanan Görüşme"], [metrics.mentorship.withoutMentor, "Mentorsuz Girişim"]].map(([value, label]) => (
                  <div key={label} className="rounded-md bg-slate-50 p-4"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{label}</p></div>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                {metrics.mentorship.rows.map((row) => (
                  <div key={row.name} className="rounded-md bg-slate-50 p-4 text-sm">
                    <b>{row.name}</b>
                    <p className="mt-1 text-slate-500">{row.mentorName || "Mentor atanmamış"} / {row.meetingCount} / {row.targetMeetingCount || 0} görüşme</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {tab === "Jüri" ? (
            <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-black">Final Jüri</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                {[[metrics.jury.startups, "Girişim"], [metrics.jury.members, "Jüri Üyesi"], [metrics.jury.scores, "Puanlama"], [`%${metrics.jury.completion}`, "Tamamlanma"]].map(([value, label]) => (
                  <div key={label} className="rounded-md bg-slate-50 p-4"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{label}</p></div>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                {metrics.jury.ranking.map((row) => (
                  <div key={row.startup} className="grid grid-cols-[60px_1fr_100px] rounded-md bg-slate-50 p-4 text-sm">
                    <b>{row.rank}</b><span>{row.startup}</span><b>{row.average}</b>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}
