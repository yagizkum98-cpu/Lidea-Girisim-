# Lovable Basvuru Entegrasyonu

Ana sayfadaki basvuru dugmeleri https://lidea-onkulucka.lovable.app/ adresini yeni sekmede acar.
Admin alici API hazirdir; otomatik aktarim, Lovable projesindeki sunucu gonderim
islemi asagidaki endpoint'e baglandiktan sonra calisir. Yayinlanmis formun URL'si
tek basina bu sunucu kodunu degistirme yetkisi vermez.

## Yapilandirma

- Lidea/Vercel: `LOVABLE_APPLICATION_WEBHOOK_SECRET` en az 32 karakterlik rastgele bir gizli anahtar.
- Lovable sunucusu: ayni `LOVABLE_APPLICATION_WEBHOOK_SECRET` degeri. Anahtari tarayici koduna veya `VITE_*` degiskenlerine koymayin.
- Lidea/Vercel: `LOVABLE_APPLICATION_PROGRAM_ID` hedef programin veritabani ID'si; varsayilan `program-3`.
- Hedef program MongoDB'de mevcut ve `applicationOpen: true` olmalidir.
- Production endpoint Lovable sunucusundan erisilebilir olmalidir. Vercel Deployment Protection etkinse servis erisimi ayarlanmalidir.

## Lovable Gonderim Kodu

Formun mevcut sunucu gonderim isleminde, basvuru kalici kaydedildikten sonra bu
istegi sunucudan gonderin. `savedSubmission.id` her tekrar denemede ayni olmalidir.
`validatedFormData` formun mevcut fullName, startupName, trlLevel, consentKvkk vb.
alanlaridir. Kullaniciya basarili aktarim mesaji ancak alici onayindan sonra gosterilir.

```ts
const response = await fetch(
  "https://lideagirisim2027.vercel.app/api/integrations/lovable/applications",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LOVABLE_APPLICATION_WEBHOOK_SECRET}`,
    },
    body: JSON.stringify({
      submissionId: savedSubmission.id,
      submittedAt: new Date(savedSubmission.createdAt).toISOString(),
      data: validatedFormData,
    }),
    signal: AbortSignal.timeout(15000),
  },
);
if (!response.ok) {
  // Preserve the saved form and schedule a durable retry with the same submissionId.
  throw new Error(`Lidea aktarimi basarisiz: ${response.status}`);
}
const receipt = await response.json();
// Persist receipt.applicationId and receipt.applicationNo alongside the original submission.
```

## Sonuc ve Tekrar Deneme

`201` yeni basvuru, `200` ayni gonderimin tekraridir. Basvuru `NEW` / `Yeni`
durumunda admin panelindeki `/admin/basvurular` listesine eklenir. Liste acikken
30 saniyede bir yenilenir. Detaydaki `Basvuru Formu` sekmesi tum yanitlari gosterir.
Tekrar gonderim, incelenmis basvurunun durumunu veya bilgilerini sifirlamaz.
Bu import mevcut kullanici sifrelerini degistirmez ve otomatik girisimci hesabi acmaz.

`400` veri/JSON hatasi, `401` gizli anahtar hatasi, `409` basvurular kapali,
`413` 64 KiB siniri, `415` JSON gerekli, `503` entegrasyon/program ayarlanmamis.
Ag hatalari ve `5xx` yanitlari kalici kuyruktan tekrar denenmelidir. Dogrulama
hatalari yeniden denenmeden once duzeltilmelidir.

Lovable editorune uygulanacak istek: "Basvuru formunun sunucu gonderim islemine,
bu dokumandaki Lidea API aktarimini ve kalici tekrar deneme kuyrugunu ekle.
Gizli anahtari sadece sunucu ortaminda tut. Tum form yanitlarini aynen gonder;
ayni basvuru icin sabit submissionId kullan."
