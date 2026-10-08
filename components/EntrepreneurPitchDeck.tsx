"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

const maxFileBytes = 3 * 1024 * 1024;
const inputClass = "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-600 disabled:opacity-60";

type PitchDeckFile = {
  id: string;
  version: number;
  fileName: string;
  uploadedAt: string;
};

export default function EntrepreneurPitchDeck({ localWorkspace, hasStartup }: { localWorkspace: boolean; hasStartup: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [decks, setDecks] = useState<PitchDeckFile[]>([]);
  const [startupId, setStartupId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (localWorkspace || !hasStartup) return;
    let disposed = false;
    setLoading(true);
    void fetch("/api/entrepreneur/pitch-decks", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { ok: boolean; startupId?: string; decks?: PitchDeckFile[]; error?: string };
        if (!response.ok || !result.ok) throw new Error(result.error || "Pitch Deck bilgisi alınamadı.");
        if (disposed) return;
        setStartupId(result.startupId || "");
        setDecks(result.decks || []);
      })
      .catch((error: unknown) => { if (!disposed) setNotice(error instanceof Error ? error.message : "Pitch Deck bilgisi alınamadı."); })
      .finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; };
  }, [hasStartup, localWorkspace]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setNotice("");
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      event.target.value = "";
      setNotice("Yalnızca PDF dosyası yükleyebilirsiniz.");
    } else if (selected.size === 0 || selected.size > maxFileBytes) {
      setFile(null);
      event.target.value = "";
      setNotice("PDF dosyası boş olamaz ve 3 MB'ı aşamaz.");
    }
  }

  async function savePitchDeck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || saving) return;
    setSaving(true);
    setNotice("");
    try {
      const signature = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
      if (signature !== "%PDF-") throw new Error("Seçilen dosya geçerli bir PDF değil.");

      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/entrepreneur/pitch-decks", { method: "POST", body });
      const result = await response.json() as { ok: boolean; startupId?: string; deck?: PitchDeckFile; error?: string };
      if (!response.ok || !result.ok || !result.deck) throw new Error(result.error || "PDF kaydedilemedi.");

      setStartupId(result.startupId || startupId);
      setDecks((current) => [result.deck!, ...current]);
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setNotice("Pitch Deck kaydedildi ve Demo Day alanına iletildi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "PDF kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  const latestDeck = decks[0];

  return (
    <section className="max-w-3xl rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-black">Demo Day Pitch Deck</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Girişiminizin sunum dosyasını PDF olarak yükleyin. Kaydedilen dosya yönetim panelindeki Demo Day alanında görüntülenir.</p>

      {localWorkspace ? (
        <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Kalıcı dosya yüklemek için gerçek girişimci hesabıyla giriş yapın.</p>
      ) : !hasStartup ? (
        <p className="mt-5 rounded-md bg-slate-50 p-4 text-sm text-slate-600">PDF yüklemek için girişiminizin programa kabul edilmesi gerekir.</p>
      ) : (
        <>
          <form onSubmit={savePitchDeck} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              PDF dosyası · En fazla 3 MB
              <input ref={fileInput} type="file" name="file" accept="application/pdf,.pdf" onChange={chooseFile} disabled={saving} className={inputClass} />
            </label>
            <button type="submit" disabled={!file || saving} className="h-11 rounded-md bg-[#063f46] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </form>

          {file ? <p className="mt-3 break-all text-sm text-slate-600">Seçilen dosya: {file.name}</p> : null}
          {notice ? <p role="status" className="mt-4 rounded-md bg-cyan-50 p-3 text-sm font-semibold text-cyan-900">{notice}</p> : null}
          {loading ? <p className="mt-5 text-sm text-slate-500">Pitch Deck bilgisi yükleniyor...</p> : latestDeck ? (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="text-xs font-bold uppercase text-slate-500">Son kaydedilen · v{latestDeck.version}</p>
              <a href={`/api/startups/${startupId}/pitch-decks/${latestDeck.id}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block break-all font-bold text-cyan-800 underline underline-offset-4">{latestDeck.fileName}</a>
              <p className="mt-1 text-xs text-slate-500">{new Date(latestDeck.uploadedAt).toLocaleDateString("tr-TR")}</p>
            </div>
          ) : !loading && !notice ? <p className="mt-5 text-sm text-slate-500">Henüz Pitch Deck yüklenmedi.</p> : null}
        </>
      )}
    </section>
  );
}
