"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Application,
  ApplicationStatus,
  addAdminActivity,
  applicationStatuses,
  preEvaluationItems,
  readApplications,
  saveApplication,
} from "@/lib/applications";

const usersStorageKey = "lidea-admin-users";

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600";

function readEvaluators() {
  const saved = window.localStorage.getItem(usersStorageKey);
  if (!saved) return [];

  try {
    return (JSON.parse(saved) as { name: string; email: string; role: string }[]).filter((user) =>
      ["Değerlendirme Yetkilisi", "Mentor", "Admin", "Süper Admin"].includes(user.role),
    );
  } catch {
    return [];
  }
}

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [tab, setTab] = useState("Genel Bilgiler");
  const [evaluators, setEvaluators] = useState<{ name: string; email: string; role: string }[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const applications = readApplications();
    setApplication(applications.find((item) => item.id === params.id) || null);
    setEvaluators(readEvaluators());
  }, [params.id]);

  function persist(nextApplication: Application, message: string) {
    saveApplication({ ...nextApplication, updatedAt: new Date().toISOString() });
    setApplication({ ...nextApplication, updatedAt: new Date().toISOString() });
    setNotice(message);
  }

  function changeStatus(nextStatus: ApplicationStatus) {
    if (!application) return;
    const oldStatus = application.status;
    const confirmed = window.confirm(
      `${application.startup} başvurusunu "${nextStatus}" durumuna almak istiyor musunuz?`,
    );
    if (!confirmed) return;

    const nextApplication = {
      ...application,
      status: nextStatus,
      statusHistory: [
        {
          id: crypto.randomUUID(),
          applicationId: application.id,
          oldStatus,
          newStatus: nextStatus,
          changedBy: "Admin",
          createdAt: new Date().toISOString(),
        },
        ...application.statusHistory,
      ],
    };
    persist(nextApplication, "Durum güncellendi.");
    addAdminActivity("Başvuru durumu değişti", `${application.startup}: ${oldStatus} → ${nextStatus}`);
  }

  function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!application) return;
    const form = new FormData(event.currentTarget);
    persist({ ...application, adminNote: String(form.get("adminNote") || "") }, "Admin notu kaydedildi.");
  }

  function savePreEvaluation() {
    if (!application) return;
    persist(application, "Ön değerlendirme kaydedildi.");
  }

  function requestMissingInfo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!application) return;
    const form = new FormData(event.currentTarget);
    const request = String(form.get("missingInfoRequest") || "").trim();
    if (!request) return;
    persist({ ...application, missingInfoRequest: request, status: "Eksik Bilgi" }, "Eksik bilgi talebi gönderildi.");
    addAdminActivity("Eksik bilgi istendi", application.startup);
  }

  function assignJury(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!application) return;
    const form = new FormData(event.currentTarget);
    const juryAssignees = evaluators
      .filter((evaluator) => form.get(evaluator.email) === "on")
      .map((evaluator) => evaluator.email);
    const juryDeadline = String(form.get("juryDeadline") || "");
    persist(
      {
        ...application,
        juryAssignees,
        juryDeadline,
        status: "Jüriye Gönderildi",
      },
      "Başvuru jüriye gönderildi.",
    );
    addAdminActivity("Başvuru jüriye gönderildi", application.startup);
  }

  const averageScore = useMemo(() => application?.juryScore || application?.score || 0, [application]);

  if (!application) {
    return (
      <main className="min-h-screen bg-[#f6fbfc] p-6 text-slate-950">
        <section className="rounded-lg border border-slate-200 bg-white p-8">
          <h1 className="text-2xl font-black">Başvuru bulunamadı</h1>
          <Link className="mt-5 inline-block font-black text-cyan-800" href="/admin/basvurular">
            ← Başvurulara dön
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6fbfc] p-6 text-slate-950">
      <Link className="font-black text-cyan-800" href="/admin/basvurular">
        ← Başvurular
      </Link>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">
              Başvuru #{application.applicationNumber}
            </p>
            <h1 className="mt-2 text-4xl font-black">{application.startup}</h1>
            <p className="mt-2 text-sm text-slate-500">{application.submittedAt}</p>
          </div>
          <span className="rounded-md bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-900">
            {application.status}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {["Genel Bilgiler", "Girişim", "Ekip", "Belgeler", "Değerlendirme"].map((item) => (
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
          {tab === "Genel Bilgiler" ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Girişim Adı", application.startup],
                ["Aşama", application.stage],
                ["Sektör", application.sector],
                ["Şehir", application.city],
                ["Web Sitesi", application.website || "-"],
                ["Ekip Büyüklüğü", String(application.teamSize)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">{label}</p>
                  <p className="mt-2 font-black">{value}</p>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "Girişim" ? (
            <div className="space-y-6">
              {[
                ["Problem", application.problem],
                ["Çözüm", application.solution],
                ["Hedef Kitle", application.targetMarket],
                ["İş Modeli", application.businessModel],
                ["Rakipler", application.competitors],
                ["Farklılaşma", application.differentiation],
                ["Mevcut Traction", application.traction],
                ["Gelecek Hedefleri", application.futureGoals],
              ].map(([label, value]) => (
                <div key={label}>
                  <h2 className="text-sm font-black uppercase tracking-[.14em] text-cyan-800">{label}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                    {value || "Bilgi girilmedi."}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "Ekip" ? (
            <div>
              <h2 className="text-xl font-black">Kurucu</h2>
              <div className="mt-4 rounded-md bg-slate-50 p-4">
                <p className="font-black">{application.founder || "-"}</p>
                <p className="mt-2 text-sm text-slate-500">E-posta: {application.email || "-"}</p>
                <p className="mt-1 text-sm text-slate-500">Telefon: {application.phone || "-"}</p>
              </div>
            </div>
          ) : null}

          {tab === "Belgeler" ? (
            <div>
              <h2 className="text-xl font-black">Belgeler</h2>
              <div className="mt-4 space-y-3">
                {application.documents.length ? (
                  application.documents.map((document) => (
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
            </div>
          ) : null}

          {tab === "Değerlendirme" ? (
            <div className="space-y-6">
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-500">Ortalama</p>
                <p className="mt-2 text-3xl font-black">{averageScore} / 100</p>
              </div>
              <form onSubmit={saveNote}>
                <label className="text-sm font-black">
                  Admin Notu
                  <textarea
                    name="adminNote"
                    defaultValue={application.adminNote}
                    rows={5}
                    className="mt-2 w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-cyan-600"
                  />
                </label>
                <button className="mt-3 h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">
                  Kaydet
                </button>
              </form>
              <div>
                <h2 className="text-lg font-black">Ön Değerlendirme</h2>
                <div className="mt-3 grid gap-2">
                  {preEvaluationItems.map((item) => (
                    <label key={item} className="flex items-center gap-3 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={application.preEvaluation[item]}
                        onChange={(event) =>
                          setApplication({
                            ...application,
                            preEvaluation: {
                              ...application.preEvaluation,
                              [item]: event.target.checked,
                            },
                          })
                        }
                      />
                      {item}
                    </label>
                  ))}
                </div>
                <button
                  onClick={savePreEvaluation}
                  className="mt-3 h-10 rounded-md border border-slate-200 px-4 text-sm font-bold"
                >
                  Ön Değerlendirmeyi Kaydet
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black">Admin İşlemleri</h2>
            <div className="mt-4 grid gap-3">
              {(["İnceleniyor", "Jüriye Gönderildi", "Kabul", "Yedek", "Reddedildi"] as ApplicationStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => changeStatus(status)}
                    className="h-11 rounded-md border border-slate-200 bg-white px-4 text-sm font-black hover:bg-slate-50"
                  >
                    {status === "İnceleniyor"
                      ? "İncelemeye Al"
                      : status === "Jüriye Gönderildi"
                        ? "Jüriye Gönder"
                        : status}
                  </button>
                ),
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black">Jüriye Ata</h2>
            <form onSubmit={assignJury} className="mt-4 grid gap-3">
              {evaluators.length ? (
                evaluators.map((evaluator) => (
                  <label key={evaluator.email} className="flex items-center gap-3 text-sm font-semibold">
                    <input
                      name={evaluator.email}
                      type="checkbox"
                      defaultChecked={application.juryAssignees.includes(evaluator.email)}
                    />
                    {evaluator.name} ({evaluator.role})
                  </label>
                ))
              ) : (
                <p className="text-sm text-slate-500">Henüz değerlendirici tanımlanmadı.</p>
              )}
              <input
                name="juryDeadline"
                type="date"
                defaultValue={application.juryDeadline}
                className={inputClass}
              />
              <button className="h-11 rounded-md bg-[#063f46] px-4 text-sm font-bold text-white">
                Jüriye Gönder
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black">Eksik Bilgi İste</h2>
            <form onSubmit={requestMissingInfo} className="mt-4 grid gap-3">
              <textarea
                name="missingInfoRequest"
                defaultValue={application.missingInfoRequest}
                rows={4}
                className="rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-cyan-600"
                placeholder="Pitch deck dosyanızı sisteme yüklemenizi rica ediyoruz."
              />
              <button className="h-11 rounded-md bg-orange-600 px-4 text-sm font-bold text-white">
                Talebi Gönder
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black">Durum Geçmişi</h2>
            <div className="mt-4 space-y-3">
              {application.statusHistory.length ? (
                application.statusHistory.map((history) => (
                  <div key={history.id} className="rounded-md bg-slate-50 p-3 text-sm">
                    <p className="font-black">
                      {history.oldStatus} → {history.newStatus}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{history.createdAt}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Henüz durum geçmişi yok.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
