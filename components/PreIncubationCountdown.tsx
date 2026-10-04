"use client";

import { useEffect, useMemo, useState } from "react";

const targetDate = new Date("2026-12-19T00:00:00+03:00");

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
};

function getTimeLeft(): TimeLeft {
  const difference = targetDate.getTime() - Date.now();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    ended: false,
  };
}

export default function PreIncubationCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const units = useMemo(
    () => [
      ["Gün", timeLeft.days],
      ["Saat", timeLeft.hours],
      ["Dakika", timeLeft.minutes],
      ["Saniye", timeLeft.seconds],
    ],
    [timeLeft],
  );

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <article className="relative overflow-hidden rounded-[1.75rem] border border-cyan-300/25 bg-[#020607] text-white shadow-[0_28px_90px_rgba(0,86,102,.3),0_0_48px_rgba(23,230,210,.22)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(23,230,210,.24),transparent_32%),radial-gradient(circle_at_84%_74%,rgba(138,214,111,.18),transparent_36%)]" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00a6c8] via-[#17e6d2] to-[#8ad66f]" />

        <div className="relative grid gap-8 p-7 sm:p-9 lg:grid-cols-[.82fr_1.18fr] lg:items-end lg:p-12">
          <div>
            <p className="text-sm font-black uppercase tracking-[.2em] text-[#17e6d2]">Ön Kuluçka</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">Ön Kuluçka DEMODAY</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/68">
              19 Aralık 2026 tarihine kalan süre canlı olarak geri sayar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-[#8ad66f] backdrop-blur">
                19 Aralık 2026
              </span>
              <span className="inline-flex rounded-full border border-[#17e6d2]/35 bg-[#17e6d2]/12 px-5 py-3 text-sm font-black text-[#17e6d2] backdrop-blur">
                Online Zoom
              </span>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {units.map(([label, value]) => (
                <div
                  className="rounded-lg border border-white/12 bg-white/10 p-4 text-center shadow-[0_0_24px_rgba(23,230,210,.1)] backdrop-blur"
                  key={label}
                >
                  <p className="text-4xl font-black tabular-nums text-white md:text-5xl">
                    {String(value).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[.16em] text-white/55">{label}</p>
                </div>
              ))}
            </div>

            <p className="mt-5 rounded-lg border border-white/10 bg-white/8 px-4 py-3 text-sm font-bold text-white/72">
              {timeLeft.ended ? "Ön Kuluçka DEMODAY başladı." : "Sayaç otomatik olarak saniye saniye güncellenir."}
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}
