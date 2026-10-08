"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AdminUserRecord,
  SystemSettings,
  defaultSystemSettings,
  readAdminUsers,
  readSystemSettings,
  rolePermissions,
  writeAdminUsers,
  writeSystemSettings,
} from "@/lib/settings";

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-cyan-600";

const sidebarLinks = [
  ["Dashboard", "/admin"],
  ["Başvurular", "/admin/basvurular"],
  ["Girişimler", "/admin/girisimler"],
  ["Değerlendiriciler", "/admin/degerlendiriciler"],
  ["Mentorlar", "/admin/mentorlar"],
  ["Jüri", "/juri"],
  ["Program", "/admin/program"],
  ["Bildirimler", "/admin/bildirimler"],
  ["Raporlar", "/admin/raporlar"],
  ["Ayarlar", "/admin/ayarlar"],
];

const roles = Object.keys(rolePermissions);

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSystemSettings);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [tab, setTab] = useState("Genel");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const sync = () => {
      setSettings(readSystemSettings());
      setUsers(readAdminUsers());
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("lidea-settings-updated", sync);
    window.addEventListener("lidea-admin-users-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("lidea-settings-updated", sync);
      window.removeEventListener("lidea-admin-users-updated", sync);
    };
  }, []);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, users],
  );

  function saveGeneral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextSettings = {
      ...settings,
      platformName: String(form.get("platformName") || ""),
      shortName: String(form.get("shortName") || ""),
      supportEmail: String(form.get("supportEmail") || ""),
      timezone: String(form.get("timezone") || "Europe/Istanbul"),
      language: String(form.get("language") || "Türkçe") as SystemSettings["language"],
      logo: String(form.get("logo") || ""),
      favicon: String(form.get("favicon") || ""),
    };
    writeSystemSettings(nextSettings);
    setSettings(nextSettings);
    setNotice("Genel ayarlar kaydedildi.");
  }

  function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    if (!email || !form.get("name") || !form.get("password")) {
      setNotice("Ad soyad, e-posta ve şifre zorunludur.");
      return;
    }
    if (users.some((user) => user.email.toLowerCase() === email)) {
      setNotice("Bu e-posta ile kullanıcı zaten var.");
      return;
    }
    const nextUsers = [
      {
        id: crypto.randomUUID(),
        name: String(form.get("name") || ""),
        email,
        password: String(form.get("password") || ""),
        role: String(form.get("role") || "Program Yetkilisi"),
        status: String(form.get("status") || "Aktif"),
        createdAt: new Date().toISOString(),
      },
      ...users,
    ];
    writeAdminUsers(nextUsers);
    setUsers(nextUsers);
    setNotice("Kullanıcı eklendi.");
    event.currentTarget.reset();
  }

  function toggleUserStatus(email: string) {
    const nextUsers = users.map((user) =>
      user.email === email ? { ...user, status: user.status === "Pasif" ? "Aktif" : "Pasif" } : user,
    );
    writeAdminUsers(nextUsers);
    setUsers(nextUsers);
    setNotice("Kullanıcı durumu güncellendi.");
  }

  function saveNotificationSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const toggles = Object.fromEntries(
      Object.keys(defaultSystemSettings.notificationToggles).map((item) => [item, event.currentTarget[item as keyof HTMLFormElement] ? new FormData(event.currentTarget).get(item) === "on" : false]),
    ) as Record<string, boolean>;
    const nextSettings = {
      ...settings,
      notificationToggles: toggles,
      emailEnabled: new FormData(event.currentTarget).get("emailEnabled") === "on",
    };
    writeSystemSettings(nextSettings);
    setSettings(nextSettings);
    setNotice("Bildirim ayarları kaydedildi.");
  }

  function saveSecurity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextSettings = {
      ...settings,
      sessionMinutes: Number(form.get("sessionMinutes") || 60),
      failedLoginLimit: Number(form.get("failedLoginLimit") || 5),
      strongPasswordRequired: form.get("strongPasswordRequired") === "on",
      adminTwoFactorRequired: form.get("adminTwoFactorRequired") === "on",
      uploadLimitMb: Number(form.get("uploadLimitMb") || 10),
      allowedFiles: String(form.get("allowedFiles") || "PDF,PPTX,DOCX,PNG,JPG")
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean),
    };
    writeSystemSettings(nextSettings);
    setSettings(nextSettings);
    setNotice("Güvenlik ayarları kaydedildi.");
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
              <Link key={label} href={href} className={`rounded-md px-3 py-2.5 ${label === "Ayarlar" ? "bg-[#063f46] text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {label === "Ayarlar" ? "●" : "▣"} {label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">Lidea Girişim Programı</p>
            <h1 className="mt-1 text-3xl font-black">Ayarlar</h1>
            <p className="mt-2 text-sm text-slate-500">Sistem, kullanıcı, rol, bildirim ve güvenlik ayarları</p>
          </div>

          {notice ? <p className="mt-5 rounded-md border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">{notice}</p> : null}

          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap gap-2">
              {["Genel", "Kullanıcılar", "Roller & Yetkiler", "Bildirim", "Güvenlik"].map((item) => (
                <button key={item} onClick={() => setTab(item)} className={`h-10 rounded-md px-4 text-sm font-black ${tab === item ? "bg-[#063f46] text-white" : "bg-slate-50 text-slate-600"}`}>
                  {item}
                </button>
              ))}
            </div>
          </section>

          {tab === "Genel" ? (
            <form onSubmit={saveGeneral} className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-black">Genel Ayarlar</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <input name="platformName" className={inputClass} defaultValue={settings.platformName} placeholder="Platform adı" />
                <input name="shortName" className={inputClass} defaultValue={settings.shortName} placeholder="Platform kısa adı" />
                <input name="supportEmail" className={inputClass} defaultValue={settings.supportEmail} placeholder="Destek e-postası" />
                <select name="timezone" className={inputClass} defaultValue={settings.timezone}>
                  <option>Europe/Istanbul</option>
                  <option>UTC</option>
                </select>
                <select name="language" className={inputClass} defaultValue={settings.language}>
                  <option>Türkçe</option>
                  <option>English</option>
                </select>
                <input name="logo" className={inputClass} defaultValue={settings.logo} placeholder="Logo URL" />
                <input name="favicon" className={inputClass} defaultValue={settings.favicon} placeholder="Favicon URL" />
              </div>
              <button className="mt-5 h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">Değişiklikleri Kaydet</button>
            </form>
          ) : null}

          {tab === "Kullanıcılar" ? (
            <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-100 p-5">
                  <input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kullanıcı ara..." />
                </div>
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500">
                    <tr><th className="px-5 py-4">Ad Soyad</th><th className="px-5 py-4">E-posta</th><th className="px-5 py-4">Rol</th><th className="px-5 py-4">Durum</th><th className="px-5 py-4">İşlem</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length ? filteredUsers.map((user) => (
                      <tr key={user.email}>
                        <td className="px-5 py-4 font-black">{user.name}</td>
                        <td className="px-5 py-4">{user.email}</td>
                        <td className="px-5 py-4">{user.role}</td>
                        <td className="px-5 py-4 font-black">{user.status || "Aktif"}</td>
                        <td className="px-5 py-4"><button onClick={() => toggleUserStatus(user.email)} className="font-black text-cyan-800">Aktif/Pasif</button></td>
                      </tr>
                    )) : <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">Henüz canlı kullanıcı yok.</td></tr>}
                  </tbody>
                </table>
              </div>
              <form onSubmit={createUser} className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="text-xl font-black">Kullanıcı Ekle</h2>
                <div className="mt-4 grid gap-3">
                  <input name="name" className={inputClass} placeholder="Ad Soyad" />
                  <input name="email" type="email" className={inputClass} placeholder="E-posta" />
                  <input name="password" type="password" className={inputClass} placeholder="Geçici şifre" />
                  <select name="role" className={inputClass} defaultValue="Program Yetkilisi">
                    {roles.map((role) => <option key={role}>{role}</option>)}
                  </select>
                  <select name="status" className={inputClass} defaultValue="Aktif"><option>Aktif</option><option>Pasif</option></select>
                </div>
                <button className="mt-4 h-11 w-full rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">Kullanıcı Ekle</button>
              </form>
            </section>
          ) : null}

          {tab === "Roller & Yetkiler" ? (
            <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-black">Roller & Yetkiler</h2>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {Object.entries(rolePermissions).map(([role, permissions]) => (
                  <article key={role} className="rounded-md bg-slate-50 p-4">
                    <h3 className="font-black">{role}</h3>
                    <div className="mt-3 grid gap-2">
                      {permissions.map((permission) => <p key={permission} className="text-sm font-semibold text-slate-600">✓ {permission}</p>)}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {tab === "Bildirim" ? (
            <form onSubmit={saveNotificationSettings} className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-black">Bildirim Ayarları</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {Object.keys(defaultSystemSettings.notificationToggles).map((item) => (
                  <label key={item} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-4 text-sm font-bold">
                    {item}
                    <input name={item} type="checkbox" defaultChecked={settings.notificationToggles[item]} />
                  </label>
                ))}
                <label className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-4 text-sm font-bold">
                  Sistem E-postaları
                  <input name="emailEnabled" type="checkbox" defaultChecked={settings.emailEnabled} />
                </label>
              </div>
              <button className="mt-5 h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">Kaydet</button>
            </form>
          ) : null}

          {tab === "Güvenlik" ? (
            <form onSubmit={saveSecurity} className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-black">Güvenlik</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <input name="sessionMinutes" type="number" className={inputClass} defaultValue={settings.sessionMinutes} placeholder="Admin oturum süresi" />
                <input name="failedLoginLimit" type="number" className={inputClass} defaultValue={settings.failedLoginLimit} placeholder="Başarısız giriş limiti" />
                <input name="uploadLimitMb" type="number" className={inputClass} defaultValue={settings.uploadLimitMb} placeholder="Dosya yükleme limiti MB" />
                <input name="allowedFiles" className={inputClass} defaultValue={settings.allowedFiles.join(", ")} placeholder="PDF, PPTX, DOCX" />
                <label className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-4 text-sm font-bold">
                  Güçlü Parola Zorunluluğu
                  <input name="strongPasswordRequired" type="checkbox" defaultChecked={settings.strongPasswordRequired} />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-4 text-sm font-bold">
                  Admin 2FA
                  <input name="adminTwoFactorRequired" type="checkbox" defaultChecked={settings.adminTwoFactorRequired} />
                </label>
              </div>
              <button className="mt-5 h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white">Kaydet</button>
            </form>
          ) : null}
        </section>
      </div>
    </main>
  );
}
