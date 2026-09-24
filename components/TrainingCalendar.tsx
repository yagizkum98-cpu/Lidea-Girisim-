"use client";

import { useState } from "react";

type CalendarMode = "pre" | "incubation" | "demoday";
type Training = { date: string; time: string; trainer: string; title: string };

const preIncubationTrainings: Training[] = [
  { date: "22 Aralık 2025", time: "20.00 - 21.00", trainer: "Mine Dedekoca", title: "İş Modeli Şablonu" },
  { date: "29 Aralık 2025", time: "20.00 - 21.00", trainer: "Rıza Güler", title: "Hedef Müşteri Analizi" },
  { date: "05 Ocak 2026", time: "20.00 - 21.00", trainer: "Murat Nuri Avcı", title: "Değer Önerisi" },
  { date: "12 Ocak 2026", time: "20.00 - 21.00", trainer: "Murat Özanlar", title: "Sorun ve Çözüm" },
  { date: "19 Ocak 2026", time: "20.00 - 21.00", trainer: "Aziz Ahmedov", title: "Pazar Analizi ve Odaklanmış Giriş Pazarı" },
  { date: "26 Ocak 2026", time: "20.00 - 21.00", trainer: "Mine Turalı", title: "Takım Kültürü ve Yönetimi" },
  { date: "02 Şubat 2026", time: "20.00 - 21.00", trainer: "Altan Türel", title: "Tek Cümlelik İş Tanımı ve Özet İş Sunumu" },
  { date: "09 Şubat 2026", time: "20.00 - 21.00", trainer: "Salime Funda Akçakaya Kılıç", title: "Maliyet ve Gelir Yapısı" },
  { date: "16 Şubat 2026", time: "20.00 - 21.00", trainer: "Mahmut Dabbit", title: "İş Fikri Sunumu Eğitimi" },
  { date: "20 Şubat 2026", time: "20.00 - 21.00", trainer: "Lidea", title: "Online Ön Kuluçka Demo Day" },
];

const incubationTrainings: Training[] = [
  { date: "09 Mart 2026", time: "20.00 - 22.00", trainer: "Lidea", title: "Tanışma" },
  { date: "12 Mart 2026", time: "20.00 - 22.00", trainer: "Murat Özanlar", title: "Validasyon ve Doğrulama" },
  { date: "16 Mart 2026", time: "20.00 - 22.00", trainer: "Rıza Gürler", title: "İş Modelleri" },
  { date: "25 Mart 2026", time: "20.00 - 22.00", trainer: "Başak Kaftan", title: "Ürün, Girişim ve Ar-Ge" },
  { date: "26 Mart 2026", time: "20.00 - 22.00", trainer: "Lütfi AyDeniz", title: "Pazar Analizi" },
  { date: "30 Mart 2026", time: "20.00 - 22.00", trainer: "Emre Gökşin", title: "Satış ve Pazarlama" },
  { date: "01 Nisan 2026", time: "20.00 - 22.00", trainer: "Altan Türel ve Mahmut Dabbit", title: "Yapay Zeka ile Prototip ve Pazarlama" },
  { date: "06 Nisan 2026", time: "20.00 - 22.00", trainer: "Ercan Altuğ Yılmaz", title: "Girişimcilikte Oyunlaştırma" },
  { date: "08 Nisan 2026", time: "20.00 - 22.00", trainer: "Okan Otuz", title: "Girişimcilik Ekosistem Fonları" },
  { date: "13 Nisan 2026", time: "20.00 - 22.00", trainer: "Ufuk Batum", title: "Yatırımcı Bakışı ve Sunum Teknikleri" },
  { date: "15 Nisan 2026", time: "20.00 - 22.00", trainer: "FarkLabs", title: "Finansal Hazırlık ve Metrikler" },
  { date: "20 Nisan 2026", time: "20.00 - 22.00", trainer: "Gürbüz Sarı", title: "Fikri ve Sınai Mülkiyet ile Hukuk" },
  { date: "21 Nisan - 01 Mayıs", time: "Program dahilinde", trainer: "Lidea Mentorları", title: "Demo Day Mentorluğu" },
];

function TrainingGrid({ trainings }: { trainings: Training[] }) {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {trainings.map((training, index) => (
        <article
          className="relative min-h-64 overflow-hidden rounded-lg border border-cyan-600/20 bg-white/55 p-6 shadow-[0_18px_50px_rgba(0,86,102,.12)] backdrop-blur"
          key={`${training.date}-${training.title}`}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00a6c8] via-[#17e6d2] to-[#8ad66f]" />
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-black text-[#00a6c8]">{String(index + 1).padStart(2, "0")}</p>
            <p className="text-right text-xs font-bold uppercase text-[#0b7f5a]">{training.date}</p>
          </div>
          <h3 className="mt-8 text-2xl font-black leading-tight text-[#052f36]">{training.title}</h3>
          <div className="mt-8 border-t border-cyan-800/15 pt-4">
            <p className="font-bold text-[#052f36]">{training.trainer}</p>
            <p className="mt-1 text-sm text-[#052f36]/60">{training.time}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function TrainingCalendar() {
  const [active, setActive] = useState<CalendarMode>("pre");
  const tabClass = (mode: CalendarMode) =>
    `rounded-full px-6 py-3 text-sm font-bold transition ${active === mode ? "bg-[#063f46] text-white shadow-[0_0_22px_rgba(23,230,210,.38)]" : "text-[#063f46]"}`;

  return (
    <section id="takvim" className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
        <div>
          <p className="font-bold text-[#0b7f5a]">2026 II. DÖNEM</p>
          <h2 className="mt-3 text-5xl font-black tracking-tight">Eğitim Takvimi</h2>
        </div>
        <div className="flex justify-start lg:justify-end">
          <div className="inline-flex flex-wrap rounded-full border border-cyan-700/20 bg-white/35 p-1 shadow-[0_0_28px_rgba(23,230,210,.22)] backdrop-blur">
            <button className={tabClass("pre")} onClick={() => setActive("pre")} type="button">Ön Kuluçka</button>
            <button className={tabClass("incubation")} onClick={() => setActive("incubation")} type="button">Kuluçka</button>
            <button className={tabClass("demoday")} onClick={() => setActive("demoday")} type="button">Demo Day</button>
          </div>
        </div>
      </div>

      {active === "pre" ? <TrainingGrid trainings={preIncubationTrainings} /> : null}
      {active === "incubation" ? <TrainingGrid trainings={incubationTrainings} /> : null}
      {active === "demoday" ? (
        <div className="mt-10 overflow-hidden rounded-lg bg-[#052f36] text-white shadow-[0_24px_70px_rgba(0,86,102,.22)]">
          <div className="grid min-h-80 gap-8 p-8 md:grid-cols-[1fr_auto] md:items-end md:p-12">
            <div>
              <p className="font-bold text-[#17e6d2]">FKM, FETHİYE</p>
              <h3 className="mt-4 text-5xl font-black">Lidea Demo Day</h3>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
                Girişimler sunumlarını yatırımcılar, jüri üyeleri ve girişimcilik ekosistemi temsilcileriyle paylaşır.
              </p>
            </div>
            <div className="border-l border-white/20 pl-8">
              <p className="text-3xl font-black text-[#8ad66f]">09 Mayıs 2026</p>
              <p className="mt-2 font-bold text-white/70">10.00 - 17.30</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
