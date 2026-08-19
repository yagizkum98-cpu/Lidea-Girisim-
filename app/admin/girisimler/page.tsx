"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Startup,
  StartupStatus,
  normalizeStartup,
  readStartups,
  startupStatuses,
  syncAcceptedApplicationsToStartups,
  writeStartups,
} from "@/lib/startups";

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600";

export default function StartupsPage() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ period: "", sector: "", stage: "", status: "" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const sync = () => setStartups(syncAcceptedApplicationsToStartups());
    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("lidea-startups-updated", sync);
    window.addEventListener("lidea-applications-updated", sync);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("lidea-startups-updated", sync);
      window.removeEventListener("lidea-applications-updated", sync);
    };
  }, []);

  const counts = useMemo(
    () => ({
      total: startups.length,
      active: startups.filter((startup) => startup.status === "Aktif").length,
      mvp: startups.filter((startup) => startup.stage.toLowerCase().includes("mvp")).length,
      demoReady: startups.filter((startup) => startup.status === "Demo Day Hazır").length,
    }),
    [startups],
  );

  const filteredStartups = useMemo(() => {
    return startups
      .filter((startup) =>
        `${startup.name} ${startup.founder} ${startup.sector}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
      .filter(
        (startup) =>
          (!filters.period || startup.programId === filters.period) &&
          (!filters.sector || startup.sector === filters.sector) &&
          (!filters.stage || startup.stage === filters.stage) &&
          (!filters.status || startup.status === filters.status),
      );
  }, [filters, query, startups]);

  function uniqueOptions(key: keyof Startup) {
    return Array.from(new Set(startups.map((startup) => String(startup[key])).filter(Boolean)));
  }

  function addStartup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startup = normalizeStartup({
      id: `ST-${Date.now().toString().slice(-6)}`,
      applicationId: "",
      programId: "program-3",
      name: String(form.get("name") || ""),
      founder: String(form.get("founder") || ""),
      sector: String(form.get("sector") || "Belirtilmedi"),
      stage: String(form.get("stage") || "MVP"),
      website: String(form.get("website") || ""),
      status: "Aktif",
      progress: 0,
      acceptedAt: new Date().toISOString().slice(0, 10),
    });
    const nextStartups = [startup, ...readStartups()];
    writeStartups(nextStartups);
    setStartups(nextStartups);
    setShowForm(false);
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
            <Link className="rounded-md px-3 py-2.5 text-slate-600 hover:bg-slate-100" href="/admin">
              ▣ Dashboard
            </Link>
            <Link className="rounded-md px-3 py-2.5 text-slate-600 hover:bg-slate-100" href="/admin/basvurular">
              ▣ Başvurular
            </Link>
            <Link className="rounded-md bg-[#063f46] px-3 py-2.5 text-white" href="/admin/girisimler">
              ● Girişimler
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
            <Link className="rounded-md px-3 py-2.5 text-slate-600 hover:bg-slate-100" href="/admin/bildirimler">
              ▣ Bildirimler
            </Link>
            <Link className="rounded-md px-3 py-2.5 text-slate-600 hover:bg-slate-100" href="/admin/raporlar">
              ▣ Raporlar
            </Link>
            <Link className="rounded-md px-3 py-2.5 text-slate-600 hover:bg-slate-100" href="/admin/ayarlar">
              ⚙ Ayarlar
            </Link>
          </nav>
        </aside>

        <section className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">
                Lidea Girişim Programı / 3. Dönem
              </p>
              <h1 className="mt-1 text-3xl font-black">Girişimler</h1>
              <p className="mt-2 text-sm text-slate-500">{counts.active} aktif girişim</p>
            </div>
            <button
              onClick={() => setShowForm((value) => !value)}
              className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white"
            >
              + Girişim Ekle
            </button>
          </div>

          <section className="mt-6 grid gap-3 md:grid-cols-4">
            {[
              [counts.total, "Toplam Girişim"],
              [counts.active, "Aktif"],
              [counts.mvp, "MVP Aşamasında"],
              [counts.demoReady, "Demo Day'e Hazır"],
            ].map(([value, label]) => (
              <article key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-3xl font-black">{value}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[.12em] text-slate-500">
                  {label}
                </p>
              </article>
            ))}
          </section>

          {showForm ? (
            <form onSubmit={addStartup} className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-3">
              <input name="name" placeholder="Girişim adı" required className={inputClass} />
              <input name="founder" placeholder="Kurucu" className={inputClass} />
              <input name="sector" placeholder="Sektör" className={inputClass} />
              <input name="stage" placeholder="Aşama" defaultValue="MVP" className={inputClass} />
              <input name="website" placeholder="Web sitesi" className={inputClass} />
              <button className="h-11 rounded-md bg-cyan-700 px-5 text-sm font-bold text-white">
                Kaydet
              </button>
            </form>
          ) : null}

          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
            <div className="grid gap-3 xl:grid-cols-[1fr_170px_170px_170px]">
              <input
                className={inputClass}
                placeholder="Girişim, kurucu veya sektör ara..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <select
                className={inputClass}
                value={filters.sector}
                onChange={(event) => setFilters({ ...filters, sector: event.target.value })}
              >
                <option value="">Sektör</option>
                {uniqueOptions("sector").map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              <select
                className={inputClass}
                value={filters.stage}
                onChange={(event) => setFilters({ ...filters, stage: event.target.value })}
              >
                <option value="">Aşama</option>
                {uniqueOptions("stage").map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              <select
                className={inputClass}
                value={filters.status}
                onChange={(event) => setFilters({ ...filters, status: event.target.value })}
              >
                <option value="">Durum</option>
                {startupStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Girişim</th>
                  <th className="px-5 py-4">Kurucu</th>
                  <th className="px-5 py-4">Sektör</th>
                  <th className="px-5 py-4">Aşama</th>
                  <th className="px-5 py-4">Durum</th>
                  <th className="px-5 py-4">İlerleme</th>
                  <th className="px-5 py-4">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStartups.length ? (
                  filteredStartups.map((startup) => (
                    <tr key={startup.id}>
                      <td className="px-5 py-4 font-black">{startup.name}</td>
                      <td className="px-5 py-4">{startup.founder || "-"}</td>
                      <td className="px-5 py-4">{startup.sector}</td>
                      <td className="px-5 py-4">{startup.stage}</td>
                      <td className="px-5 py-4 font-black text-green-700">● {startup.status}</td>
                      <td className="px-5 py-4">%{startup.progress}</td>
                      <td className="px-5 py-4">
                        <Link className="font-black text-cyan-800" href={`/admin/girisimler/${startup.id}`}>
                          İncele →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-10 text-slate-500" colSpan={7}>
                      Henüz canlı girişim yok. Başvurular modülünde bir başvuru kabul edildiğinde
                      otomatik oluşur veya manuel girişim ekleyebilirsiniz.
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
