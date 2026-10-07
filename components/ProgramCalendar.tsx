"use client";

import { FormEvent, useEffect, useState } from "react";
import { resolveNotificationRecipients } from "@/lib/notifications";
import {
  ProgramEvent, EventPreferences, defaultEventPreferences, eventCalendar, eventDateKey,
  eventsUpdated, formatEventDate, googleCalendarUrl, joinEvent, processEventReminders,
  readEventPreferences, readEvents, respondToEvent, saveEvent, saveEventPreferences,
} from "@/lib/events";

const inputClass = "min-w-0 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-600";
const commandClass = "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50 disabled:opacity-50";
const responseLabels = { invited: "Yanıt bekleniyor", going: "Katılacak", declined: "Katılmayacak" };
const statusLabels = { draft: "Taslak", published: "Yayımlandı", cancelled: "İptal edildi" };

function localDateTime(value: string) { return `${eventDateKey(value)}T${new Date(value).toLocaleTimeString("en-GB", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" })}`; }

export function EventNotificationPreferences({ email }: { email: string }) {
  const [preferences, setPreferences] = useState<EventPreferences>(defaultEventPreferences);
  useEffect(() => {
    const sync = () => setPreferences(readEventPreferences(email));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(eventsUpdated, sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener(eventsUpdated, sync); };
  }, [email]);
  return <fieldset className="my-5 border-y border-slate-200 py-4">
    <legend className="text-sm font-bold">Etkinlik bildirimleri</legend>
    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-3">
      {([["invite", "Davetler"], ["update", "Değişiklikler ve iptaller"], ["reminder", "Hatırlatmalar"], ["registration", "Katılım yanıtları"]] as const).map(([key, label]) =>
        <label key={key} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={preferences[key]} onChange={(e) => {
            const next = { ...preferences, [key]: e.target.checked };
            saveEventPreferences(email, next); setPreferences(next);
          }} />{label}
        </label>)}
    </div>
  </fieldset>;
}

