"use client";

import { useEffect, useState } from "react";
import { publicTraining, trainingDate, trainingSchedule } from "@/lib/trainings";
import { readLocalTrainings, trainingsUpdated } from "@/lib/local-trainings";

export default function PublicTrainingSchedule() {
  const [trainings, setTrainings] = useState(trainingSchedule.map(publicTraining));
  useEffect(() => {
    let disposed = false;
    const sync = async () => {
      try {
        const response = await fetch("/api/trainings?view=public", { cache: "no-store", signal: AbortSignal.timeout(6500) });
        if (!response.ok) throw new Error("UNAVAILABLE");
        const result = await response.json() as { trainings: ReturnType<typeof publicTraining>[] };
        if (!disposed) setTrainings(result.trainings);
      } catch { if (!disposed) setTrainings(readLocalTrainings().map(publicTraining)); }
    };
    void sync();
    window.addEventListener(trainingsUpdated, sync); window.addEventListener("storage", sync);
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") void sync(); }, 60_000);
    return () => { disposed = true; window.clearInterval(interval); window.removeEventListener(trainingsUpdated, sync); window.removeEventListener("storage", sync); };
  }, []);
  return <section id="takvim" aria-labelledby="training-calendar-title" className="scroll-mt-24 border-y border-cyan-700/15 bg-white/35">
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="text-sm font-bold text-[#0b7f5a]">Eğitimler</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-5"><div><h2 id="training-calendar-title" className="text-4xl font-black">Eğitim Takvimi</h2><p className="mt-3 text-lg font-semibold text-[#052f36]">Girişimcilik Programı</p></div><div className="border-l-2 border-[#0b7f5a] pl-4"><p className="font-bold text-[#0b7f5a]">Ön Kuluçka</p><p className="mt-1 text-sm text-[#052f36]">02 Kasım 2026 – 19 Aralık 2026</p></div></div>
      <div className="mt-8 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
        {trainings.map((training) => <article key={training.id} aria-labelledby={`public-${training.id}`} className={`flex min-w-0 flex-col rounded-lg border p-5 ${training.week ? "border-cyan-700/20 bg-white/80 text-[#052f36]" : "border-[#0b7f5a]/30 bg-[#052f36] text-white"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold"><p>{training.week ? `${training.week}. Hafta` : <span aria-hidden="true" className="text-2xl">🏆</span>}</p><p>{trainingDate(training.date, true)}</p></div>
          <time dateTime={training.date} className="mt-3 text-sm font-semibold">{trainingDate(training.date)}{training.startTime ? ` · ${training.startTime} – ${training.endTime}` : ""}</time>
          <h3 id={`public-${training.id}`} className="mt-5 break-words text-xl font-bold leading-7">{training.title}</h3>
          {training.status === "cancelled" && <p className="mt-3 text-sm font-bold text-red-600">İptal edildi</p>}
        </article>)}
      </div>
    </div>
  </section>;
}
