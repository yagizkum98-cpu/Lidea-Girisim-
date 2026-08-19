"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Notification,
  NotificationAudience,
  NotificationStatus,
  NotificationType,
  notificationAudiences,
  notificationStatuses,
  notificationTypes,
  readNotificationTemplates,
  readNotifications,
  resolveNotificationRecipients,
  saveNotification,
} from "@/lib/notifications";

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600";

const sidebarLinks = [
  ["Dashboard", "/admin"],
  ["Başvurular", "/admin/basvurular"],
  ["Girişimler", "/admin/girisimler"],
  ["Değerlendiriciler", "/admin/degerlendiriciler"],
  ["Mentorlar", "/admin/mentorlar"],
  ["Jüri", "/juri"],
  ["Program", "/admin/program"],
  ["Bildirimler", "/admin/bildirimler"],
  ["Raporlar", "/admin"],
  ["Ayarlar", "/admin"],
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tab, setTab] = useState("Gönderimler");
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const sync = () => setNotifications(readNotifications());
    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("lidea-notifications-updated", sync);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("lidea-notifications-updated", sync);
    };
  }, []);

  const templates = typeof window === "undefined" ? [] : readNotificationTemplates();

  const metrics = useMemo(
    () => ({
      sent: notifications.filter((item) => item.status === "Gönderildi").length,
      draft: notifications.filter((item) => item.status === "Taslak").length,
      scheduled: notifications.filter((item) => item.status === "Planlandı").length,
      failed: notifications.filter((item) => item.status === "Başarısız").length,
      unread: notifications.reduce(
        (sum, item) => sum + item.recipients.filter((recipient) => !recipient.read).length,
        0,
      ),
    }),
    [notifications],
  );

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        const haystack = `${notification.title} ${notification.message} ${notification.audience}`.toLowerCase();
        const tabStatus =
          tab === "Planlanan" ? "Planlandı" : tab === "Taslaklar" ? "Taslak" : "";
        return (
          haystack.includes(query.toLowerCase()) &&
          (!audience || notification.audience === audience) &&
          (!type || notification.type === type) &&
          (!status || notification.status === status) &&
          (!tabStatus || notification.status === tabStatus)
        );
      }),
    [audience, notifications, query, status, tab, type],
  );

  function submitNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const nextStatus = (submitter?.value || "Gönderildi") as NotificationStatus;
    const form = new FormData(event.currentTarget);
    const notificationAudience = String(form.get("audience") || "Girişimciler") as NotificationAudience;
    const customEmails = String(form.get("customEmails") || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    const channels = [
      form.get("platform") === "on" ? "Platform İçi" : "",
      form.get("email") === "on" ? "E-posta" : "",
    ].filter(Boolean) as Notification["channels"];
    const title = String(form.get("title") || "").trim();
    const message = String(form.get("message") || "").trim();

    if (!title || !message) {
      setNotice("Bildirim başlığı ve mesaj zorunludur.");
      return;
    }

    const recipients = resolveNotificationRecipients(
      notificationAudience,
      String(form.get("audienceFilter") || ""),
      customEmails,
    );
    const now = new Date().toISOString();
    const notification: Notification = {
      id: crypto.randomUUID(),
      title,
      message,
      type: String(form.get("type") || "Duyuru") as NotificationType,
      audience: notificationAudience,
      audienceFilter: String(form.get("audienceFilter") || ""),
      program: String(form.get("program") || "Lidea Girişim Programı / 3. Dönem"),
      channels: channels.length ? channels : ["Platform İçi"],
      status: nextStatus,
      scheduledDate: nextStatus === "Planlandı" ? String(form.get("scheduledDate") || "") : "",
      scheduledTime: nextStatus === "Planlandı" ? String(form.get("scheduledTime") || "") : "",
      sentAt: nextStatus === "Gönderildi" ? now : "",
      recipients,
      createdAt: now,
      updatedAt: now,
    };

    saveNotification(notification);
    setNotifications(readNotifications());
    setNotice(
      nextStatus === "Taslak"
        ? "Bildirim taslak olarak kaydedildi."
        : nextStatus === "Planlandı"
          ? "Bildirim planlandı."
          : `${recipients.length} alıcıya platform bildirimi oluşturuldu.`,
    );
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
            {sidebarLinks.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className={`rounded-md px-3 py-2.5 ${
                  label === "Bildirimler" ? "bg-[#063f46] text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label === "Bildirimler" ? "●" : label === "Ayarlar" ? "⚙" : "▣"} {label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">
                Lidea Girişim Programı / 3. Dönem
              </p>
              <h1 className="mt-1 text-3xl font-black">Bildirimler</h1>
              <p className="mt-2 text-sm text-slate-500">Canlı gönderim merkezi</p>
            </div>
            <a href="#new-notification" className="h-11 rounded-md bg-[#063f46] px-5 py-3 text-sm font-bold text-white">
              + Yeni Bildirim
            </a>
          </div>

          {notice ? (
            <p className="mt-5 rounded-md border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">
              {notice}
            </p>
          ) : null}

          <section className="mt-6 grid gap-3 md:grid-cols-5">
            {[
              [metrics.sent, "Gönderilen"],
              [metrics.draft, "Taslak"],
              [metrics.scheduled, "Planlanan"],
              [metrics.failed, "Başarısız"],
              [metrics.unread, "Okunmadı"],
            ].map(([value, label]) => (
              <article key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-3xl font-black">{value}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[.12em] text-slate-500">{label}</p>
              </article>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
            <div>
              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap gap-2">
                  {["Gönderimler", "Planlanan", "Taslaklar", "Şablonlar"].map((item) => (
                    <button
                      key={item}
                      onClick={() => setTab(item)}
                      className={`h-10 rounded-md px-4 text-sm font-black ${
                        tab === item ? "bg-[#063f46] text-white" : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                {tab !== "Şablonlar" ? (
                  <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_160px_160px_160px]">
                    <input
                      className={inputClass}
                      placeholder="Bildirim ara..."
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                    <select className={inputClass} value={audience} onChange={(event) => setAudience(event.target.value)}>
                      <option value="">Alıcı</option>
                      {notificationAudiences.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                    <select className={inputClass} value={type} onChange={(event) => setType(event.target.value)}>
                      <option value="">Tür</option>
                      {notificationTypes.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                    <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}>
                      <option value="">Durum</option>
                      {notificationStatuses.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </section>

              {tab === "Şablonlar" ? (
                <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-xl font-black">Bildirim Şablonları</h2>
                  <div className="mt-4 space-y-3">
                    {templates.map((template) => (
                      <article key={template.id} className="rounded-md border border-slate-100 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-black">{template.title}</p>
                            <p className="mt-1 text-xs font-bold text-cyan-800">{template.type}</p>
                          </div>
                          <button className="h-9 rounded-md border border-slate-200 px-4 text-xs font-black">
                            Düzenle
                          </button>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">{template.message}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : (
                <section className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full min-w-[920px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Başlık</th>
                        <th className="px-5 py-4">Hedef</th>
                        <th className="px-5 py-4">Alıcı</th>
                        <th className="px-5 py-4">Okundu</th>
                        <th className="px-5 py-4">Tarih</th>
                        <th className="px-5 py-4">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredNotifications.length ? (
                        filteredNotifications.map((notification) => {
                          const readCount = notification.recipients.filter((recipient) => recipient.read).length;
                          return (
                            <tr key={notification.id}>
                              <td className="px-5 py-4">
                                <p className="font-black">{notification.title}</p>
                                <p className="mt-1 text-xs text-slate-400">{notification.type}</p>
                              </td>
                              <td className="px-5 py-4">{notification.audience}</td>
                              <td className="px-5 py-4 font-black">{notification.recipients.length}</td>
                              <td className="px-5 py-4">
                                {readCount} / {notification.recipients.length}
                              </td>
                              <td className="px-5 py-4">
                                {notification.sentAt || notification.scheduledDate || notification.createdAt.slice(0, 10)}
                              </td>
                              <td className="px-5 py-4 font-black">{notification.status}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="px-5 py-10 text-center text-sm text-slate-500" colSpan={6}>
                            Henüz canlı bildirim yok. Yeni bildirim oluşturunca sayaçlar güncellenir.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </section>
              )}
            </div>

            <form
              id="new-notification"
              onSubmit={submitNotification}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <h2 className="text-xl font-black">Yeni Bildirim</h2>
              <div className="mt-4 grid gap-3">
                <input name="title" className={inputClass} placeholder="Bildirim başlığı" />
                <textarea
                  name="message"
                  rows={5}
                  className="rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-cyan-600"
                  placeholder="Mesaj"
                />
                <select name="type" className={inputClass} defaultValue="Duyuru">
                  {notificationTypes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <select name="audience" className={inputClass} defaultValue="Girişimciler">
                  {notificationAudiences.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <select name="audienceFilter" className={inputClass} defaultValue="">
                  <option value="">Hedef filtresi</option>
                  <option>Aktif</option>
                  <option>Demo Day Hazır</option>
                  <option>Mentorsuz</option>
                  <option>Belgesi Eksik</option>
                  <option>Değerlendirmesi Bekleyen</option>
                  <option>Son Tarihi Yaklaşan</option>
                </select>
                <input name="customEmails" className={inputClass} placeholder="Özel e-postalar, virgülle" />
                <input name="program" className={inputClass} defaultValue="Lidea Girişim Programı / 3. Dönem" />
                <div className="grid gap-2 rounded-md bg-slate-50 p-3 text-sm font-semibold">
                  <label className="flex items-center gap-2">
                    <input name="platform" type="checkbox" defaultChecked />
                    Platform İçi Bildirim
                  </label>
                  <label className="flex items-center gap-2 text-slate-500">
                    <input name="email" type="checkbox" />
                    E-posta
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input name="scheduledDate" type="date" className={inputClass} />
                  <input name="scheduledTime" type="time" className={inputClass} />
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <button
                  value="Taslak"
                  className="h-11 rounded-md border border-slate-200 px-3 text-sm font-bold"
                >
                  Taslak
                </button>
                <button
                  value="Planlandı"
                  className="h-11 rounded-md border border-cyan-200 bg-cyan-50 px-3 text-sm font-bold text-cyan-900"
                >
                  Planla
                </button>
                <button value="Gönderildi" className="h-11 rounded-md bg-[#063f46] px-3 text-sm font-bold text-white">
                  Gönder
                </button>
              </div>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}
