"use client";

import { useState } from "react";

const weeks = Array.from({ length: 8 }, (_, index) => index + 1);
const jurySlots = Array.from({ length: 4 }, (_, index) => index + 1);

type CalendarMode = "pre" | "incubation" | "demoday";

export default function TrainingCalendar() {
  const [active, setActive] = useState<CalendarMode>("pre");

  const tabClass = (mode: CalendarMode) =>
    `rounded-full px-6 py-3 text-sm font-bold transition ${
      active === mode
        ? "bg-[#063f46] text-white shadow-[0_0_22px_rgba(23,230,210,.38)]"
        : "text-[#063f46]"
    }`;

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
        <div>
          <p className="font-bold text-[#0b7f5a]">PROGRAM YOLCULUĞU</p>
          <h2 className="mt-3 text-5xl font-black tracking-tight">Eğitim Takvimi</h2>
        </div>
        <div className="flex justify-start lg:justify-end">
          <div className="inline-flex flex-wrap rounded-full border border-cyan-700/20 bg-white/35 p-1 shadow-[0_0_28px_rgba(23,230,210,.22)] backdrop-blur">
            <button className={tabClass("pre")} onClick={() => setActive("pre")} type="button">
              Ön Kuluçka
            </button>
            <button
              className={tabClass("incubation")}
              onClick={() => setActive("incubation")}
              type="button"
            >
              Kuluçka
            </button>
            <button
              className={tabClass("demoday")}
              onClick={() => setActive("demoday")}
              type="button"
            >
              DemoDay
            </button>
          </div>
        </div>
      </div>

      {active === "pre" ? (
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {weeks.map((week) => (
            <article
              className="relative min-h-[210px] overflow-hidden rounded-[1.5rem] border border-cyan-600/20 bg-white/50 p-5 shadow-[0_22px_60px_rgba(0,86,102,.13),0_0_28px_rgba(23,230,210,.16)] backdrop-blur"
              key={week}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00a6c8] via-[#17e6d2] to-[#8ad66f]" />
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#17e6d2]/20 blur-2xl" />
              <p className="text-sm font-black text-[#00a6c8]/75">{week}. HAFTA</p>
              <div className="mt-10 rounded-2xl border border-cyan-700/15 bg-[#eafff8]/75 p-4">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0b7f5a]">
                  Eğitim Adı
                </p>
                <p className="mt-2 text-xl font-black text-[#052f36]">Boş</p>
              </div>
              <div className="mt-4 rounded-2xl border border-cyan-700/15 bg-white/60 p-4">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0b7f5a]">
                  Eğitmen
                </p>
                <p className="mt-2 text-base font-black text-[#052f36]">Boş</p>
              </div>
              <div className="mt-4 rounded-2xl border border-cyan-700/15 bg-white/60 p-4">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0b7f5a]">
                  Tarih
                </p>
                <p className="mt-2 text-base font-black text-[#052f36]">
                  Sonradan belirlenecek
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {active === "incubation" ? (
        <div className="card mt-10 overflow-hidden p-8">
          <div className="rounded-[1.5rem] border border-cyan-700/15 bg-gradient-to-br from-[#eafff8]/80 via-white/55 to-[#d8fbff]/70 p-8 text-center shadow-[0_0_34px_rgba(23,230,210,.18)]">
            <p className="text-sm font-black text-[#00a6c8]/75">KULUÇKA TAKVİMİ</p>
            <h3 className="mt-4 text-4xl font-black text-[#052f36]">
              Daha sonra belirlenecek
            </h3>
          </div>
        </div>
      ) : null}

      {active === "demoday" ? (
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {jurySlots.map((slot) => (
            <article
              className="relative overflow-hidden rounded-[1.5rem] border border-cyan-600/20 bg-white/50 p-5 text-center shadow-[0_22px_60px_rgba(0,86,102,.13),0_0_28px_rgba(23,230,210,.16)] backdrop-blur"
              key={slot}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00a6c8] via-[#17e6d2] to-[#8ad66f]" />
              <div className="mx-auto mt-3 flex aspect-square w-full max-w-[190px] items-center justify-center rounded-[1.35rem] border border-cyan-700/15 bg-gradient-to-br from-white/65 via-[#d8fbff]/60 to-[#eafff8]/70 shadow-[0_0_28px_rgba(23,230,210,.2)]">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-cyan-700/20 bg-white/65 text-4xl font-black text-[#00a6c8]/45">
                  +
                </div>
              </div>
              <h3 className="mt-6 text-2xl font-black text-[#052f36]">Jüri {slot}</h3>
              <div className="mt-4 rounded-2xl border border-cyan-700/15 bg-[#eafff8]/75 p-4">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0b7f5a]">
                  Ünvan
                </p>
                <p className="mt-2 text-base font-black text-[#052f36]">Boş</p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
