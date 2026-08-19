"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { readApplications } from "@/lib/applications";
import {
  Evaluator,
  expertiseOptions,
  getEvaluatorAssignments,
  normalizeEvaluator,
  readEvaluators,
  saveEvaluator,
  syncEvaluatorUser,
} from "@/lib/evaluators";

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600";

const sidebarLinks = [
  ["Dashboard", "/admin"],
  ["Başvurular", "/admin/basvurular"],
  ["Girişimler", "/admin/girisimler"],
  ["Değerlendiriciler", "/admin/degerlendiriciler"],
  ["Program", "/admin/program"],
  ["Bildirimler", "/admin"],
  ["Raporlar", "/admin"],
  ["Ayarlar", "/admin"],
];

export default function EvaluatorsPage() {
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [expertise, setExpertise] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const sync = () => setEvaluators(readEvaluators());
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
  }, []);

  const applications = typeof window === "undefined" ? [] : readApplications();

  const metrics = useMemo(() => {
    const assigned = applications.filter((application) => application.juryAssignees.length > 0);
    const completed = assigned.filter((application) => application.juryScore > 0);

    return {
      total: evaluators.length,
      active: evaluators.filter((evaluator) => evaluator.status === "Aktif").length,
      assigned: assigned.length,
      completed: completed.length,
      waiting: assigned.length - completed.length,
    };
  }, [applications, evaluators]);

  const filteredEvaluators = useMemo(
    () =>
      evaluators.filter((evaluator) => {
        const haystack = `${evaluator.name} ${evaluator.email} ${evaluator.institution} ${evaluator.expertise.join(" ")}`.toLowerCase();
        return (
          haystack.includes(query.toLowerCase()) &&
          (!status || evaluator.status === status) &&
          (!expertise || evaluator.expertise.includes(expertise))
        );
      }),
    [evaluators, expertise, query, status],
  );

  function createEvaluator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const selectedExpertise = expertiseOptions.filter((item) => form.get(item) === "on");
    const customExpertise = String(form.get("customExpertise") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const evaluator = normalizeEvaluator({
      id: `EV-${Date.now().toString().slice(-6)}`,
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      phone: String(form.get("phone") || ""),
      institution: String(form.get("institution") || ""),
      title: String(form.get("title") || ""),
      expertise: Array.from(new Set([...selectedExpertise, ...customExpertise])),
      status: String(form.get("status") || "Aktif") as Evaluator["status"],
      assignmentLimit: Number(form.get("assignmentLimit") || 8),
    });

    if (!evaluator.name || !evaluator.email || !evaluator.password) {
      setNotice("Ad soyad, e-posta ve şifre zorunludur.");
      return;
    }

    saveEvaluator(evaluator);
    syncEvaluatorUser(evaluator);
    setEvaluators(readEvaluators());
    setShowForm(false);
    setNotice("Değerlendirici hesabı oluşturuldu.");
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
                className={`rounded-md px-3 py-2.5 ${
                  label === "Değerlendiriciler"
                    ? "bg-[#063f46] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                href={href}
              >
                {label === "Değerlendiriciler" ? "●" : label === "Ayarlar" ? "⚙" : "▣"} {label}
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
              <h1 className="mt-1 text-3xl font-black">Değerlendiriciler</h1>
              <p className="mt-2 text-sm text-slate-500">{metrics.total} canlı değerlendirici</p>
            </div>
            <button
              onClick={() => setShowForm((value) => !value)}
              className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white"
            >
              + Değerlendirici Ekle
            </button>
          </div>

          {notice ? (
            <p className="mt-5 rounded-md border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">
              {notice}
            </p>
          ) : null}

          <section className="mt-6 grid gap-3 md:grid-cols-5">
            {[
              [metrics.total, "Toplam"],
              [metrics.active, "Aktif"],
              [metrics.assigned, "Atanan Başvuru"],
              [metrics.completed, "Tamamlanan"],
              [metrics.waiting, "Bekleyen"],
            ].map(([value, label]) => (
              <article key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-3xl font-black">{value}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[.12em] text-slate-500">{label}</p>
              </article>
            ))}
          </section>

          {showForm ? (
            <form onSubmit={createEvaluator} className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-black">Yeni Değerlendirici</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <input className={inputClass} name="name" placeholder="Ad Soyad" />
                <input className={inputClass} name="email" type="email" placeholder="E-posta" />
                <input className={inputClass} name="password" type="password" placeholder="Şifre" />
                <input className={inputClass} name="phone" placeholder="Telefon" />
                <input className={inputClass} name="institution" placeholder="Kurum / Şirket" />
                <input className={inputClass} name="title" placeholder="Unvan" />
                <input className={inputClass} name="assignmentLimit" type="number" min="1" placeholder="Atama limiti" />
                <select className={inputClass} name="status" defaultValue="Aktif">
                  <option>Aktif</option>
                  <option>Pasif</option>
                </select>
                <input className={inputClass} name="customExpertise" placeholder="Ek uzmanlıklar, virgülle" />
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {expertiseOptions.map((item) => (
                  <label key={item} className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold">
                    <input name={item} type="checkbox" />
                    {item}
                  </label>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">
                  Değerlendirici Ekle
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="h-11 rounded-md border border-slate-200 px-5 text-sm font-bold"
                >
                  İptal
                </button>
              </div>
            </form>
          ) : null}

          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
              <input
                className={inputClass}
                placeholder="Ad, e-posta, kurum veya uzmanlık ara..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <select className={inputClass} value={expertise} onChange={(event) => setExpertise(event.target.value)}>
                <option value="">Uzmanlık</option>
                {expertiseOptions.map((item) => (
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
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Değerlendirici</th>
                  <th className="px-5 py-4">Uzmanlık</th>
                  <th className="px-5 py-4">Atanan</th>
                  <th className="px-5 py-4">Tamamlanan</th>
                  <th className="px-5 py-4">Durum</th>
                  <th className="px-5 py-4">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvaluators.length ? (
                  filteredEvaluators.map((evaluator) => {
                    const assignments = getEvaluatorAssignments(evaluator.email);
                    const completed = assignments.filter((assignment) => assignment.status === "Tamamlandı").length;

                    return (
                      <tr key={evaluator.id}>
                        <td className="px-5 py-4">
                          <p className="font-black">{evaluator.name}</p>
                          <p className="mt-1 text-xs text-slate-400">{evaluator.email}</p>
                        </td>
                        <td className="px-5 py-4">{evaluator.expertise.join(", ") || "-"}</td>
                        <td className="px-5 py-4 font-black">{assignments.length}</td>
                        <td className="px-5 py-4 font-black">{completed}</td>
                        <td className="px-5 py-4">
                          <span className={evaluator.status === "Aktif" ? "font-black text-green-700" : "font-black text-slate-500"}>
                            {evaluator.status === "Aktif" ? "●" : "○"} {evaluator.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Link className="font-black text-cyan-800" href={`/admin/degerlendiriciler/${evaluator.id}`}>
                            İncele →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-5 py-10 text-center text-sm text-slate-500" colSpan={6}>
                      Henüz canlı değerlendirici yok. Yeni değerlendirici ekleyince sayaçlar ve atama listesi güncellenir.
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
