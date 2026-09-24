"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Application, readApplications } from "@/lib/applications";
import {
  Evaluator,
  assignApplicationsToEvaluator,
  evaluationCriteria,
  expertiseOptions,
  getEvaluatorAssignments,
  readEvaluators,
  saveEvaluator,
  syncEvaluatorUser,
} from "@/lib/evaluators";

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600";

export default function EvaluatorDetailPage() {
  const params = useParams<{ id: string }>();
  const [evaluator, setEvaluator] = useState<Evaluator | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [tab, setTab] = useState("Genel");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const sync = () => {
      setEvaluator(readEvaluators().find((item) => item.id === params.id) || null);
      setApplications(readApplications());
    };

    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("lidea-evaluators-updated", sync);
    window.addEventListener("lidea-applications-updated", sync);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("lidea-evaluators-updated", sync);
      window.removeEventListener("lidea-applications-updated", sync);
    };
  }, [params.id]);

  const assignments = useMemo(
    () => (evaluator ? getEvaluatorAssignments(evaluator.email) : []),
    [applications, evaluator],
  );

  const assignableApplications = useMemo(
    () =>
      applications.filter(
        (application) =>
          evaluator &&
          !application.juryAssignees.includes(evaluator.email) &&
          ["İnceleniyor", "Jüriye Gönderildi", "Yeni"].includes(application.status),
      ),
    [applications, evaluator],
  );

  const metrics = useMemo(() => {
    const completed = assignments.filter((assignment) => assignment.status === "Tamamlandı").length;
    return {
      assigned: assignments.length,
      completed,
      waiting: assignments.length - completed,
      capacity: evaluator ? Math.max(evaluator.assignmentLimit - assignments.length, 0) : 0,
    };
  }, [assignments, evaluator]);

  function updateEvaluator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!evaluator) return;
    const form = new FormData(event.currentTarget);
    const selectedExpertise = expertiseOptions.filter((item) => form.get(item) === "on");
    const customExpertise = String(form.get("customExpertise") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const nextEvaluator = {
      ...evaluator,
      name: String(form.get("name") || ""),
      email: String(form.get("email") || "").toLowerCase(),
      password: String(form.get("password") || evaluator.password),
      phone: String(form.get("phone") || ""),
      institution: String(form.get("institution") || ""),
      title: String(form.get("title") || ""),
      expertise: Array.from(new Set([...selectedExpertise, ...customExpertise])),
      status: String(form.get("status") || "Aktif") as Evaluator["status"],
      assignmentLimit: Number(form.get("assignmentLimit") || evaluator.assignmentLimit),
      notes: String(form.get("notes") || ""),
      updatedAt: new Date().toISOString(),
    };

    saveEvaluator(nextEvaluator);
    syncEvaluatorUser(nextEvaluator);
    setEvaluator(nextEvaluator);
    setNotice("Değerlendirici bilgileri kaydedildi.");
  }

  function assignApplications(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!evaluator) return;
    const form = new FormData(event.currentTarget);
    const ids = assignableApplications
      .filter((application) => form.get(application.id) === "on")
      .map((application) => application.id);
    const juryDeadline = String(form.get("juryDeadline") || "");
    if (!ids.length) {
      setNotice("Atamak için en az bir başvuru seçin.");
      return;
    }

    assignApplicationsToEvaluator(evaluator, ids, juryDeadline);
    setApplications(readApplications());
    setNotice(`${ids.length} başvuru değerlendiriciye atandı.`);
    event.currentTarget.reset();
  }

  if (!evaluator) {
    return (
      <main className="min-h-screen bg-[#f6fbfc] p-6 text-slate-950">
        <section className="rounded-lg border border-slate-200 bg-white p-8">
          <h1 className="text-2xl font-black">Değerlendirici bulunamadı</h1>
          <Link className="mt-5 inline-block font-black text-cyan-800" href="/admin/degerlendiriciler">
            ← Değerlendiricilere dön
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6fbfc] p-6 text-slate-950">
      <Link className="font-black text-cyan-800" href="/admin/degerlendiriciler">
        ← Değerlendiriciler
      </Link>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">3. Dönem</p>
            <h1 className="mt-2 text-4xl font-black">{evaluator.name}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {evaluator.title || "-"} {evaluator.institution ? `/ ${evaluator.institution}` : ""}
            </p>
          </div>
          <span className={evaluator.status === "Aktif" ? "rounded-md bg-green-50 px-4 py-2 text-sm font-black text-green-800" : "rounded-md bg-slate-100 px-4 py-2 text-sm font-black text-slate-600"}>
            {evaluator.status === "Aktif" ? "●" : "○"} {evaluator.status}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {["Genel", "Atamalar", "Kriterler"].map((item) => (
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
          [metrics.assigned, "Atanan Başvuru"],
          [metrics.completed, "Tamamlanan"],
          [metrics.waiting, "Bekleyen"],
          [metrics.capacity, "Kalan Kapasite"],
        ].map(([value, label]) => (
          <article key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-3xl font-black">{value}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[.12em] text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      {tab === "Genel" ? (
        <form onSubmit={updateEvaluator} className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black">Genel Bilgiler</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <input className={inputClass} name="name" defaultValue={evaluator.name} placeholder="Ad Soyad" />
            <input className={inputClass} name="email" defaultValue={evaluator.email} type="email" placeholder="E-posta" />
            <input className={inputClass} name="password" defaultValue={evaluator.password} placeholder="Şifre" />
            <input className={inputClass} name="phone" defaultValue={evaluator.phone} placeholder="Telefon" />
            <input className={inputClass} name="institution" defaultValue={evaluator.institution} placeholder="Kurum / Şirket" />
            <input className={inputClass} name="title" defaultValue={evaluator.title} placeholder="Unvan" />
            <input className={inputClass} name="assignmentLimit" type="number" min="1" defaultValue={evaluator.assignmentLimit} />
            <select className={inputClass} name="status" defaultValue={evaluator.status}>
              <option>Aktif</option>
              <option>Pasif</option>
            </select>
            <input className={inputClass} name="customExpertise" placeholder="Ek uzmanlıklar, virgülle" />
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {expertiseOptions.map((item) => (
              <label key={item} className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold">
                <input name={item} type="checkbox" defaultChecked={evaluator.expertise.includes(item)} />
                {item}
              </label>
            ))}
          </div>
          <label className="mt-5 block text-sm font-black">
            Admin Notu
            <textarea
              name="notes"
              defaultValue={evaluator.notes}
              rows={4}
              className="mt-2 w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-cyan-600"
            />
          </label>
          <button className="mt-5 h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">
            Değişiklikleri Kaydet
          </button>
        </form>
      ) : null}

      {tab === "Atamalar" ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Girişim</th>
                  <th className="px-5 py-4">Aşama</th>
                  <th className="px-5 py-4">Son Tarih</th>
                  <th className="px-5 py-4">Durum</th>
                  <th className="px-5 py-4">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.length ? (
                  assignments.map(({ application, status }) => (
                    <tr key={application.id}>
                      <td className="px-5 py-4">
                        <p className="font-black">{application.startup}</p>
                        <p className="mt-1 text-xs text-slate-400">{application.sector}</p>
                      </td>
                      <td className="px-5 py-4">{application.stage}</td>
                      <td className="px-5 py-4">{application.juryDeadline || "-"}</td>
                      <td className="px-5 py-4 font-black">{status}</td>
                      <td className="px-5 py-4">
                        <Link className="font-black text-cyan-800" href={`/admin/basvurular/${application.id}`}>
                          Atamayı Gör →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-10 text-center text-sm text-slate-500" colSpan={5}>
                      Bu değerlendiriciye atanmış canlı başvuru yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <form onSubmit={assignApplications} className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-black">Başvuru Ata</h2>
            <input name="juryDeadline" type="date" className={`${inputClass} mt-4 w-full`} />
            <div className="mt-4 max-h-[360px] space-y-2 overflow-auto">
              {assignableApplications.length ? (
                assignableApplications.map((application) => (
                  <label key={application.id} className="flex items-start gap-3 rounded-md bg-slate-50 p-3 text-sm">
                    <input name={application.id} type="checkbox" className="mt-1" />
                    <span>
                      <span className="block font-black">{application.startup}</span>
                      <span className="text-xs text-slate-500">
                        {application.sector} / {application.stage}
                      </span>
                    </span>
                  </label>
                ))
              ) : (
                <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">
                  Atanabilir canlı başvuru yok.
                </p>
              )}
            </div>
            <button className="mt-4 h-11 w-full rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">
              Başvuruları Ata
            </button>
          </form>
        </div>
      ) : null}

      {tab === "Kriterler" ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black">Standart Değerlendirme Kriterleri</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {evaluationCriteria.map((criterion) => (
              <div key={criterion} className="flex items-center justify-between rounded-md bg-slate-50 p-4">
                <span className="font-black">{criterion}</span>
                <span className="text-sm font-bold text-slate-500">0-10</span>
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-md bg-cyan-50 p-4 text-sm font-semibold text-cyan-900">
            Nihai kabul, yedek ve ret kararı admin/program yönetimi tarafından başvuru detayında verilir.
          </p>
        </section>
      ) : null}
    </main>
  );
}
