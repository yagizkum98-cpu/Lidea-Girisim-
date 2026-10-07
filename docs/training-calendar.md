# Egitim Takvimi

Ana sayfa, admin ve girisimci takvimlerinin ortak baslangic kaynagi
`lib/trainings.ts` dosyasidir: sekiz On Kulucka egitimi ve 19 Aralik 2026 Demo Day.
Saatler tahmin edilmez; admin tarih, baslangic/bitis saati ve toplanti URL'sini tanimlar.

## Ekranlar

- Admin: `/admin/program`, `Egitim Takvimi` sekmesi. Link, saat, konum, durum,
  1 gun/1 saat/10 dakika hatirlatmalari ve yonetici hatirlatmalari duzenlenebilir.
- Girisimci: `/girisimci`, `Egitim Takvimi` menusu. Haftalik takip, egitime katilim,
  Google Takvim ve `.ics` indirme; yonetici duzenleme kontrolleri yoktur.
- Bildirimlerin `Egitimi Goruntule` baglantisi `?egitim=<id>` ile dogru egitimi acar.
- Ana sayfa yalnizca tarih/saat/baslik/durum bilgisini gosterir; toplanti URL'si,
  takipci kimlikleri ve katilim bilgileri public API cevabina eklenmez.

## Sunucu

MongoDB replica set/Atlas ve mevcut `program-3` kaydi gereklidir.
Alternatif program icin `TRAINING_PROGRAM_ID` kullanilir. Prisma client'i
`npm run db:generate` ile yenileyin; bulut DB hazir oldugunda `npm run db:push`
ile semayi dogrulayin. Bu degisiklik yerel `.env` degerlerini buluta aktarmaz.

- `GET /api/trainings?view=public`: herkese acik ozet; toplanti linkleri yok.
- `GET /api/trainings?view=admin`: gercek SUPER_ADMIN / PROGRAM_ADMIN oturumu ile detaylar ve takip/giris sayilari.
- `GET /api/trainings?view=participant`: oturumlu girisimci icin detaylar ve kendi takip bilgisi.
- `PATCH /api/trainings/:id`: yalnizca program yonetimi yetkisi; degisiklik/iptal bildirimi.
- `POST /api/trainings/:id/follow`: oturumdaki kullanicinin takip tercihi; body `{ "following": true }`.
- `GET /api/trainings/:id/join`: oturum kontrolu, guncel URL'ye 303 yonlendirme ve giris kaydi.
- `POST /api/trainings/reminders`: oturumlu takvimlerde vadesi gelen bildirimleri arka planda isler.

Oturum bulunmayan admin ekrani da yalnizca yerel calisma alanini duzenler; sunucuya
egitim yazma yetkisi vermez. Oturum bulunmayan girisimci ekrani mevcut Tester yerel calisma alanini kullanir.
Gercek ENTREPRENEUR oturumu varsa profil ve egitimler sunucudan yuklenir. Admin sorgusunda DB'ye
ulasilamazsa ekran acikca yerel modu gosterir. Yerel modda veriler ayni tarayicinin
sekmeleri arasinda paylasilir; cihazlar arasi senkronizasyon saglanmaz.

## Hatirlatmalar

Saat tanimlanmamis, iptal edilmis veya baslamis egitimlere hatirlatma gonderilmez.
Takip eden girisimciler ve yonetici hatirlatmalari aciksa egitimin yoneticisi hedeflenir.
Kalici bildirim ID'si egitim, baslangic saati, hatirlatma araligi ve aliciya gore
uretilir; tekrar calistirma ayni bildirimi yeniden gondermez. Tarih/saat degisince
yeni takvim icin yeniden hatirlatma olusur. Linkler takvim dosyasinda dogrudan
Zoom sifresini aciga cikarmak yerine egitimin sabit Lidea detay adresini kullanir.

Paneller kapaliyken sunucu hatirlatmalari icin en az 32 karakterlik `CRON_SECRET`
tanimlayin ve guvenilir bir zamanlayicidan her 5 dakikada su istegi gonderin:

```http
GET /api/cron/training-reminders
Authorization: Bearer <CRON_SECRET>
```

Cron secret yoksa endpoint 503; yanlis secret ile 401 doner. Zamanlayici bu repoda
otomatik bir ucretli servis/plana baglanmaz; ortaminiza gore ayrica kurulmalidir.
Oturumlu takvim acikken de vadesi gelen sunucu bildirimleri ayri bir istekle islenir;
bildirim hatasi takvimin yuklenmesini engellemez. Yerel moddaki
hatirlatmalar panel acikken calisir. Saat tanimli `.ics` dosyalari VALARM kayitlari
icerir; takvim uygulamasi destekliyorsa kendi cihaz hatirlatmalarini da olusturur.
Bu altyapi platform ici bildirim uretir; e-posta/SMS gonderimi eklenmemistir.
