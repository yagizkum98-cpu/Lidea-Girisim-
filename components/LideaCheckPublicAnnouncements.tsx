"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DemoDayCandidate,
  defaultDemoDayAnnouncement,
  lideaCheckEventName,
  readDemoDayCandidates,
} from "@/lib/lideacheck";

export default function LideaCheckPublicAnnouncements() {
  const [candidates, setCandidates] = useState<DemoDayCandidate[]>([]);

  useEffect(() => {
    const sync = () => setCandidates(readDemoDayCandidates());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    window.addEventListener(lideaCheckEventName, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener(lideaCheckEventName, sync);
    };
  }, []);

  const visibleAnnouncements = useMemo(
    () =>
      candidates
        .filter((candidate) => candidate.status !== "Aday")
        .sort((a, b) => String(b.decidedAt || b.createdAt).localeCompare(String(a.decidedAt || a.createdAt))),
    [candidates],
  );

  if (!visibleAnnouncements.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="border-y border-cyan-800/15 py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-bold text-[#0b7f5a]">LIDEACHECK DUYURULARI</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight">
              Demo Day son aşama listesi
            </h2>
          </div>
          <p className="max-w-xl text-sm font-semibold leading-6 text-[#052f36]/62">
            Bu alan LideaCheck panelinde verilen canlı kararlarla otomatik güncellenir.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {visibleAnnouncements.map((candidate) => (
            <article className="rounded-lg border border-cyan-700/15 bg-white/55 p-5 shadow-[0_18px_44px_rgba(0,86,102,.08)]" key={candidate.id}>
              <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[.14em]">
                <span className="text-[#0b7f5a]">{candidate.track}</span>
                <span className={candidate.status === "Onaylandı" ? "text-[#00a6c8]" : "text-slate-500"}>
                  {candidate.status}
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-black text-[#052f36]">{candidate.startupName}</h3>
              <p className="mt-3 leading-7 text-[#052f36]/65">
                {candidate.announcement || defaultDemoDayAnnouncement(candidate.status)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
