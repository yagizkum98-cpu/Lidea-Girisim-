"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Startup,
  StartupStatus,
  demoDayItems,
  getStartupProfileCompletion,
  saveStartup,
  startupStatuses,
  syncAcceptedApplicationsToStartups,
} from "@/lib/startups";
import { readMentors } from "@/lib/mentors";

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600";

export default function StartupDetailPage() {
  const params = useParams<{ id: string }>();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [tab, setTab] = useState("Genel");
  const [mentors, setMentors] = useState<{ id: string; name: string; email: string; status: string; expertise: string[] }[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const startups = syncAcceptedApplicationsToStartups();
    setStartup(startups.find((item) => item.id === params.id) || null);
    setMentors(readMentors().filter((mentor) => mentor.status === "Aktif"));
  }, [params.id]);

  function persist(nextStartup: Startup, message: string) {
    const updated = { ...nextStartup, updatedAt: new Date().toISOString() };
    saveStartup(updated);
    setStartup(updated);
    setNotice(message);
  }

  function saveGeneral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!startup) return;
    const form = new FormData(event.currentTarget);
    const nextStartup = {
      ...startup,
      name: String(form.get("name") || ""),
      founder: String(form.get("founder") || ""),
      sector: String(form.get("sector") || ""),
      stage: String(form.get("stage") || ""),
      website: String(form.get("website") || ""),
      problem: String(form.get("problem") || ""),
      solution: String(form.get("solution") || ""),
      businessModel: String(form.get("businessModel") || ""),
      traction: String(form.get("traction") || ""),
    };
    persist(
      {
        ...nextStartup,
        progress: getStartupProfileCompletion(nextStartup).percent,
      },
      "Girişim bilgileri kaydedildi.",
    );
  }

  function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!startup) return;
    const form = new FormData(event.currentTarget);
    const nextStartup = {
      ...startup,
      members: [
        ...startup.members,
        {
          id: crypto.randomUUID(),
          name: String(form.get("name") || ""),
          role: String(form.get("role") || ""),
          title: String(form.get("title") || ""),
          active: true,
        },
      ],
    };
    persist(
      {
        ...nextStartup,
        progress: getStartupProfileCompletion(nextStartup).percent,
      },
      "Ekip üyesi eklendi.",
    );
    event.currentTarget.reset();
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!startup) return;
    const form = new FormData(event.currentTarget);
    persist(
      {
        ...startup,
        notes: [
          {
            id: crypto.randomUUID(),
            text: String(form.get("note") || ""),
            author: "Program Admin",
            createdAt: new Date().toLocaleDateString("tr-TR"),
          },
          ...startup.notes,
        ],
      },
      "Not eklendi.",
    );
    event.currentTarget.reset();
  }

  function addDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!startup) return;
    const form = new FormData(event.currentTarget);
    persist(
      {
        ...startup,
        documents: [
          ...startup.documents,
          {
            id: crypto.randomUUID(),
            type: String(form.get("type") || "Belge"),
            fileName: String(form.get("fileName") || ""),
            fileUrl: "#",
            uploadedAt: new Date().toISOString().slice(0, 10),
          },
        ],
      },
      "Belge kaydı eklendi.",
    );
    event.currentTarget.reset();
  }

  function assignMentor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!startup) return;
    const form = new FormData(event.currentTarget);
    const mentorName = String(form.get("mentorName") || "");
    const selectedMentor = mentors.find((mentor) => mentor.name === mentorName);
    persist(
      {
        ...startup,
        mentor: mentorName
          ? {
              mentorId: selectedMentor?.id,
              mentorEmail: selectedMentor?.email,
              mentorName,
              expertise: String(form.get("expertise") || selectedMentor?.expertise[0] || ""),
              assignmentType: "Ana Mentor",
              startDate: new Date().toISOString().slice(0, 10),
              targetMeetingCount: 4,
              meetingCount: startup.mentor?.meetingCount || 0,
              lastMeeting: startup.mentor?.lastMeeting || "",
            }
          : null,
      },
      "Mentor ataması güncellendi.",
    );
  }

  function updateStatus(status: StartupStatus) {
    if (!startup) return;
    if (!window.confirm(`${startup.name} durumunu "${status}" yapmak istiyor musunuz?`)) return;
    persist({ ...startup, status }, "Program durumu güncellendi.");
  }

  const demoReadyPercent = useMemo(() => {
    if (!startup) return 0;
    const completed = demoDayItems.filter((item) => startup.demoDayChecklist[item]).length;
    return Math.round((completed / demoDayItems.length) * 100);
  }, [startup]);
  const profileCompletion = useMemo(() => getStartupProfileCompletion(startup), [startup]);

  if (!startup) {
    return (
      <main className="min-h-screen bg-[#f6fbfc] p-6 text-slate-950">
        <section className="rounded-lg border border-slate-200 bg-white p-8">
          <h1 className="text-2xl font-black">Girişim bulunamadı</h1>
          <Link className="mt-5 inline-block font-black text-cyan-800" href="/admin/girisimler">
            ← Girişimlere dön
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6fbfc] p-6 text-slate-950">
      <Link className="font-black text-cyan-800" href="/admin/girisimler">
        ← Girişimler
      </Link>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-slate-500">
              {startup.sector} / {startup.stage} / {startup.programTrack || "Program seçilmedi"}
            </p>
            <h1 className="mt-2 text-4xl font-black">{startup.name}</h1>
            <p className="mt-2 text-sm text-slate-500">Programa Kabul: {startup.acceptedAt}</p>
          </div>
          <div className="min-w-56 rounded-md bg-slate-50 p-4">
            <p className="text-sm font-black text-cyan-800">Profil Tamamlama %{profileCompletion.percent}</p>
            <p className="mt-2 text-xs font-bold text-slate-500">
              {profileCompletion.completedCount} / {profileCompletion.totalCount} alan dolu
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {["Genel", "Ekip", "Program", "Mentorluk", "Belgeler", "Notlar"].map((item) => (
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          {tab === "Genel" ? (
            <form onSubmit={saveGeneral} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input name="name" defaultValue={startup.name} className={inputClass} />
                <input name="founder" defaultValue={startup.founder} className={inputClass} />
                <input name="sector" defaultValue={startup.sector} className={inputClass} />
                <input name="stage" defaultValue={startup.stage} className={inputClass} />
                <input name="website" defaultValue={startup.website} className={inputClass} />
              </div>
              {[
                ["problem", "Problem", startup.problem],
                ["solution", "Çözüm", startup.solution],
                ["businessModel", "İş Modeli", startup.businessModel],
                ["traction", "Traction", startup.traction],
              ].map(([name, label, value]) => (
                <label key={name} className="text-sm font-black">
                  {label}
                  <textarea
                    name={name}
                    defaultValue={value}
                    rows={3}
                    className="mt-2 w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-cyan-600"
                  />
                </label>
              ))}
              <button className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white md:w-fit">
                Bilgileri Düzenle
              </button>
            </form>
          ) : null}

          {tab === "Ekip" ? (
            <div>
              <div className="grid gap-4 md:grid-cols-2">
                {startup.members.map((member) => (
                  <article key={member.id} className="rounded-md border border-slate-100 bg-slate-50 p-4">
                    <p className="font-black">{member.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{member.role}</p>
                    <p className="mt-1 text-sm text-slate-500">{member.title}</p>
                    <p className="mt-3 text-sm font-black text-green-700">● Aktif</p>
                  </article>
                ))}
              </div>
              <form onSubmit={addMember} className="mt-5 grid gap-3 md:grid-cols-4">
                <input name="name" placeholder="Ad Soyad" className={inputClass} />
                <input name="role" placeholder="Rol" className={inputClass} />
                <input name="title" placeholder="Unvan" className={inputClass} />
                <button className="h-11 rounded-md bg-cyan-700 px-4 text-sm font-bold text-white">
                  + Ekip Üyesi Ekle
                </button>
              </form>
            </div>
          ) : null}

          {tab === "Program" ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["Program Durumu", startup.status],
                  ["Program İlerlemesi", `%${startup.progress}`],
                  ["Tamamlanan Aşama", `${Math.round((startup.progress / 100) * 8)} / 8`],
                  ["Demo Day Durumu", startup.status === "Demo Day Hazır" ? "Hazır" : "Hazırlanıyor"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">{label}</p>
                    <p className="mt-2 font-black">{value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-black">Demo Day Hazırlığı %{demoReadyPercent}</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {demoDayItems.map((item) => (
                    <label key={item} className="flex items-center gap-3 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={startup.demoDayChecklist[item]}
                        onChange={(event) =>
                          persist(
                            {
                              ...startup,
                              demoDayChecklist: {
                                ...startup.demoDayChecklist,
                                [item]: event.target.checked,
                              },
                            },
                            "Demo Day hazırlığı güncellendi.",
                          )
                        }
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Mentorluk" ? (
            <form onSubmit={assignMentor} className="grid gap-4">
              {startup.mentor ? (
                <div className="rounded-md bg-slate-50 p-4">
                  <p className="font-black">{startup.mentor.mentorName}</p>
                  <p className="mt-1 text-sm text-slate-500">{startup.mentor.expertise}</p>
                  <p className="mt-3 text-sm">{startup.mentor.meetingCount} görüşme</p>
                </div>
              ) : (
                <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">
                  Bu girişime henüz mentor atanmamıştır.
                </p>
              )}
              <select name="mentorName" className={inputClass} defaultValue={startup.mentor?.mentorName || ""}>
                <option value="">Mentor seç</option>
                {mentors.map((mentor) => (
                  <option key={mentor.email}>{mentor.name}</option>
                ))}
              </select>
              <input name="expertise" placeholder="Uzmanlık alanı" defaultValue={startup.mentor?.expertise || ""} className={inputClass} />
              <button className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white md:w-fit">
                Mentor Ata
              </button>
            </form>
          ) : null}

          {tab === "Belgeler" ? (
            <div>
              <div className="space-y-3">
                {startup.documents.length ? (
                  startup.documents.map((document) => (
                    <div key={document.id} className="rounded-md border border-slate-100 bg-slate-50 p-4">
                      <p className="font-black">{document.type}</p>
                      <p className="mt-1 text-sm text-slate-500">{document.fileName}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">
                    Henüz belge yüklenmedi.
                  </p>
                )}
              </div>
              <form onSubmit={addDocument} className="mt-5 grid gap-3 md:grid-cols-3">
                <input name="type" placeholder="Belge türü" className={inputClass} />
                <input name="fileName" placeholder="Dosya adı" className={inputClass} />
                <button className="h-11 rounded-md bg-cyan-700 px-4 text-sm font-bold text-white">
                  + Belge Ekle
                </button>
              </form>
            </div>
          ) : null}

          {tab === "Notlar" ? (
            <div>
              <form onSubmit={addNote} className="grid gap-3">
                <textarea
                  name="note"
                  rows={4}
                  placeholder="Yeni not"
                  className="rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-cyan-600"
                />
                <button className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white md:w-fit">
                  Not Ekle
                </button>
              </form>
              <div className="mt-5 space-y-4">
                {startup.notes.map((note) => (
                  <article key={note.id} className="rounded-md border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-500">{note.createdAt}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{note.text}</p>
                    <p className="mt-3 text-xs font-bold text-cyan-800">{note.author}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black">Hızlı İşlemler</h2>
            <div className="mt-4 grid gap-3">
              {startupStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(status)}
                  className="h-11 rounded-md border border-slate-200 bg-white px-4 text-sm font-black hover:bg-slate-50"
                >
                  {status}
                </button>
              ))}
            </div>
          </section>

          {startup.applicationId ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-black">Bağlantı</h2>
              <Link className="mt-4 inline-block font-black text-cyan-800" href={`/admin/basvurular/${startup.applicationId}`}>
                Orijinal Başvuruyu Gör →
              </Link>
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
