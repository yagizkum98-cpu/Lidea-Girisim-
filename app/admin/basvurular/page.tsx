"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Application,
  ApplicationStatus,
  addAdminActivity,
  applicationStatuses,
  readApplications,
  writeApplications,
} from "@/lib/applications";

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600";

const statusColor: Record<ApplicationStatus, string> = {
  Yeni: "text-blue-700",
  İnceleniyor: "text-yellow-700",
  "Eksik Bilgi": "text-orange-700",
  "Jüriye Gönderildi": "text-purple-700",
  Kabul: "text-green-700",
  Yedek: "text-slate-600",
  Reddedildi: "text-red-700",
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    period: "",
    stage: "",
    sector: "",
    city: "",
    status: "",
  });
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    const sync = () => setApplications(readApplications());
    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("lidea-applications-updated", sync);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("lidea-applications-updated", sync);
    };
  }, []);

  const counts = useMemo(() => {
    const count = (status: ApplicationStatus) =>
      applications.filter((item) => item.status === status).length;
    return {
      all: applications.length,
      new: count("Yeni"),
      review: count("İnceleniyor"),
      missing: count("Eksik Bilgi"),
      jury: count("Jüriye Gönderildi"),
      accepted: count("Kabul"),
      waitlist: count("Yedek"),
      rejected: count("Reddedildi"),
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const searched = applications.filter((item) => {
      const haystack = `${item.startup} ${item.founder} ${item.email}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });

    return searched
      .filter(
        (item) =>
          (!filters.period || item.period === filters.period) &&
          (!filters.stage || item.stage === filters.stage) &&
          (!filters.sector || item.sector === filters.sector) &&
          (!filters.city || item.city === filters.city) &&
          (!filters.status || item.status === filters.status),
      )
      .sort((a, b) => {
        if (sort === "oldest") return a.submittedAt.localeCompare(b.submittedAt);
        if (sort === "score") return b.juryScore - a.juryScore;
        return b.submittedAt.localeCompare(a.submittedAt);
      });
  }, [applications, filters, query, sort]);

  function uniqueOptions(key: keyof Application) {
    return Array.from(new Set(applications.map((item) => String(item[key])).filter(Boolean)));
  }

  function toggleSelected(id: string) {
    setSelectedIds((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  }

  function changeBulkStatus(status: ApplicationStatus) {
    const next = applications.map((application) =>
      selectedIds.includes(application.id)
        ? {
            ...application,
            status,
            updatedAt: new Date().toISOString(),
            statusHistory: [
              {
                id: crypto.randomUUID(),
                applicationId: application.id,
                oldStatus: application.status,
                newStatus: status,
                changedBy: "Admin",
                createdAt: new Date().toISOString(),
              },
              ...application.statusHistory,
            ],
          }
        : application,
    );
    writeApplications(next);
    setApplications(next);
    addAdminActivity("Toplu durum değiştirildi", `${selectedIds.length} başvuru: ${status}`);
    setSelectedIds([]);
  }

  return (
    <main className="min-h-screen bg-[#f6fbfc] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-5">
            <p className="text-lg font-black tracking-tight">LIDEA ADMIN</p>
          </div>
          <nav className="grid gap-1 p-3 text-sm font-semibold">
            <Link className="rounded-md px-3 py-2.5 text-slate-600 hover:bg-slate-100" href="/admin">
              ▣ Dashboard
            </Link>
            <Link className="rounded-md bg-[#063f46] px-3 py-2.5 text-white" href="/admin/basvurular">
              ● Başvurular
            </Link>
            <Link className="rounded-md px-3 py-2.5 text-slate-600 hover:bg-slate-100" href="/juri">
              ▣ Jüri
            </Link>
            <Link className="rounded-md px-3 py-2.5 text-slate-600 hover:bg-slate-100" href="/admin/degerlendiriciler">
              ▣ Değerlendiriciler
            </Link>
            <Link className="rounded-md px-3 py-2.5 text-slate-600 hover:bg-slate-100" href="/admin/mentorlar">
              ▣ Mentorlar
            </Link>
            <Link className="rounded-md px-3 py-2.5 text-slate-600 hover:bg-slate-100" href="/admin/program">
              ▣ Program
            </Link>
          </nav>
        </aside>

        <section className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">
                3. Dönem
              </p>
              <h1 className="mt-1 text-3xl font-black">Başvurular</h1>
              <p className="mt-2 text-sm text-slate-500">Toplam {counts.all} canlı başvuru</p>
            </div>
            <Link
              href="/basvuru"
              className="h-11 rounded-md bg-[#063f46] px-5 py-3 text-sm font-bold text-white"
            >
              + Yeni Başvuru
            </Link>
          </div>

          <section className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-7">
            {[
              ["Tümü", counts.all, ""],
              ["Yeni", counts.new, "Yeni"],
              ["İncelemede", counts.review, "İnceleniyor"],
              ["Eksik Bilgi", counts.missing, "Eksik Bilgi"],
              ["Jüride", counts.jury, "Jüriye Gönderildi"],
              ["Kabul", counts.accepted, "Kabul"],
              ["Yedek", counts.waitlist, "Yedek"],
            ].map(([label, count, status]) => (
              <button
                key={label}
                onClick={() => setFilters({ ...filters, status: String(status) })}
                className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm"
              >
                <p className="text-2xl font-black">{count}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[.12em] text-slate-500">
                  {label}
                </p>
              </button>
            ))}
          </section>

          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
            <div className="grid gap-3 xl:grid-cols-[1fr_160px_160px_160px_160px_160px]">
              <input
                className={inputClass}
                placeholder="Ara: Girişim / Kurucu / E-posta..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {(["period", "stage", "sector", "city", "status"] as const).map((key) => (
                <select
                  key={key}
                  className={inputClass}
                  value={filters[key]}
                  onChange={(event) => setFilters({ ...filters, [key]: event.target.value })}
                >
                  <option value="">
                    {key === "period"
                      ? "Dönem"
                      : key === "stage"
                        ? "Aşama"
                        : key === "sector"
                          ? "Sektör"
                          : key === "city"
                            ? "Şehir"
                            : "Durum"}
                  </option>
                  {(key === "status" ? applicationStatuses : uniqueOptions(key)).map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <select className={inputClass} value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="newest">En Yeni</option>
                <option value="oldest">En Eski</option>
                <option value="score">En Yüksek Jüri Puanı</option>
              </select>
              {selectedIds.length ? (
                <>
                  <span className="text-sm font-black text-cyan-800">
                    {selectedIds.length} başvuru seçildi
                  </span>
                  <select
                    className={inputClass}
                    defaultValue=""
                    onChange={(event) => changeBulkStatus(event.target.value as ApplicationStatus)}
                  >
                    <option value="" disabled>
                      Durum Değiştir
                    </option>
                    {applicationStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </>
              ) : null}
            </div>
          </section>

          <section className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Seç</th>
                  <th className="px-5 py-4">Girişim</th>
                  <th className="px-5 py-4">Kurucu</th>
                  <th className="px-5 py-4">Aşama</th>
                  <th className="px-5 py-4">Tarih</th>
                  <th className="px-5 py-4">Durum</th>
                  <th className="px-5 py-4">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.length ? (
                  filteredApplications.map((application) => (
                    <tr key={application.id}>
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(application.id)}
                          onChange={() => toggleSelected(application.id)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-black">{application.startup}</p>
                        <p className="mt-1 text-xs text-slate-400">{application.applicationNumber}</p>
                      </td>
                      <td className="px-5 py-4">{application.founder || "-"}</td>
                      <td className="px-5 py-4">{application.stage}</td>
                      <td className="px-5 py-4">{application.submittedAt}</td>
                      <td className={`px-5 py-4 font-black ${statusColor[application.status]}`}>
                        {application.status}
                      </td>
                      <td className="px-5 py-4">
                        <Link className="font-black text-cyan-800" href={`/admin/basvurular/${application.id}`}>
                          İncele →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-10 text-slate-500" colSpan={7}>
                      Henüz canlı başvuru yok. Başvuru formu doldurulduğunda bu listeye düşer.
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
