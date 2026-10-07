"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Startup, StartupMember, getStartupProfileCompletion } from "@/lib/startups";
import { maxLogoBytes, profileSectors, profileStages, startupProfileSchema, StartupProfilePatch } from "@/lib/validation/startup-profile";

type ProfileKey = ReturnType<typeof getStartupProfileCompletion>["items"][number]["key"];
const inputClass = "w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-cyan-600 outline-none";

export default function StartupProfileEditor({ startup, onSave }: { startup: Startup | null; onSave: (patch: StartupProfilePatch) => Promise<void> }) {
  const completion = getStartupProfileCompletion(startup);
  const [selected, setSelected] = useState<ProfileKey | null>(null);
  const [logo, setLogo] = useState("");
  const [members, setMembers] = useState<StartupMember[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const fileVersion = useRef(0);

  useEffect(() => {
    if (selected) dialog.current?.showModal();
    else { fileVersion.current++; dialog.current?.close(); }
  }, [selected]);

  function open(key: ProfileKey) {
    fileVersion.current++;
    setSelected(key); setError(""); setReading(false);
    setLogo(startup?.logo && /^data:image\//.test(startup.logo) ? startup.logo : "");
    setMembers(startup?.members.map((member) => ({ ...member })) || []);
  }

  async function upload(file: File | undefined) {
    const version = ++fileVersion.current;
    setError(""); setReading(false);
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) { setError("Yalnızca PNG veya JPG görsel yükleyebilirsiniz."); return; }
    if (file.size > maxLogoBytes) { setError("Logo en fazla 1 MB olabilir."); return; }
    setReading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const png = [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
      const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      if ((file.type === "image/png" && !png) || (file.type === "image/jpeg" && !jpeg)) throw new Error("Dosya geçerli bir PNG veya JPG değil.");
      const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Görsel okunamadı.")); reader.readAsDataURL(file); });
      await new Promise<void>((resolve, reject) => { const image = new window.Image(); image.onload = () => resolve(); image.onerror = () => reject(new Error("Görsel açılamadı.")); image.src = data; });
      if (version === fileVersion.current) setLogo(data);
    } catch (cause) { if (version === fileVersion.current) setError(cause instanceof Error ? cause.message : "Görsel yüklenemedi."); }
    finally { if (version === fileVersion.current) setReading(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || saving || reading) return;
    const form = new FormData(event.currentTarget);
    const patch = selected === "logo" ? { logo }
      : selected === "members" ? { members }
      : selected === "name" ? { name: String(form.get("name") || ""), founder: String(form.get("founder") || "") }
      : { [selected]: String(form.get(selected) || "") };
    if (selected === "logo" && !logo && !startup?.logo?.startsWith("data:image/")) { setError("PNG veya JPG logo yükleyin."); return; }
    const result = startupProfileSchema.safeParse(patch);
    if (!result.success) { setError(result.error.issues[0].message); return; }
    setSaving(true); setError("");
    try { await onSave(result.data); setSelected(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Profil kaydedilemedi."); }
    finally { setSaving(false); }
  }

  return <section aria-label="Profil Tamamlama" className="border-b border-slate-200 bg-white p-6">
    <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-sm font-bold text-cyan-700">Profil Tamamlama</p><h2 className="mt-2 text-4xl font-black">%{completion.percent}</h2></div><p className="text-sm font-bold text-slate-600">{completion.completedCount} / {completion.totalCount} alan dolu</p></div>
    <div role="progressbar" aria-label="Profil doluluğu" aria-valuenow={completion.percent} aria-valuemin={0} aria-valuemax={100} className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-cyan-700 transition-all" style={{ width: `${completion.percent}%` }} /></div>
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{completion.items.map((item, index) => <button key={item.key} type="button" onClick={() => open(item.key)} aria-label={`${item.label} düzenle`} className={`min-h-24 rounded-md border p-4 text-left transition hover:border-cyan-600 focus-visible:outline-2 focus-visible:outline-cyan-700 ${item.completed ? "border-cyan-200 bg-cyan-50 text-cyan-950" : "border-slate-200 bg-white text-slate-600"}`}><span className="block text-lg font-bold">{index + 1}<span className="float-right text-cyan-700" aria-label={item.completed ? "Tamamlandı" : "Eksik"}>{item.completed ? "✓" : "+"}</span></span><span className="mt-2 block text-sm font-bold">{item.label}</span></button>)}</div>
    <dialog ref={dialog} onCancel={(event) => { if (saving) event.preventDefault(); else setSelected(null); }} aria-labelledby="profile-editor-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-xl backdrop:bg-black/40 sm:p-6">
      {selected && <><div className="flex items-center justify-between gap-3"><h2 id="profile-editor-title" className="text-xl font-bold">{completion.items.find((item) => item.key === selected)?.label}</h2><button type="button" aria-label="Kapat" title="Kapat" disabled={saving} onClick={() => setSelected(null)} className="h-10 w-10 shrink-0 rounded-md text-2xl hover:bg-slate-100">×</button></div>
        <form key={selected} onSubmit={submit} className="mt-5 space-y-4">
          {selected === "logo" ? <><label className="block text-sm font-semibold">Logo (PNG / JPG)<input aria-label="Logo yükle" type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" disabled={saving} onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} className={`${inputClass} mt-2`} /></label><p className="text-xs text-slate-500">En fazla 1 MB</p>{logo && <div className="flex items-center gap-4"><Image unoptimized width={96} height={96} src={logo} alt="Girişim logosu önizleme" className="h-24 w-24 rounded-md border border-slate-200 object-contain" /><button type="button" onClick={() => setLogo("")} className="text-sm font-semibold text-red-700">Kaldır</button></div>}</>
          : selected === "name" ? <><label className="block text-sm font-semibold">Girişim adı<input required name="name" maxLength={160} defaultValue={startup?.name || ""} className={`${inputClass} mt-2`} /></label><label className="block text-sm font-semibold">Kurucu adı<input required name="founder" maxLength={160} defaultValue={startup?.founder || ""} className={`${inputClass} mt-2`} /></label></>
          : selected === "sector" || selected === "stage" ? <label className="block text-sm font-semibold">{selected === "sector" ? "Sektör kategorisi" : "TRL seviyesi"}<select required name={selected} defaultValue={startup?.[selected] || ""} className={`${inputClass} mt-2`}><option value="">Seçiniz</option>{(selected === "sector" ? profileSectors : profileStages).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          : selected === "members" ? <><div className="space-y-4">{members.map((member, index) => <fieldset key={member.id} className="border-b border-slate-200 pb-4"><legend className="mb-3 text-sm font-bold">Ekip üyesi {index + 1}</legend><div className="grid gap-3 sm:grid-cols-2">{(["name", "role", "title"] as const).map((key) => <label key={key} className="text-sm font-semibold">{key === "name" ? "Ad soyad" : key === "role" ? "Rol" : "Unvan"}<input required={key !== "title"} value={member[key]} maxLength={160} className={`${inputClass} mt-1`} onChange={(event) => setMembers((current) => current.map((item) => item.id === member.id ? { ...item, [key]: event.target.value } : item))} /></label>)}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={member.active} onChange={(event) => setMembers((current) => current.map((item) => item.id === member.id ? { ...item, active: event.target.checked } : item))} />Aktif üye</label></div><button type="button" className="mt-3 text-sm font-semibold text-red-700" onClick={() => setMembers((current) => current.filter((item) => item.id !== member.id))}>Üyeyi Sil</button></fieldset>)}</div><button type="button" disabled={members.length >= 30} onClick={() => setMembers((current) => [...current, { id: crypto.randomUUID(), name: "", role: "", title: "", active: true }])} className="text-sm font-bold text-cyan-800">+ Ekip Üyesi Ekle</button></>
          : <label className="block text-sm font-semibold">{completion.items.find((item) => item.key === selected)?.label}{selected === "website" ? <input name={selected} type="url" maxLength={500} placeholder="https://" defaultValue={startup?.website || ""} className={`${inputClass} mt-2`} /> : <textarea aria-label={completion.items.find((item) => item.key === selected)?.label} name={selected} maxLength={5000} rows={6} defaultValue={String(startup?.[selected] || "")} className={`${inputClass} mt-2 resize-y`} />}</label>}
          {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4"><button type="button" disabled={saving} onClick={() => setSelected(null)} className="px-3 py-2 text-sm font-semibold">Vazgeç</button><button disabled={saving || reading} className="min-w-28 rounded-md bg-cyan-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? "Kaydediliyor..." : reading ? "Yükleniyor..." : "Kaydet"}</button></div>
        </form></>}
    </dialog>
  </section>;
}
