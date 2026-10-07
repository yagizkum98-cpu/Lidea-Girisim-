"use client";

import { useState } from "react";
import { Notification } from "@/lib/notifications";
import { EventNotificationPreferences } from "@/components/ProgramCalendar";

export default function NotificationInbox({ notifications, email, onRead, onOpenEvent, onOpenTraining }: {
  notifications: Notification[]; email: string;
  onRead: (notification: Notification) => Promise<void>;
  onOpenEvent: (id: string) => void;
  onOpenTraining?: (id: string) => void;
}) {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [notice, setNotice] = useState("");
  const unread = (notification: Notification) => notification.recipients.some((recipient) => recipient.email.toLowerCase() === email.toLowerCase() && !recipient.read);
  const items = notifications.filter((notification) => !unreadOnly || unread(notification));
  return <section className="bg-white p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-bold">Bildirimler · {notifications.filter(unread).length} okunmamış</h2>
      <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold" onClick={() => {
        void Promise.all(notifications.filter(unread).map(onRead)).then(() => setNotice("Bildirimler okundu olarak işaretlendi.")).catch(() => setNotice("Bildirimler güncellenemedi."));
      }}>Tümünü Okundu İşaretle</button>
    </div>
    <EventNotificationPreferences email={email} />
    <label className="mb-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />Yalnızca okunmamış</label>
    {notice && <p role="status" className="my-3 text-sm text-cyan-800">{notice}</p>}
    <div className="divide-y divide-slate-200">
      {items.length ? items.map((notification) => <article key={notification.id} className={`py-4 ${unread(notification) ? "border-l-4 border-cyan-600 pl-3" : "pl-4"}`}>
        <p className="break-words font-bold">{notification.title}</p>
        <p className="mt-1 text-xs text-slate-500">{notification.type} · {new Date(notification.sentAt || notification.createdAt).toLocaleString("tr-TR")}</p>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{notification.message}</p>
        <div className="mt-3 flex flex-wrap gap-4">
          {notification.trainingId && <button className="text-sm font-bold text-cyan-700" onClick={() => { void onRead(notification).catch(() => setNotice("Okundu bilgisi kaydedilemedi.")); onOpenTraining?.(notification.trainingId!); }}>Eğitimi Görüntüle →</button>}
          {notification.eventId && <button className="text-sm font-bold text-cyan-700" onClick={() => { void onRead(notification).catch(() => setNotice("Okundu bilgisi kaydedilemedi.")); onOpenEvent(notification.eventId!); }}>Etkinliği Görüntüle →</button>}
          {unread(notification) && <button className="text-sm font-semibold text-slate-500" onClick={() => { void onRead(notification).catch(() => setNotice("Okundu bilgisi kaydedilemedi.")); }}>Okundu İşaretle</button>}
        </div>
      </article>) : <p className="py-8 text-center text-sm text-slate-500">Bildirim bulunmuyor.</p>}
    </div>
  </section>;
}
