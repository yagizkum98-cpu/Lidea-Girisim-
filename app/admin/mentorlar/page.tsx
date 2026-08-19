"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { syncAcceptedApplicationsToStartups } from "@/lib/startups";
import {
  Mentor,
  mentorExpertiseOptions,
  normalizeMentor,
  readMentorMeetings,
  readMentors,
  saveMentor,
  syncMentorUser,
} from "@/lib/mentors";

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600";

const sidebarLinks = [
  ["Dashboard", "/admin"],
  ["Başvurular", "/admin/basvurular"],
  ["Girişimler", "/admin/girisimler"],
  ["Değerlendiriciler", "/admin/degerlendiriciler"],
  ["Mentorlar", "/admin/mentorlar"],
  ["Program", "/admin/program"],
  ["Bildirimler", "/admin/bildirimler"],
  ["Raporlar", "/admin"],
  ["Ayarlar", "/admin"],
];

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [query, setQuery] = useState("");
  const [expertise, setExpertise] = useState("");
  const [institution, setInstitution] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const sync = () => setMentors(readMentors());
    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("lidea-mentors-updated", sync);
    window.addEventListener("lidea-startups-updated", sync);
    window.addEventListener("lidea-mentor-meetings-updated", sync);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("lidea-mentors-updated", sync);
      window.removeEventListener("lidea-startups-updated", sync);
      window.removeEventListener("lidea-mentor-meetings-updated", sync);
    };
  }, []);

  const startups = typeof window === "undefined" ? [] : syncAcceptedApplicationsToStartups();
  const meetings = typeof window === "undefined" ? [] : readMentorMeetings();

  const metrics = useMemo(() => {
    const assigned = startups.filter((startup) => startup.mentor);
    return {
      total: mentors.length,
      active: mentors.filter((mentor) => mentor.status === "Aktif").length,
      assignments: assigned.length,
      meetings: meetings.filter((meeting) => meeting.status === "Tamamlandı").length,
      withoutMentor: startups.length - assigned.length,
    };
  }, [meetings, mentors, startups]);

  const institutions = useMemo(
    () => Array.from(new Set(mentors.map((mentor) => mentor.institution).filter(Boolean))),
    [mentors],
  );

  const filteredMentors = useMemo(
    () =>
      mentors.filter((mentor) => {
        const haystack = `${mentor.name} ${mentor.email} ${mentor.institution} ${mentor.expertise.join(" ")}`.toLowerCase();
        return (
          haystack.includes(query.toLowerCase()) &&
          (!expertise || mentor.expertise.includes(expertise)) &&
          (!institution || mentor.institution === institution) &&
          (!status || mentor.status === status)
        );
      }),
    [expertise, institution, mentors, query, status],
  );

  function createMentor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const selectedExpertise = mentorExpertiseOptions.filter((item) => form.get(item) === "on");
    const customExpertise = String(form.get("customExpertise") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const mentor = normalizeMentor({
      id: `MN-${Date.now().toString().slice(-6)}`,
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      phone: String(form.get("phone") || ""),
      institution: String(form.get("institution") || ""),
      title: String(form.get("title") || ""),
      linkedin: String(form.get("linkedin") || ""),
      expertise: Array.from(new Set([...selectedExpertise, ...customExpertise])),
      bio: String(form.get("bio") || ""),
      status: String(form.get("status") || "Aktif") as Mentor["status"],
      assignmentLimit: Number(form.get("assignmentLimit") || 4),
    });

    if (!mentor.name || !mentor.email || !mentor.password) {
      setNotice("Ad soyad, e-posta ve şifre zorunludur.");
      return;
    }

    saveMentor(mentor);
    syncMentorUser(mentor);
    setMentors(readMentors());
    setShowForm(false);
    setNotice("Mentor hesabı oluşturuldu.");
    event.currentTarget.reset();
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
              <Link
                key={label}
                href={href}
                className={`rounded-md px-3 py-2.5 ${
                  label === "Mentorlar" ? "bg-[#063f46] text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label === "Mentorlar" ? "●" : label === "Ayarlar" ? "⚙" : "▣"} {label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">
                Lidea Girişim Programı / 3. Dönem
              </p>
              <h1 className="mt-1 text-3xl font-black">Mentorlar</h1>
              <p className="mt-2 text-sm text-slate-500">{metrics.total} canlı mentor</p>
            </div>
            <button
              onClick={() => setShowForm((value) => !value)}
              className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white"
            >
              + Mentor Ekle
            </button>
          </div>

          {notice ? (
            <p className="mt-5 rounded-md border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">
              {notice}
            </p>
          ) : null}

          <section className="mt-6 grid gap-3 md:grid-cols-5">
            {[
              [metrics.total, "Toplam Mentor"],
              [metrics.active, "Aktif Mentor"],
              [metrics.assignments, "Mentor Ataması"],
              [metrics.meetings, "Gerçekleşen Görüşme"],
              [metrics.withoutMentor, "Mentorsuz Girişim"],
            ].map(([value, label]) => (
              <article key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-3xl font-black">{value}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[.12em] text-slate-500">{label}</p>
              </article>
            ))}
          </section>

          {showForm ? (
            <form onSubmit={createMentor} className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-black">Yeni Mentor</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <input name="name" className={inputClass} placeholder="Ad Soyad" />
                <input name="email" className={inputClass} type="email" placeholder="E-posta" />
                <input name="password" className={inputClass} type="password" placeholder="Şifre" />
                <input name="phone" className={inputClass} placeholder="Telefon" />
                <input name="institution" className={inputClass} placeholder="Kurum / Şirket" />
                <input name="title" className={inputClass} placeholder="Unvan" />
                <input name="linkedin" className={inputClass} placeholder="LinkedIn" />
                <input name="assignmentLimit" className={inputClass} type="number" min="1" placeholder="Atama limiti" />
                <select name="status" className={inputClass} defaultValue="Aktif">
                  <option>Aktif</option>
                  <option>Pasif</option>
                </select>
              </div>
              <input name="customExpertise" className={`${inputClass} mt-3 w-full`} placeholder="Ek uzmanlıklar, virgülle" />
              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {mentorExpertiseOptions.map((item) => (
                  <label key={item} className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold">
                    <input name={item} type="checkbox" />
                    {item}
                  </label>
                ))}
              </div>
              <textarea
                name="bio"
                rows={4}
                className="mt-5 w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-cyan-600"
                placeholder="Kısa biyografi"
              />
              <div className="mt-5 flex flex-wrap gap-3">
                <button className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">Mentor Ekle</button>
                <button type="button" onClick={() => setShowForm(false)} className="h-11 rounded-md border border-slate-200 px-5 text-sm font-bold">
                  İptal
                </button>
              </div>
            </form>
          ) : null}

          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
              <input
                className={inputClass}
                placeholder="Mentor, kurum veya uzmanlık ara..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <select className={inputClass} value={expertise} onChange={(event) => setExpertise(event.target.value)}>
                <option value="">Uzmanlık</option>
                {mentorExpertiseOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select className={inputClass} value={institution} onChange={(event) => setInstitution(event.target.value)}>
                <option value="">Kurum</option>
                {institutions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">Durum</option>
                <option>Aktif</option>
                <option>Pasif</option>
              </select>
            </div>
          </section>

          <section className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Mentor</th>
                  <th className="px-5 py-4">Uzmanlık</th>
                  <th className="px-5 py-4">Girişim</th>
                  <th className="px-5 py-4">Görüşme</th>
                  <th className="px-5 py-4">Durum</th>
                  <th className="px-5 py-4">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMentors.length ? (
                  filteredMentors.map((mentor) => {
                    const assignedCount = startups.filter(
                      (startup) =>
                        startup.mentor?.mentorId === mentor.id ||
                        startup.mentor?.mentorEmail === mentor.email ||
                        startup.mentor?.mentorName === mentor.name,
                    ).length;
                    const meetingCount = meetings.filter((meeting) => meeting.mentorId === mentor.id).length;

                    return (
                      <tr key={mentor.id}>
                        <td className="px-5 py-4">
                          <p className="font-black">{mentor.name}</p>
                          <p className="mt-1 text-xs text-slate-400">{mentor.email}</p>
                        </td>
                        <td className="px-5 py-4">{mentor.expertise.join(", ") || "-"}</td>
                        <td className="px-5 py-4 font-black">{assignedCount}</td>
                        <td className="px-5 py-4 font-black">{meetingCount}</td>
                        <td className="px-5 py-4">
                          <span className={mentor.status === "Aktif" ? "font-black text-green-700" : "font-black text-slate-500"}>
                            {mentor.status === "Aktif" ? "●" : "○"} {mentor.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Link className="font-black text-cyan-800" href={`/admin/mentorlar/${mentor.id}`}>
                            İncele →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-5 py-10 text-center text-sm text-slate-500" colSpan={6}>
                      Henüz canlı mentor yok. Mentor ekleyince sayaçlar ve atama listesi güncellenir.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </section>
      </div>
    </main>
  );
}
