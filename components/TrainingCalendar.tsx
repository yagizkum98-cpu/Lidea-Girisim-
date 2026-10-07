"use client";

import { FormEvent, useEffect, useState } from "react";
import { TrainingSession, trainingDate, trainingIsPast, trainingJoinAvailable, trainingSchedule, trainingWeekStart } from "@/lib/trainings";
import { trainingUpdateSchema } from "@/lib/validation/training";
import { readLocalTrainings, saveLocalTraining, followLocalTraining, joinLocalTraining, processLocalTrainingReminders, trainingsUpdated } from "@/lib/local-trainings";
import { trainingCalendarFile, trainingGoogleCalendar } from "@/lib/training-calendar";

const input = "w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-600";
const command = "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold disabled:opacity-50";

export default function TrainingCalendar({ admin = false, email, localWorkspace = false, initialTrainingId = "" }: {
  admin?: boolean; email: string; localWorkspace?: boolean; initialTrainingId?: string;
}) {
  const [trainings, setTrainings] = useState<TrainingSession[]>(trainingSchedule);
  const [source, setSource] = useState<"loading" | "local" | "server" | "denied">("loading");
  const [view, setView] = useState("week");
  const [week, setWeek] = useState(trainingWeekStart(trainingSchedule[0].date));
  const [selectedId, setSelectedId] = useState(initialTrainingId || trainingSchedule[0].id);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    setSource("loading");
    setTrainings(trainingSchedule);
    setNotice("");
    let disposed = false, inFlight = false, reminderInFlight = false;
    let activeSource: "loading" | "local" | "server" | "denied" = localWorkspace ? "local" : "loading";
    async function sync() {
      if (inFlight) return;
      inFlight = true;
      try {
        if (activeSource === "local") {
          processLocalTrainingReminders();
          if (!disposed) { setTrainings(readLocalTrainings(email, admin)); setSource("local"); }
        } else {
          const response = await fetch(`/api/trainings?view=${admin ? "admin" : "participant"}`, { cache: "no-store", signal: AbortSignal.timeout(6500) });
          if (response.status === 401 || response.status === 403) {
            activeSource = "denied";
            if (!disposed) { setSource("denied"); setTrainings([]); setNotice("Bu eğitim takvimine erişim için uygun yetkili oturum gerekli."); }
            return;
          }
          if (!response.ok) throw new Error("STORAGE_UNAVAILABLE");
          const result = await response.json() as { trainings: TrainingSession[] };
          activeSource = "server";
          if (!disposed) { setTrainings(result.trainings); setSource("server"); }
          if (!disposed && !reminderInFlight) {
            reminderInFlight = true;
            void fetch("/api/trainings/reminders", { method: "POST", signal: AbortSignal.timeout(50_000) }).then(async (response) => {
              if (!response.ok) return;
              const reminders = await response.json() as { sent: number };
              if (!disposed && reminders.sent) window.dispatchEvent(new Event("lidea-notifications-updated"));
            }).catch(() => { /* A reminder delivery failure must not hide the calendar. */ }).finally(() => { reminderInFlight = false; });
          }
        }
      } catch {
        if (activeSource === "loading") {
          activeSource = "local";
          if (!disposed) { setSource("local"); setTrainings(readLocalTrainings(email, admin)); }
        } else if (!disposed) setNotice("Sunucuya ulaşılamadı. Yeniden deneyin.");
      } finally { inFlight = false; if (!disposed) setNow(Date.now()); }
    }
    void sync();
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") void sync(); }, 30_000);
    ["focus", "storage", trainingsUpdated].forEach((event) => window.addEventListener(event, sync));
    return () => { disposed = true; window.clearInterval(interval); ["focus", "storage", trainingsUpdated].forEach((event) => window.removeEventListener(event, sync)); };
  }, [admin, email, localWorkspace]);

  useEffect(() => {
    const id = initialTrainingId || new URLSearchParams(window.location.search).get("egitim");
    if (id) setSelectedId(id);
  }, [initialTrainingId]);
  const selected = trainings.find((training) => training.id === selectedId);
  useEffect(() => { if (selected?.date) setWeek(trainingWeekStart(selected.date)); }, [selected?.date]);
  const sessions = trainings.filter((training) => view === "all" || trainingWeekStart(training.date) === week)
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));

  function moveWeek(days: number) {
    const date = new Date(`${week}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); setWeek(date.toISOString().slice(0, 10)); setSelectedId(""); setEditing(false);
  }
  function refresh() { window.dispatchEvent(new Event(trainingsUpdated)); }
  function detailUrl(training: TrainingSession) { return `${window.location.origin}/girisimci?egitim=${encodeURIComponent(training.id)}`; }
  async function action(task: () => Promise<void> | void) {
    setBusy(true); setNotice("");
    try { await task(); refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "İşlem tamamlanamadı."); }
    finally { setBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !admin) return;
    const form = new FormData(event.currentTarget);
    const parsed = trainingUpdateSchema.safeParse({
      title: String(form.get("title") || ""), date: String(form.get("date") || ""), startTime: String(form.get("startTime") || ""), endTime: String(form.get("endTime") || ""),
      description: String(form.get("description") || ""), mode: String(form.get("mode") || "online"), location: String(form.get("location") || ""),
      meetingUrl: String(form.get("meetingUrl") || ""), status: String(form.get("status") || "scheduled"),
      reminders: form.getAll("reminders").map(Number), adminReminders: form.get("adminReminders") === "on",
    });
    if (!parsed.success) { setNotice(parsed.error.issues[0].message); return; }
    await action(async () => {
      const updated = { ...selected, ...parsed.data, hostEmail: email.toLowerCase() };
      if (source === "local") saveLocalTraining(updated);
      else {
        const response = await fetch(`/api/trainings/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
        if (!response.ok) throw new Error("Eğitim sunucuya kaydedilemedi. Yeniden deneyin.");
      }
      setEditing(false); setNotice(source === "local" ? "Eğitim bu tarayıcıdaki çalışma alanına kaydedildi." : "Eğitim ve bildirimler kaydedildi.");
    });
  }
  async function follow(training: TrainingSession) {
    await action(async () => {
      if (source === "local") followLocalTraining(training.id, email, !training.following);
      else {
        const response = await fetch(`/api/trainings/${training.id}/follow`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ following: !training.following }) });
        if (!response.ok) throw new Error("Takip tercihi kaydedilemedi.");
      }
      setNotice(training.following ? "Eğitim takibi kapatıldı." : "Eğitim takip ediliyor; hatırlatmalar açık.");
    });
  }
  function calendar(training: TrainingSession) {
    const url = URL.createObjectURL(new Blob([trainingCalendarFile(training, detailUrl(training))], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${training.id}.ics`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section aria-label="Eğitim takvimi" className="min-w-0 bg-white p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-bold">Eğitim Takvimi</h2><p className="mt-1 text-sm text-slate-500">Ön Kuluçka · 8 eğitim ve Demo Day</p></div>
      <span className="text-xs text-slate-500">{source === "loading" ? "Bağlantı kontrol ediliyor" : source === "local" ? "Yerel çalışma alanı" : source === "denied" ? "Yetkili oturum gerekli" : "Program takvimi"} · Türkiye saati</span>
    </div>
    {source === "local" && !localWorkspace && <p role="status" className="mt-4 border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-amber-950">Sunucuya bağlanılamadı. Değişiklikler bu tarayıcıdaki çalışma alanında tutulacak.</p>}
    {notice && <p role="status" className="mt-4 border-l-4 border-cyan-700 bg-cyan-50 p-3 text-sm text-cyan-950">{notice}</p>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 py-3">
      <div role="group" aria-label="Eğitim takvimi görünümü" className="flex">
        {[["week", "Hafta"], ["all", "Tümü"]].map(([value, label]) => <button key={value} aria-pressed={view === value} onClick={() => setView(value)} className={`border px-4 py-2 text-sm font-bold ${view === value ? "border-cyan-700 bg-cyan-700 text-white" : "border-slate-200"}`}>{label}</button>)}
      </div>
      {view === "week" && <div className="flex items-center gap-3">
        <button title="Önceki hafta" aria-label="Önceki hafta" className={command} onClick={() => moveWeek(-7)}>‹</button>
        <time dateTime={week} className="text-sm font-semibold">{trainingDate(week)}</time>
        <button title="Sonraki hafta" aria-label="Sonraki hafta" className={command} onClick={() => moveWeek(7)}>›</button>
      </div>}
    </div>
    <div className="divide-y divide-slate-200">
      {sessions.length ? sessions.map((training) => <button key={training.id} onClick={() => { setSelectedId(training.id); setEditing(false); }} aria-pressed={selectedId === training.id} className={`flex w-full flex-wrap items-start justify-between gap-3 py-4 text-left ${selectedId === training.id ? "bg-cyan-50" : "hover:bg-slate-50"}`}>
        <div className="min-w-0"><p className="text-xs font-bold text-emerald-700">{training.week ? `${training.week}. Hafta` : "Demo Day"}</p><h3 className="mt-1 break-words text-base font-bold">{training.title}</h3>
          <p className="mt-2 text-sm text-slate-500">{trainingDate(training.date)} · {trainingDate(training.date, true)}</p>
          <p className="mt-1 text-sm text-slate-500">{training.startTime ? `${training.startTime} – ${training.endTime}` : "Saat belirlenecek"}</p>
        </div>
        <div className="w-full text-left text-xs font-semibold sm:w-auto sm:text-right"><p className={training.status === "cancelled" ? "text-red-700" : "text-cyan-800"}>{training.status === "cancelled" ? "İptal edildi" : trainingIsPast(training, now) ? "Tamamlandı" : training.meetingUrl ? "Bağlantı hazır" : training.mode === "in-person" ? "Yüz yüze" : "Bağlantı bekleniyor"}</p>
          {admin ? <p className="mt-2 text-slate-500">{training.followerCount || 0} takip · {training.joinedCount || 0} giriş</p> : training.following && <p className="mt-2 text-emerald-700">Hatırlatmalar açık</p>}
        </div>
      </button>) : <p className="py-8 text-sm text-slate-500">Bu haftada eğitim bulunmuyor.</p>}
    </div>
    {selected && <div className="mt-5 border-t-2 border-cyan-700 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="min-w-0 break-words text-lg font-bold">{selected.title}</h3>
        {admin && <button disabled={source === "loading" || busy} className={command} onClick={() => setEditing(!editing)}>{editing ? "Düzenlemeyi Kapat" : "Bağlantı ve Saati Düzenle"}</button>}
      </div>
      <p className="mt-3 text-sm text-slate-500">{trainingDate(selected.date)} · {selected.startTime ? `${selected.startTime} – ${selected.endTime}` : "Saat belirlenecek"}</p>
      {selected.description && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{selected.description}</p>}
      {selected.mode === "in-person" && <p className="mt-3 text-sm">{selected.location || "Konum belirlenecek"}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">{selected.reminders.map((minutes) => <span key={minutes}>{minutes === 1440 ? "1 gün önce" : minutes === 60 ? "1 saat önce" : "10 dakika önce"}</span>)}</div>
      {!editing && <div className="mt-5 flex flex-wrap gap-2">
        {!admin && <button disabled={busy || source === "loading" || (selected.status === "cancelled" && !selected.following)} className={command} onClick={() => void follow(selected)}>{selected.following ? "Takibi Bırak" : "Takip Et ve Hatırlat"}</button>}
        {trainingJoinAvailable(selected, now) && (source === "server"
          ? <a className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-bold text-white" href={admin ? selected.meetingUrl : `/api/trainings/${selected.id}/join`} target="_blank" rel="noopener noreferrer">Eğitime Katıl</a>
          : <button className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-bold text-white" onClick={() => void action(() => { window.open(joinLocalTraining(selected.id, email), "_blank", "noopener,noreferrer"); })}>Eğitime Katıl</button>)}
        {!trainingJoinAvailable(selected, now) && selected.mode === "online" && <button className={command} disabled>Eğitime Katıl</button>}
        {selected.status !== "cancelled" && <><button className={command} onClick={() => calendar(selected)}>Takvime Ekle (.ics)</button><button className={command} onClick={() => window.open(trainingGoogleCalendar(selected, detailUrl(selected)), "_blank", "noopener,noreferrer")}>Google Takvim</button></>}
      </div>}
      {admin && editing && <form key={selected.id} onSubmit={save} className="mt-5 grid gap-4 border-t border-slate-200 pt-5">
        <label className="grid gap-1 text-sm font-semibold">Eğitim adı<input name="title" required defaultValue={selected.title} className={input} /></label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-semibold">Eğitim tarihi<input type="date" name="date" required defaultValue={selected.date} className={input} /></label>
          <label className="grid gap-1 text-sm font-semibold">Başlangıç saati<input type="time" name="startTime" defaultValue={selected.startTime} className={input} /></label>
          <label className="grid gap-1 text-sm font-semibold">Bitiş saati<input type="time" name="endTime" defaultValue={selected.endTime} className={input} /></label>
        </div>
        <label className="grid gap-1 text-sm font-semibold">Zoom / Toplantı bağlantısı<input type="url" name="meetingUrl" defaultValue={selected.meetingUrl} placeholder="https://zoom.us/j/..." className={input} /></label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-semibold">Eğitim türü<select aria-label="Eğitim türü" name="mode" defaultValue={selected.mode} className={input}><option value="online">Çevrim içi</option><option value="in-person">Yüz yüze</option></select></label>
          <label className="grid gap-1 text-sm font-semibold">Konum<input name="location" defaultValue={selected.location} className={input} /></label>
          <label className="grid gap-1 text-sm font-semibold">Durum<select aria-label="Durum" name="status" defaultValue={selected.status} className={input}><option value="scheduled">Planlandı</option><option value="cancelled">İptal edildi</option></select></label>
        </div>
        <label className="grid gap-1 text-sm font-semibold">Açıklama<textarea rows={3} name="description" defaultValue={selected.description} className={input} /></label>
        <fieldset><legend className="text-sm font-bold">Hatırlatmalar</legend><div className="mt-2 flex flex-wrap gap-4">
          {[[1440, "1 gün önce"], [60, "1 saat önce"], [10, "10 dakika önce"]].map(([minutes, label]) => <label key={minutes} className="flex items-center gap-2 text-sm"><input type="checkbox" name="reminders" value={minutes} defaultChecked={selected.reminders.includes(Number(minutes))} />{label}</label>)}
        </div></fieldset>
        <label className="flex items-center gap-2 text-sm"><input name="adminReminders" type="checkbox" defaultChecked={selected.adminReminders} />Yönetici hatırlatmaları</label>
        <div className="flex gap-2"><button disabled={busy} className="min-w-36 rounded-md bg-[#063f46] px-4 py-2 text-sm font-bold text-white">{busy ? "Kaydediliyor" : "Eğitimi Kaydet"}</button><button type="button" className={command} onClick={() => setEditing(false)}>Vazgeç</button></div>
      </form>}
    </div>}
  </section>;
}
