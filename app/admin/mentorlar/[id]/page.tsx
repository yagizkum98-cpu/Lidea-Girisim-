"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Startup, saveStartup, syncAcceptedApplicationsToStartups } from "@/lib/startups";
import {
  Mentor,
  MentorMeeting,
  MeetingStatus,
  MeetingType,
  assignStartupsToMentor,
  getMentorStartups,
  meetingStatuses,
  mentorExpertiseOptions,
  normalizeMentorMeeting,
  readMentorMeetings,
  readMentors,
  saveMentorAction,
  saveMentor,
  saveMentorMeeting,
  syncMentorUser,
} from "@/lib/mentors";

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600";

export default function MentorDetailPage() {
  const params = useParams<{ id: string }>();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [meetings, setMeetings] = useState<MentorMeeting[]>([]);
  const [tab, setTab] = useState("Genel");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const sync = () => {
      setMentor(readMentors().find((item) => item.id === params.id) || null);
      setStartups(syncAcceptedApplicationsToStartups());
      setMeetings(readMentorMeetings());
    };

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
  }, [params.id]);

  const assignedStartups = useMemo(() => (mentor ? getMentorStartups(mentor) : []), [mentor, startups]);
  const mentorMeetings = useMemo(
    () => (mentor ? meetings.filter((meeting) => meeting.mentorId === mentor.id) : []),
    [meetings, mentor],
  );
  const assignableStartups = useMemo(
    () =>
      mentor
        ? startups.filter(
            (startup) =>
              !startup.mentor ||
              (startup.mentor.mentorId !== mentor.id &&
                startup.mentor.mentorEmail !== mentor.email &&
                startup.mentor.mentorName !== mentor.name),
          )
        : [],
    [mentor, startups],
  );

  const metrics = useMemo(() => {
    const completed = mentorMeetings.filter((meeting) => meeting.status === "Tamamlandı").length;
    const planned = mentorMeetings.filter((meeting) => meeting.status === "Planlandı").length;
    return {
      assigned: assignedStartups.length,
      completed,
      planned,
      capacity: mentor ? Math.max(mentor.assignmentLimit - assignedStartups.length, 0) : 0,
    };
  }, [assignedStartups, mentor, mentorMeetings]);

  function updateMentor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mentor) return;
    const form = new FormData(event.currentTarget);
    const selectedExpertise = mentorExpertiseOptions.filter((item) => form.get(item) === "on");
    const customExpertise = String(form.get("customExpertise") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const nextMentor = {
      ...mentor,
      name: String(form.get("name") || ""),
      email: String(form.get("email") || "").toLowerCase(),
      password: String(form.get("password") || mentor.password),
      phone: String(form.get("phone") || ""),
      institution: String(form.get("institution") || ""),
      title: String(form.get("title") || ""),
      linkedin: String(form.get("linkedin") || ""),
      expertise: Array.from(new Set([...selectedExpertise, ...customExpertise])),
      bio: String(form.get("bio") || ""),
      status: String(form.get("status") || "Aktif") as Mentor["status"],
      assignmentLimit: Number(form.get("assignmentLimit") || mentor.assignmentLimit),
      updatedAt: new Date().toISOString(),
    };

    saveMentor(nextMentor);
    syncMentorUser(nextMentor);
    setMentor(nextMentor);
    setNotice("Mentor bilgileri kaydedildi.");
  }

  function assignStartups(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mentor) return;
    const form = new FormData(event.currentTarget);
    const ids = assignableStartups.filter((startup) => form.get(startup.id) === "on").map((startup) => startup.id);
    if (!ids.length) {
      setNotice("Atamak için en az bir girişim seçin.");
      return;
    }

    assignStartupsToMentor(
      mentor,
      ids,
      String(form.get("expertise") || mentor.expertise[0] || ""),
      String(form.get("startDate") || new Date().toISOString().slice(0, 10)),
      Number(form.get("targetMeetingCount") || 4),
    );
    setStartups(syncAcceptedApplicationsToStartups());
    setNotice(`${ids.length} girişime mentor atandı.`);
    event.currentTarget.reset();
  }

  function createMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mentor) return;
    const form = new FormData(event.currentTarget);
    const startupId = String(form.get("startupId") || "");
    const startup = assignedStartups.find((item) => item.id === startupId);
    if (!startup) {
      setNotice("Görüşme için atanmış bir girişim seçin.");
      return;
    }

    const meeting = normalizeMentorMeeting({
      mentorId: mentor.id,
      mentorEmail: mentor.email,
      mentorName: mentor.name,
      startupId: startup.id,
      startupName: startup.name,
      date: String(form.get("date") || ""),
      time: String(form.get("time") || ""),
      duration: String(form.get("duration") || "60 dakika"),
      type: String(form.get("type") || "Online") as MeetingType,
      link: String(form.get("link") || ""),
      topic: String(form.get("topic") || ""),
      status: String(form.get("status") || "Planlandı") as MeetingStatus,
      note: String(form.get("note") || ""),
      nextActions: String(form.get("nextActions") || ""),
    });
    saveMentorMeeting(meeting);
    const nextActions = String(form.get("nextActions") || "").trim();
    if (nextActions) {
      saveMentorAction({
        id: crypto.randomUUID(),
        mentorId: mentor.id,
        mentorName: mentor.name,
        meetingId: meeting.id,
        startupId: startup.id,
        startupName: startup.name,
        title: nextActions.split("\n")[0],
        description: nextActions,
        deadline: String(form.get("actionDeadline") || ""),
        status: "Yapılacak",
        submissionNote: "",
        submissionFileName: "",
        feedback: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: "",
      });
    }
    const updatedMeetings = readMentorMeetings();
    const completedForStartup = updatedMeetings.filter(
      (item) =>
        item.mentorId === mentor.id &&
        item.startupId === startup.id &&
        item.status === "Tamamlandı",
    );
    if (startup.mentor) {
      saveStartup({
        ...startup,
        mentor: {
          ...startup.mentor,
          meetingCount: completedForStartup.length,
          lastMeeting: completedForStartup[0]?.date || startup.mentor.lastMeeting,
        },
      });
    }
    setMeetings(updatedMeetings);
    setStartups(syncAcceptedApplicationsToStartups());
    setNotice("Mentorluk görüşmesi oluşturuldu.");
    event.currentTarget.reset();
  }

  if (!mentor) {
    return (
      <main className="min-h-screen bg-[#f6fbfc] p-6 text-slate-950">
        <section className="rounded-lg border border-slate-200 bg-white p-8">
          <h1 className="text-2xl font-black">Mentor bulunamadı</h1>
          <Link className="mt-5 inline-block font-black text-cyan-800" href="/admin/mentorlar">
            ← Mentorlara dön
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6fbfc] p-6 text-slate-950">
      <Link className="font-black text-cyan-800" href="/admin/mentorlar">
        ← Mentorlar
      </Link>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">3. Dönem</p>
            <h1 className="mt-2 text-4xl font-black">{mentor.name}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {mentor.expertise.join(" / ") || "Uzmanlık girilmedi"} {mentor.institution ? `- ${mentor.institution}` : ""}
            </p>
          </div>
          <span className={mentor.status === "Aktif" ? "rounded-md bg-green-50 px-4 py-2 text-sm font-black text-green-800" : "rounded-md bg-slate-100 px-4 py-2 text-sm font-black text-slate-600"}>
            {mentor.status === "Aktif" ? "●" : "○"} {mentor.status}
          </span>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {["Genel", "Girişimler", "Görüşmeler", "Notlar"].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`h-10 rounded-md px-4 text-sm font-black ${
                tab === item ? "bg-[#063f46] text-white" : "bg-slate-50 text-slate-600"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {notice ? (
        <p className="mt-4 rounded-md border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">
          {notice}
        </p>
      ) : null}

      <section className="mt-6 grid gap-3 md:grid-cols-4">
        {[
          [metrics.assigned, "Atanan Girişim"],
          [metrics.completed, "Gerçekleşen Görüşme"],
          [metrics.planned, "Planlanan Görüşme"],
          [metrics.capacity, "Kalan Kapasite"],
        ].map(([value, label]) => (
          <article key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-3xl font-black">{value}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[.12em] text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      {tab === "Genel" ? (
        <form onSubmit={updateMentor} className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black">Mentor Bilgileri</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <input name="name" className={inputClass} defaultValue={mentor.name} placeholder="Ad Soyad" />
            <input name="email" className={inputClass} defaultValue={mentor.email} type="email" placeholder="E-posta" />
            <input name="password" className={inputClass} defaultValue={mentor.password} placeholder="Şifre" />
            <input name="phone" className={inputClass} defaultValue={mentor.phone} placeholder="Telefon" />
            <input name="institution" className={inputClass} defaultValue={mentor.institution} placeholder="Kurum / Şirket" />
            <input name="title" className={inputClass} defaultValue={mentor.title} placeholder="Unvan" />
            <input name="linkedin" className={inputClass} defaultValue={mentor.linkedin} placeholder="LinkedIn" />
            <input name="assignmentLimit" className={inputClass} type="number" min="1" defaultValue={mentor.assignmentLimit} />
            <select name="status" className={inputClass} defaultValue={mentor.status}>
              <option>Aktif</option>
              <option>Pasif</option>
            </select>
          </div>
          <input name="customExpertise" className={`${inputClass} mt-3 w-full`} placeholder="Ek uzmanlıklar, virgülle" />
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {mentorExpertiseOptions.map((item) => (
              <label key={item} className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold">
                <input name={item} type="checkbox" defaultChecked={mentor.expertise.includes(item)} />
                {item}
              </label>
            ))}
          </div>
          <textarea
            name="bio"
            rows={4}
            defaultValue={mentor.bio}
            className="mt-5 w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-cyan-600"
            placeholder="Kısa biyografi"
          />
          <button className="mt-5 h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">
            Değişiklikleri Kaydet
          </button>
        </form>
      ) : null}

      {tab === "Girişimler" ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Girişim</th>
                  <th className="px-5 py-4">Alan</th>
                  <th className="px-5 py-4">Başlangıç</th>
                  <th className="px-5 py-4">Görüşme</th>
                  <th className="px-5 py-4">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignedStartups.length ? (
                  assignedStartups.map((startup) => (
                    <tr key={startup.id}>
                      <td className="px-5 py-4">
                        <p className="font-black">{startup.name}</p>
                        <p className="mt-1 text-xs text-slate-400">{startup.sector} / {startup.stage}</p>
                      </td>
                      <td className="px-5 py-4">{startup.mentor?.expertise || "-"}</td>
                      <td className="px-5 py-4">{startup.mentor?.startDate || "-"}</td>
                      <td className="px-5 py-4">{startup.mentor?.meetingCount || 0}</td>
                      <td className="px-5 py-4">
                        <Link className="font-black text-cyan-800" href={`/admin/girisimler/${startup.id}`}>
                          Girişimi Gör →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-10 text-center text-sm text-slate-500" colSpan={5}>
                      Bu mentora atanmış canlı girişim yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <form onSubmit={assignStartups} className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-black">Girişim Ata</h2>
            <div className="mt-4 grid gap-3">
              <select name="expertise" className={inputClass} defaultValue={mentor.expertise[0] || ""}>
                <option value="">Mentorluk alanı</option>
                {mentor.expertise.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <input name="startDate" type="date" className={inputClass} />
              <input name="targetMeetingCount" type="number" min="1" className={inputClass} placeholder="Hedef görüşme" />
            </div>
            <div className="mt-4 max-h-[360px] space-y-2 overflow-auto">
              {assignableStartups.length ? (
                assignableStartups.map((startup) => (
                  <label key={startup.id} className="flex items-start gap-3 rounded-md bg-slate-50 p-3 text-sm">
                    <input name={startup.id} type="checkbox" className="mt-1" />
                    <span>
                      <span className="block font-black">{startup.name}</span>
                      <span className="text-xs text-slate-500">
                        {startup.sector} / {startup.stage}
                      </span>
                    </span>
                  </label>
                ))
              ) : (
                <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">
                  Atanabilir canlı girişim yok.
                </p>
              )}
            </div>
            <button className="mt-4 h-11 w-full rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">
              Mentor Ata
            </button>
          </form>
        </div>
      ) : null}

      {tab === "Görüşmeler" ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-black">Görüşmeler</h2>
            <div className="mt-4 space-y-3">
              {mentorMeetings.length ? (
                mentorMeetings.map((meeting) => (
                  <article key={meeting.id} className="rounded-md border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{meeting.startupName}</p>
                        <p className="mt-1 text-sm text-slate-500">{meeting.topic || "Konu girilmedi"}</p>
                      </div>
                      <span className="text-sm font-black">{meeting.status}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {meeting.date} {meeting.time} / {meeting.duration} / {meeting.type}
                    </p>
                    {meeting.note ? <p className="mt-3 text-sm text-slate-600">{meeting.note}</p> : null}
                  </article>
                ))
              ) : (
                <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">Henüz görüşme kaydı yok.</p>
              )}
            </div>
          </section>

          <form onSubmit={createMeeting} className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-black">Görüşme Ekle</h2>
            <div className="mt-4 grid gap-3">
              <select name="startupId" className={inputClass}>
                <option value="">Girişim seç</option>
                {assignedStartups.map((startup) => (
                  <option key={startup.id} value={startup.id}>
                    {startup.name}
                  </option>
                ))}
              </select>
              <input name="date" type="date" className={inputClass} />
              <input name="time" type="time" className={inputClass} />
              <select name="duration" className={inputClass} defaultValue="60 dakika">
                <option>30 dakika</option>
                <option>45 dakika</option>
                <option>60 dakika</option>
                <option>90 dakika</option>
              </select>
              <select name="type" className={inputClass} defaultValue="Online">
                <option>Online</option>
                <option>Yüz Yüze</option>
              </select>
              <select name="status" className={inputClass} defaultValue="Planlandı">
                {meetingStatuses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <input name="link" className={inputClass} placeholder="Toplantı bağlantısı" />
              <input name="topic" className={inputClass} placeholder="Konu" />
              <textarea name="note" rows={3} className="rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-cyan-600" placeholder="Mentor notu" />
              <input name="actionDeadline" type="date" className={inputClass} />
              <textarea name="nextActions" rows={3} className="rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-cyan-600" placeholder="Sonraki aksiyonlar" />
            </div>
            <button className="mt-4 h-11 w-full rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">
              Görüşmeyi Oluştur
            </button>
          </form>
        </div>
      ) : null}

      {tab === "Notlar" ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black">Mentor Notları</h2>
          <div className="mt-4 space-y-3">
            {mentorMeetings.filter((meeting) => meeting.note || meeting.nextActions).length ? (
              mentorMeetings
                .filter((meeting) => meeting.note || meeting.nextActions)
                .map((meeting) => (
                  <article key={meeting.id} className="rounded-md bg-slate-50 p-4">
                    <p className="font-black">{meeting.startupName}</p>
                    <p className="mt-2 text-sm text-slate-600">{meeting.note || "-"}</p>
                    {meeting.nextActions ? (
                      <p className="mt-3 text-sm font-semibold text-cyan-900">Aksiyon: {meeting.nextActions}</p>
                    ) : null}
                  </article>
                ))
            ) : (
              <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">Henüz mentor notu yok.</p>
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