export default function ProgramCalendar({ admin = false, email, initialEventId = "" }: { admin?: boolean; email: string; initialEventId?: string }) {
  const [events, setEvents] = useState<ProgramEvent[]>([]);
  const [view, setView] = useState("agenda");
  const [filter, setFilter] = useState("upcoming");
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedId, setSelectedId] = useState(initialEventId);
  const [editing, setEditing] = useState<ProgramEvent | "new" | null>(null);
  const [notice, setNotice] = useState("");
  const [clock, setClock] = useState(() => Date.now());
  const [defaultEmails, setDefaultEmails] = useState("");

  useEffect(() => {
    const sync = () => {
      processEventReminders();
      setEvents(readEvents()); setClock(Date.now());
    };
    sync();
    if (admin) setDefaultEmails(resolveNotificationRecipients("Girişimciler", "", []).map((guest) => guest.email).join(", "));
    const queryId = new URLSearchParams(window.location.search).get("etkinlik");
    if (queryId) setSelectedId(queryId);
    const interval = window.setInterval(sync, 30_000);
    ["focus", "storage", eventsUpdated].forEach((event) => window.addEventListener(event, sync));
    return () => {
      window.clearInterval(interval);
      ["focus", "storage", eventsUpdated].forEach((event) => window.removeEventListener(event, sync));
    };
  }, [admin]);

  useEffect(() => { if (initialEventId) setSelectedId(initialEventId); }, [initialEventId]);
  const accessible = events.filter((event) => admin || (event.status !== "draft" && event.guests.some((guest) => guest.email === email.toLowerCase())));
  const selected = accessible.find((event) => event.id === selectedId);
  useEffect(() => {
    if (!selected?.startsAt) return;
    const [year, monthNumber] = eventDateKey(selected.startsAt).split("-").map(Number);
    setMonth(new Date(year, monthNumber - 1, 1));
  }, [selected?.startsAt]);
  const visible = accessible.filter((event) => filter === "all" || (filter === "past" ? Date.parse(event.endsAt) <= clock : event.status === "published" && Date.parse(event.endsAt) > clock))
    .sort((a, b) => filter === "past" ? b.startsAt.localeCompare(a.startsAt) : a.startsAt.localeCompare(b.startsAt));
  const firstWeekday = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  function run(action: () => void) { try { action(); } catch (error) { setNotice(error instanceof Error ? error.message : "İşlem tamamlanamadı."); } }
  function eventUrl(event: ProgramEvent) { return `${window.location.origin}/girisimci?etkinlik=${encodeURIComponent(event.id)}`; }
  function download(event: ProgramEvent) {
    const url = URL.createObjectURL(new Blob([eventCalendar(event, eventUrl(event))], { type: "text/calendar;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `lidea-${event.id}.ics`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const previous = typeof editing === "object" ? editing : null;
    const status = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement)?.value === "draft" ? "draft" : "published";
    run(() => {
      const guestEmails = [...new Set(String(form.get("emails") || "").split(/[,;\s]+/).filter(Boolean).map((value) => value.toLowerCase()))];
      const next: ProgramEvent = {
        id: previous?.id || crypto.randomUUID(), title: String(form.get("title") || "").trim(), description: String(form.get("description") || "").trim(),
        startsAt: new Date(`${form.get("startsAt")}:00+03:00`).toISOString(), endsAt: new Date(`${form.get("endsAt")}:00+03:00`).toISOString(),
        mode: form.get("mode") === "in-person" ? "in-person" : "online", location: String(form.get("location") || "").trim(),
        meetingUrl: String(form.get("meetingUrl") || "").trim(), status, hostEmail: previous?.hostEmail || email.toLowerCase(),
        guests: guestEmails.map((guestEmail) => previous?.guests.find((guest) => guest.email === guestEmail) || { email: guestEmail, response: "invited", joinedAt: "" }),
        reminders: form.getAll("reminders").map(Number), createdAt: previous?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      saveEvent(next); setSelectedId(next.id); setFilter("all"); setEditing(null);
      setNotice(status === "draft" ? "Taslak kaydedildi." : "Etkinlik kaydedildi; platform davetleri ve değişiklik bildirimleri oluşturuldu.");
    });
  }

  return <section className="min-w-0 bg-white p-4 sm:p-6" aria-label="Etkinlik takvimi">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-black">Etkinlik Takvimi</h2>
      {admin && <button className="rounded-md bg-[#063f46] px-4 py-2.5 text-sm font-bold text-white" onClick={() => { setEditing("new"); setNotice(""); }}>Yeni Etkinlik</button>}
    </div>
    {notice && <p role="status" className="mt-4 border-l-4 border-cyan-600 bg-cyan-50 p-3 text-sm text-cyan-950">{notice}</p>}
    <div className="my-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
      <div role="group" aria-label="Takvim görünümü" className="flex">
        {[["agenda", "Ajanda"], ["month", "Ay"]].map(([value, label]) => <button key={value} aria-pressed={view === value} onClick={() => setView(value)} className={`border px-4 py-2 text-sm font-bold ${view === value ? "border-cyan-700 bg-cyan-700 text-white" : "border-slate-200"}`}>{label}</button>)}
      </div>
      <select aria-label="Etkinlik filtresi" value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
        <option value="upcoming">Yaklaşan</option><option value="past">Geçmiş</option><option value="all">Tümü</option>
      </select>
      <span className="text-xs text-slate-500">Türkiye saati (UTC+3)</span>
    </div>
    {editing && <form key={editing === "new" ? "new" : editing.id} onSubmit={submit} className="mb-6 grid gap-4 border-y border-slate-200 py-5">
      <h3 className="font-bold">{editing === "new" ? "Yeni Etkinlik" : "Etkinliği Düzenle"}</h3>
      <label className="grid gap-1 text-sm font-semibold">Etkinlik adı<input required name="title" defaultValue={editing === "new" ? "" : editing.title} className={inputClass} /></label>
      <label className="grid gap-1 text-sm font-semibold">Açıklama<textarea name="description" rows={3} defaultValue={editing === "new" ? "" : editing.description} className={inputClass} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">Başlangıç<input required type="datetime-local" name="startsAt" defaultValue={editing === "new" ? "" : localDateTime(editing.startsAt)} className={inputClass} /></label>
        <label className="grid gap-1 text-sm font-semibold">Bitiş<input required type="datetime-local" name="endsAt" defaultValue={editing === "new" ? "" : localDateTime(editing.endsAt)} className={inputClass} /></label>
        <label className="grid gap-1 text-sm font-semibold">Etkinlik türü<select name="mode" defaultValue={editing === "new" ? "online" : editing.mode} className={inputClass}><option value="online">Çevrim içi</option><option value="in-person">Yüz yüze</option></select></label>
        <label className="grid gap-1 text-sm font-semibold">Toplantı bağlantısı<input type="url" name="meetingUrl" defaultValue={editing === "new" ? "" : editing.meetingUrl} placeholder="https://meet.google.com/..." className={inputClass} /></label>
      </div>
      <label className="grid gap-1 text-sm font-semibold">Konum<input name="location" defaultValue={editing === "new" ? "" : editing.location} className={inputClass} /></label>
      <label className="grid gap-1 text-sm font-semibold">Davetli e-postaları<textarea name="emails" rows={2} defaultValue={editing === "new" ? defaultEmails : editing.guests.map((guest) => guest.email).join(", ")} className={inputClass} /></label>
      <fieldset><legend className="text-sm font-bold">Hatırlatmalar</legend><div className="mt-2 flex flex-wrap gap-4">
        {[[1440, "1 gün önce"], [60, "1 saat önce"], [10, "10 dakika önce"]].map(([minutes, label]) => <label key={minutes} className="flex items-center gap-2 text-sm"><input type="checkbox" name="reminders" value={minutes} defaultChecked={editing === "new" ? minutes !== 10 : editing.reminders.includes(Number(minutes))} />{label}</label>)}
      </div></fieldset>
      <div className="flex flex-wrap gap-2">
        {!(editing !== "new" && editing.status === "published") && <button value="draft" className={commandClass}>Taslak Kaydet</button>}
        <button value="published" className="rounded-md bg-[#063f46] px-4 py-2 text-sm font-bold text-white">{editing !== "new" && editing.status === "published" ? "Değişiklikleri Kaydet" : "Yayımla ve Davet Et"}</button>
        <button type="button" className={commandClass} onClick={() => setEditing(null)}>Vazgeç</button>
      </div>
    </form>}
    {view === "month" ? <div>
      <div className="mb-3 flex items-center justify-between">
        <button title="Önceki ay" aria-label="Önceki ay" className={commandClass} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
        <h3 className="text-sm font-bold">{month.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</h3>
        <button title="Sonraki ay" aria-label="Sonraki ay" className={commandClass} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-500">{["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => <div key={day} className="py-2">{day}</div>)}</div>
      <div className="grid grid-cols-7 border-l border-t border-slate-200">
        {Array.from({ length: Math.ceil((firstWeekday + days) / 7) * 7 }, (_, index) => {
          const day = index - firstWeekday + 1;
          const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          return <div key={index} className="min-h-24 min-w-0 border-b border-r border-slate-200 p-1 sm:p-2">
            {day > 0 && day <= days && <><span className="text-xs text-slate-500">{day}</span>{visible.filter((event) => eventDateKey(event.startsAt) === key).map((event) => <button key={event.id} onClick={() => setSelectedId(event.id)} title={event.title} className="mt-1 block w-full truncate rounded bg-cyan-50 px-1 py-1 text-left text-xs font-semibold text-cyan-900">{event.title}</button>)}</>}
          </div>;
        })}
      </div>
    </div> : <div className="divide-y divide-slate-200">
      {visible.length ? visible.map((event) => <button key={event.id} onClick={() => { setSelectedId(event.id); setNotice(""); }} className={`flex w-full flex-wrap items-center justify-between gap-3 py-4 text-left ${selectedId === event.id ? "bg-cyan-50" : "hover:bg-slate-50"}`}>
        <div className="min-w-0"><p className="break-words text-base font-bold">{event.title}</p><p className="mt-1 text-sm text-slate-500">{formatEventDate(event.startsAt)}</p><p className="mt-1 break-words text-xs text-slate-500">{event.mode === "online" ? "Çevrim içi" : event.location}</p></div>
        <span className={`text-xs font-bold ${event.status === "cancelled" ? "text-red-600" : "text-emerald-700"}`}>{admin ? statusLabels[event.status] : event.status === "cancelled" ? "İptal edildi" : responseLabels[event.guests.find((guest) => guest.email === email.toLowerCase())!.response]}</span>
      </button>) : <p className="py-8 text-center text-sm text-slate-500">Bu görünümde etkinlik bulunmuyor.</p>}
    </div>}
    {selected && <div className="mt-6 border-t-2 border-cyan-700 pt-5">
      <div className="flex items-start justify-between gap-3"><h3 className="min-w-0 break-words text-xl font-bold">{selected.title}</h3><button title="Detayı kapat" aria-label="Detayı kapat" className={commandClass} onClick={() => setSelectedId("")}>×</button></div>
      <p className="mt-3 text-sm">{formatEventDate(selected.startsAt)} — {formatEventDate(selected.endsAt)}</p>
      <p className="mt-2 text-sm text-slate-500">{selected.mode === "online" ? "Çevrim içi" : selected.location} · {statusLabels[selected.status]}</p>
      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6">{selected.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {admin ? <>
          <button className={commandClass} onClick={() => setEditing(selected)}>Düzenle</button>
          {selected.status === "published" && <button className={`${commandClass} text-red-700`} onClick={() => { if (window.confirm("Etkinlik iptal edilsin ve davetlilere bildirim gönderilsin mi?")) run(() => { saveEvent({ ...selected, status: "cancelled" }); setNotice("Etkinlik iptal edildi."); }); }}>Etkinliği İptal Et</button>}
          <button className={commandClass} onClick={() => { void navigator.clipboard.writeText(eventUrl(selected)).then(() => setNotice("Etkinlik bağlantısı kopyalandı.")).catch(() => setNotice("Bağlantı kopyalanamadı.")); }}>Bağlantıyı Kopyala</button>
        </> : selected.status === "published" && Date.parse(selected.endsAt) > clock && <>
          <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white" onClick={() => run(() => { respondToEvent(selected.id, email, "going"); setNotice("Katılımınız onaylandı."); })}>Katılacağım</button>
          <button className={commandClass} onClick={() => run(() => { respondToEvent(selected.id, email, "declined"); setNotice("Katılım yanıtınız kaydedildi."); })}>Katılamayacağım</button>
          {selected.mode === "online" && selected.guests.some((guest) => guest.email === email.toLowerCase() && guest.response === "going") && <button className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-bold text-white" onClick={() => run(() => { window.open(joinEvent(selected.id, email), "_blank", "noopener,noreferrer"); })}>Toplantıya Katıl</button>}
        </>}
        {selected.status === "published" && <>
          <button className={commandClass} onClick={() => run(() => download(selected))}>Takvime Ekle (.ics)</button>
          <button className={commandClass} onClick={() => window.open(googleCalendarUrl(selected, eventUrl(selected)), "_blank", "noopener,noreferrer")}>Google Takvim</button>
        </>}
      </div>
      {admin && <div className="mt-6 overflow-x-auto">
        <h4 className="mb-3 text-sm font-bold">Davetliler · {selected.guests.filter((guest) => guest.response === "going").length} katılacak / {selected.guests.length} davetli</h4>
        <table className="w-full text-left text-sm"><thead className="border-b text-xs text-slate-500"><tr><th className="py-2">E-posta</th><th className="py-2">Yanıt</th><th className="py-2">Bağlantıya giriş</th></tr></thead><tbody>
          {selected.guests.map((guest) => <tr key={guest.email} className="border-b border-slate-100"><td className="break-all py-3 pr-3">{guest.email}</td><td className="whitespace-nowrap py-3 pr-3">{responseLabels[guest.response]}</td><td className="py-3">{guest.joinedAt ? formatEventDate(guest.joinedAt) : "—"}</td></tr>)}
        </tbody></table>
      </div>}
    </div>}
  </section>;
}
