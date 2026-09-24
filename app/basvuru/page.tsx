"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "@/components/Header";
import { addAdminActivity, normalizeApplication, readApplications, writeApplications } from "@/lib/applications";
import { sectorOptions } from "@/lib/application-options";
import turkeyLocations from "@/lib/turkey-locations.json";

const programStorageKey = "lidea-program";
const programExpectationOptions = [
  "Satış ve Pazarlama",
  "Mentorluk",
  "Eğitim",
  "Network",
  "Diğer",
] as const;

type ProgramSettings = {
  period: string;
  applicationOpen: boolean;
  applicationDeadline: string;
  requiredStages: string[];
};

const fallbackProgram: ProgramSettings = {
  period: "3. Dönem",
  applicationOpen: true,
  applicationDeadline: "",
  requiredStages: ["Fikir", "Prototip", "MVP", "İlk Müşteri", "Gelir Elde Ediyor"],
};

function readProgramSettings() {
  const saved = window.localStorage.getItem(programStorageKey);
  if (!saved) return fallbackProgram;

  try {
    return { ...fallbackProgram, ...(JSON.parse(saved) as ProgramSettings) };
  } catch {
    return fallbackProgram;
  }
}

export default function Apply() {
  const [sent, setSent] = useState(false);
  const [program, setProgram] = useState(fallbackProgram);
  const [programExpectations, setProgramExpectations] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");

  const districts =
    turkeyLocations.find((location) => location.province === selectedProvince)?.districts || [];

  useEffect(() => {
    const syncProgram = () => setProgram(readProgramSettings());
    syncProgram();
    window.addEventListener("storage", syncProgram);
    window.addEventListener("focus", syncProgram);
    window.addEventListener("lidea-program-updated", syncProgram);

    return () => {
      window.removeEventListener("storage", syncProgram);
      window.removeEventListener("focus", syncProgram);
      window.removeEventListener("lidea-program-updated", syncProgram);
    };
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!program.applicationOpen) return;

    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());
    const expectations = form.getAll("programExpectations").map(String);
    const apiData = {
      ...data,
      programId: "program-3",
      founder: String(data.name || ""),
      startupName: String(data.startup || ""),
      kvkkAccepted: form.get("kvkkAccepted") === "on",
      programExpectations: expectations,
      programExpectationOther: expectations.includes("Diğer")
        ? String(data.programExpectationOther || "")
        : "",
    };
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiData),
    });

    if (response.ok) {
      const result = (await response.json()) as { application: Record<string, unknown> };
      const applications = readApplications();
      const id = String(result.application.id);
      const application = normalizeApplication({
        ...result.application,
        id,
        applicationNumber: String(result.application.applicationNo || id),
        founder: String(data.name || ""),
        founderId: String(data.email || ""),
        email: String(data.email || ""),
        phone: String(data.phone || ""),
        startup: String(data.startup || ""),
        startupName: String(data.startup || ""),
        period: program.period,
        sector: String(data.sector || "Belirtilmedi"),
        city: String(data.city || ""),
        district: String(data.district || ""),
        stage: String(data.stage || program.requiredStages[0] || "Fikir"),
        website: String(data.website || ""),
        teamSize: Number(data.teamSize || 1),
        score: 0,
        juryScore: 0,
        status: "Yeni",
        problem: String(data.problem || ""),
        solution: String(data.solution || ""),
        targetMarket: String(data.targetMarket || ""),
        businessModel: String(data.businessModel || ""),
        competitors: String(data.competitors || ""),
        differentiation: String(data.differentiation || ""),
        traction: String(data.traction || ""),
        futureGoals: String(data.futureGoals || ""),
        programExpectations: expectations,
        programExpectationOther: apiData.programExpectationOther,
        kvkkAccepted: apiData.kvkkAccepted,
        kvkkAcceptedAt: String(result.application.kvkkAcceptedAt || new Date().toISOString()),
        submittedAt: String(result.application.createdAt || new Date().toISOString()).slice(0, 10),
        updatedAt: String(result.application.updatedAt || new Date().toISOString()),
      });

      writeApplications([application, ...applications.filter((item) => item.id !== id)]);
      addAdminActivity("Yeni başvuru alındı", application.startup);
      setSent(true);
    }
  }

  return (
    <main>
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-20">
        <img
          src="/lidea-logo.svg"
          alt="Lidea Yalın Idea Girişim Programı"
          className="h-auto w-64 max-w-full"
        />
        <h1 className="mt-8 text-5xl font-black">{program.period} Başvuru Formu</h1>
        <p className="mt-4 text-[#052f36]/65">
          Başvuru durumu ve kabul edilen girişim aşamaları admin panelindeki Program Yönetimi
          ayarlarına göre canlı güncellenir.
        </p>

        {!program.applicationOpen ? (
          <div className="mt-10 rounded-3xl border border-cyan-700/20 bg-white/80 p-8 shadow-[0_0_28px_rgba(23,230,210,.16)]">
            <b>Başvurular sona erdi.</b>
            <p className="mt-2 text-[#052f36]/65">
              {program.applicationDeadline
                ? `Son başvuru tarihi: ${program.applicationDeadline}`
                : "Yeni başvuru alımı şu anda kapalı."}
            </p>
          </div>
        ) : sent ? (
          <div className="mt-10 rounded-3xl border border-[#17e6d2]/30 bg-[#eafff8]/80 p-8 shadow-[0_0_28px_rgba(23,230,210,.22)]">
            <b>Başvuru alındı.</b>
            <p className="mt-2">Başvurunuz admin panelindeki canlı başvuru listesine iletildi.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10 grid gap-5">
            {[ 
              ["name", "Ad Soyad"],
              ["email", "E-posta"],
              ["password", "Girişimci Paneli Şifresi"],
              ["phone", "Telefon"],
              ["startup", "Girişim Adı"],
              ["website", "Web Sitesi"],
            ].map(([name, label]) => (
              <label className="font-bold" key={name}>
                {label}
                <input
                  name={name}
                  type={name === "password" ? "password" : "text"}
                  minLength={name === "password" ? 8 : undefined}
                  required
                  className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8] focus:shadow-[0_0_24px_rgba(23,230,210,.28)]"
                />
              </label>
            ))}
            <label className="font-bold">
              Sektör Kategorisi
              <select
                name="sector"
                required
                defaultValue=""
                className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8]"
              >
                <option value="" disabled>Sektör seçiniz</option>
                {sectorOptions.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="font-bold">
                İl
                <select
                  name="city"
                  required
                  value={selectedProvince}
                  onChange={(event) => setSelectedProvince(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8]"
                >
                  <option value="">İl seçiniz</option>
                  {turkeyLocations.map(({ province }) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </label>
              <label className="font-bold">
                İlçe
                <select
                  key={selectedProvince}
                  name="district"
                  required
                  disabled={!selectedProvince}
                  defaultValue=""
                  className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">{selectedProvince ? "İlçe seçiniz" : "Önce il seçiniz"}</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="font-bold">
              Girişim Aşaması
              <select
                name="stage"
                className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8]"
              >
                {program.requiredStages.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </label>
            <label className="font-bold">
              Ekip Büyüklüğü
              <input
                name="teamSize"
                type="number"
                min="1"
                defaultValue="1"
                required
                className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8] focus:shadow-[0_0_24px_rgba(23,230,210,.28)]"
              />
            </label>
            <label className="font-bold">
              Hangi problemi çözüyorsunuz?
              <textarea
                name="problem"
                required
                rows={4}
                className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8] focus:shadow-[0_0_24px_rgba(23,230,210,.28)]"
              />
            </label>
            <label className="font-bold">
              Çözümünüz nedir?
              <textarea
                name="solution"
                required
                rows={4}
                className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8] focus:shadow-[0_0_24px_rgba(23,230,210,.28)]"
              />
            </label>
            {[
              ["targetMarket", "Hedef Kitle"],
              ["businessModel", "İş Modeli"],
              ["competitors", "Rakipler"],
              ["differentiation", "Farklılaşma"],
              ["traction", "Mevcut Traction"],
              ["futureGoals", "Gelecek Hedefleri"],
            ].map(([name, label]) => (
              <label className="font-bold" key={name}>
                {label}
                <textarea
                  name={name}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white/75 p-4 font-normal outline-none shadow-[0_0_20px_rgba(23,230,210,.08)] focus:border-[#00a6c8] focus:shadow-[0_0_24px_rgba(23,230,210,.28)]"
                />
              </label>
            ))}
            <fieldset className="rounded-2xl border border-cyan-700/20 bg-white/75 p-4 shadow-[0_0_20px_rgba(23,230,210,.08)]">
              <legend className="px-1 font-bold">Programdan İstediğiniz</legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {programExpectationOptions.map((option) => (
                  <label key={option} className="flex cursor-pointer items-center gap-3 font-normal">
                    <input
                      type="checkbox"
                      name="programExpectations"
                      value={option}
                      checked={programExpectations.includes(option)}
                      onChange={(event) =>
                        setProgramExpectations((current) =>
                          event.target.checked
                            ? [...current, option]
                            : current.filter((item) => item !== option),
                        )
                      }
                      className="h-5 w-5 accent-[#063f46]"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {programExpectations.includes("Diğer") ? (
                <label className="mt-4 block font-bold">
                  Diğer beklentinizi açıklayın
                  <textarea
                    name="programExpectationOther"
                    required
                    rows={3}
                    placeholder="Programdan beklentinizi daha detaylı yazabilirsiniz."
                    className="mt-2 w-full rounded-2xl border border-cyan-700/20 bg-white p-4 font-normal outline-none focus:border-[#00a6c8] focus:shadow-[0_0_24px_rgba(23,230,210,.28)]"
                  />
                </label>
              ) : null}
            </fieldset>
            <div className="rounded-lg border border-cyan-700/20 bg-white/75 p-5 shadow-[0_0_20px_rgba(23,230,210,.08)]">
              <details>
                <summary className="cursor-pointer font-bold text-[#063f46]">
                  KVKK Aydınlatma Metni
                </summary>
                <div className="mt-4 space-y-3 text-sm leading-6 text-[#052f36]/75">
                  <p>
                    Başvuru kapsamında paylaştığınız kimlik, iletişim, girişim, ekip ve
                    belge bilgileri; başvurunun alınması, değerlendirilmesi, program
                    süreçlerinin yürütülmesi ve sizinle iletişim kurulması amaçlarıyla
                    Lidea Girişim Programı tarafından işlenir.
                  </p>
                  <p>
                    Veriler elektronik ortamda, doğrudan başvuru formu üzerinden toplanır;
                    değerlendirme, mentorluk, jüri ve program operasyonlarının yürütülmesi
                    için görevli kişilerle ve hukuken yetkili kurumlarla amaçla sınırlı
                    olarak paylaşılabilir. Veriler yalnızca gerekli süre boyunca saklanır.
                  </p>
                  <p>
                    6698 sayılı Kanun'un 11. maddesi kapsamında verilerinizin işlenip
                    işlenmediğini öğrenme, bilgi talep etme, düzeltme veya silme isteme,
                    aktarılan üçüncü kişileri öğrenme ve kanuni şartları varsa zararın
                    giderilmesini talep etme haklarına sahipsiniz. Taleplerinizi Lidea
                    Girişim Programı'nın resmi iletişim kanallarından iletebilirsiniz.
                  </p>
                </div>
              </details>
              <label className="mt-5 flex cursor-pointer items-start gap-3 font-normal">
                <input
                  type="checkbox"
                  name="kvkkAccepted"
                  required
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#063f46]"
                />
                <span>
                  KVKK Aydınlatma Metni'ni okudum ve kişisel verilerimin belirtilen
                  amaçlarla işlenmesi hakkında bilgilendirildim.
                </span>
              </label>
            </div>
            <button className="mt-3 rounded-full bg-[#063f46] p-4 font-bold text-white shadow-[0_0_26px_rgba(23,230,210,.45)]">
              Başvuruyu Tamamla →
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
