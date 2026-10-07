import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import ApplicationCta from "@/components/ApplicationCta";
import Header from "@/components/Header";
import LideaCheckPublicAnnouncements from "@/components/LideaCheckPublicAnnouncements";
import KeywordMarquee from "@/components/KeywordMarquee";
import PreIncubationCountdown from "@/components/PreIncubationCountdown";

const boardMembers = [
  {
    name: "Mahmut Dabbit",
    title: "Dijital Proje Üreticisi / Mentor",
    image: "/profiles/mahmut-dabbit.png",
  },
  {
    name: "Altan Türel",
    title: "Girişimci / Mentor",
    image: "/profiles/altan-turel.png",
  },
  {
    name: "Ercan Altuğ Yılmaz",
    title: "Gamfed Kurucusu / Oyunlaştırma Uzmanı",
    image: "/profiles/ercan-altug-yilmaz.png",
  },
];

const timelineCards = [
  { title: "Ön Kuluçka", date: "22 Aralık - 20 Şubat", image: "/timeline-on-kulucka.png" },
  { title: "Kuluçka", date: "02 Mart - 01 Mayıs", image: "/timeline-kulucka.png" },
  { title: "Demo Day", date: "09 Mayıs 2026", image: "/timeline-demoday.png" },
];

const preIncubationTrainings = [
  { date: "2026-11-02", dateLabel: "02 Kasım 2026", day: "Pazartesi", week: "1. Hafta", title: "Ekip Tanışma ve Problem Seçimi" },
  { date: "2026-11-04", dateLabel: "04 Kasım 2026", day: "Çarşamba", week: "2. Hafta", title: "Müşteri Keşfi / The Mom Test" },
  { date: "2026-11-11", dateLabel: "11 Kasım 2026", day: "Çarşamba", week: "3. Hafta", title: "Çözüm Daraltma ve Konsept Testi" },
  { date: "2026-11-18", dateLabel: "18 Kasım 2026", day: "Çarşamba", week: "4. Hafta", title: "İş Modeli, Fiyat ve Pazar" },
  { date: "2026-11-25", dateLabel: "25 Kasım 2026", day: "Çarşamba", week: "5. Hafta", title: "İlk Temas ve Ölçeklenmeyen Erişim" },
  { date: "2026-12-02", dateLabel: "02 Aralık 2026", day: "Çarşamba", week: "6. Hafta", title: "Öğrenme Panosu ve Anlatıya Hazırlık" },
  { date: "2026-12-09", dateLabel: "09 Aralık 2026", day: "Çarşamba", week: "7. Hafta", title: "Şirket Zamanlaması, BİGG ve KOSGEB" },
  { date: "2026-12-16", dateLabel: "16 Aralık 2026", day: "Çarşamba", week: "8. Hafta", title: "3 Dakika Anlatı Mimarisi, Q&A ve Dayanıklılık" },
];

const secondPeriodPhotos = [
  { src: "/lidea-2-donem/01.jpg", title: "Lidea Girişim Programı ile Fethiye'de fikriniz uçuşa geçsin" },
  { src: "/lidea-2-donem/02.jpg", title: "Kuluçka programı şehirleri" },
  { src: "/lidea-2-donem/03.jpg", title: "Kuluçka programına geçen girişimler" },
  { src: "/lidea-2-donem/04.jpg", title: "Demo Day sunumları" },
  { src: "/lidea-2-donem/05.jpg", title: "Kuluçka programına seçilen girişimler" },
  { src: "/lidea-2-donem/06.jpg", title: "Demo Day birincilik ödülü" },
  { src: "/lidea-2-donem/07.jpg", title: "Demo Day ikincilik ödülü" },
  { src: "/lidea-2-donem/08.jpg", title: "LİDER özel ödülü" },
  { src: "/lidea-2-donem/09.jpg", title: "Lidea 2. dönem aile fotoğrafı" },
  { src: "/lidea-2-donem/10.jpg", title: "WEFIGAMES özel ödülü" },
  { src: "/lidea-2-donem/11.jpg", title: "2. dönem kapanış seçkisi" },
];

const barcodeBars = [10, 3, 7, 4, 12, 5, 3, 9, 6, 14, 4, 8, 3, 11, 5, 7];

const benefits = [
  { title: "9 Haftalık Ön Kuluçka", description: "İş fikrini doğrulama ve iş modelini olgunlaştırma odaklı eğitim dönemi." },
  { title: "8 Haftalık Kuluçka", description: "Büyüme, pazara hazırlık ve yatırım sürecine yönelik yoğun program." },
  { title: "Uzman Mentorluk", description: "Alanında deneyimli mentorlarla girişime özel yönlendirme ve geri bildirim." },
  { title: "Demo Day ve Fırsatlar", description: "Girişimini yatırımcılar, jüri ve ekosistem paydaşlarıyla buluşturma imkanı." },
];

const ecosystemPartners = [
  { name: "Hipokampüs", logo: "/hipokampus-logo-512.png", logoClassName: "h-28 w-28" },
  { name: "LİİDER", logo: "/liider-logo.png", logoClassName: "h-20 w-full max-w-52" },
  { name: "GamFed", logo: "/gamfed-logo.png", logoClassName: "h-20 w-full max-w-52" },
  { name: "Fethiye Ticaret ve Sanayi Odası", logo: "/ftso-logo.png", logoClassName: "h-28 w-28" },
  { name: "T.C. Ticaret Bakanlığı", logo: "/ticaret-bakanligi-logo-requested.png", logoClassName: "h-28 w-28" },
  { name: "GEKA", logo: "/geka-logo.png", logoClassName: "h-20 w-full max-w-52" },
  { name: "Fethiye Belediyesi", logo: "/fethiye-belediyesi-logo.png", logoClassName: "h-28 w-32" },
  { name: "Muğla Teknopark", logo: "/mugla-teknopark-logo.png", logoClassName: "h-20 w-full max-w-52" },
];

const pressCards = [
  {
    source: "Demirören Haber Ajansı (DHA)",
    sourceLogo: "/dha-logo.svg",
    sourceLogoClassName: "h-10",
    title: "Fethiye'nin ücretsiz girişimcilik programı tanıtıldı",
    description:
      "Programın ilk döneminde 50'den fazla başvuru alındığı, 26 girişimin ön kuluçkaya ve 14 girişimin kuluçkaya kabul edildiği aktarıldı.",
    href: "https://www.dha.com.tr/ekonomi/fethiyenin-ucretsiz-girisimcilik-programi-tanitildi-2542479",
  },
  {
    source: "Demirören Haber Ajansı (DHA)",
    sourceLogo: "/dha-logo.svg",
    sourceLogoClassName: "h-10",
    title: "Fethiye'de LİDEA Demo Day etkinliği gerçekleşti",
    description:
      "LIDEA Demo Day'in girişimcileri yatırımcılar, jüri üyeleri ve ekosistem temsilcileriyle buluşturduğu aktarıldı.",
    href: "https://www.dha.com.tr/kurumsal/fethiyede-lidea-girisimcilik-programi-demo-day-etkinligi-gerceklesti-2623881",
  },
  {
    source: "eGirişim",
    sourceLogo: "/egirisim-logo.svg",
    title: "Fethiye bölgesinin ilk girişimcilik programı: LİDEA",
    description:
      "24 haftalık programın ardından 15 girişimin yatırımcı ve jüri karşısına çıktığı haberleştirildi.",
    href: "https://egirisim.com/2025/04/21/fethiye-bolgesinin-ilk-girisimcilik-programi-lidea/",
  },
  {
    source: "Fethiye TV",
    sourceLogo: "/fethiye-tv-logo.svg",
    sourceLogoClassName: "h-14",
    sourceLogoWidth: 174,
    sourceLogoHeight: 64,
    title: "Lidea Girişimcilik Programı'nda Demo Day heyecanı",
    description:
      "15 girişimcinin projelerini yatırımcılar ve jüri önünde sunduğu Demo Day yerel basına yansıdı.",
    href: "https://www.fethiyetv.com/lidea-girisimcilik-programinda-demoday-heyecani",
  },
  {
    source: "İstanbul Arel Üniversitesi - ArtıArel",
    sourceLogo: "/arel-artiarel-logos.svg",
    sourceLogoClassName: "h-16",
    sourceLogoWidth: 220,
    sourceLogoHeight: 64,
    title: "Fethiye'den yükselen yenilik dalgası",
    description:
      "LIDEA, Fethiye'den yükselen girişimcilik ve yenilik hareketi olarak ele alındı; Agritech, yapay zeka, sürdürülebilirlik, turizm ve sağlık teknolojileri alanlarındaki girişimlere dikkat çekildi.",
    href: "https://arti.arel.edu.tr/fethiyeden-yukselen-yenilik-dalgasi-lidea-girisim-programindaydik/",
  },
];

const steps = [
  "Başvuru",
  "Ön Değerlendirme",
  "Seçim",
  "Eğitim & Mentorluk",
  "MVP & Doğrulama",
  "Demo Day",
];

export default function Home() {
  return (
    <main className="fethiye-page">
      <Header />
      <section className="grid-bg min-h-[82vh] border-b border-cyan-700/15">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1fr_.7fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-cyan-600/25 bg-white/35 px-4 py-2 text-sm font-bold shadow-[0_0_22px_rgba(23,230,210,.25)]">
              2027 • III. DÖNEM
            </div>
            <h1 className="max-w-4xl text-6xl font-black leading-[.95] tracking-[-.06em] md:text-8xl">
              FİKRİNİ GELİŞTİR.
              <br />
              <span className="text-[#00a6c8] drop-shadow-[0_0_18px_rgba(23,230,210,.5)]">
                GİRİŞİMİNİ BÜYÜT.
              </span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#052f36]/70">
              Fethiye'nin girişimcilik programında eğitim, mentorluk ve kaynak
              desteğiyle fikrini olgunlaştır; büyüme ve yatırım yolculuğuna hazırlan.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ApplicationCta
                className="rounded-full bg-[#063f46] px-7 py-4 font-bold text-white shadow-[0_0_26px_rgba(23,230,210,.45)]"
                openLabel="Başvurunu Yap →"
              />
              <a
                href="#hakkimizda"
                className="rounded-full border border-cyan-700/25 bg-white/25 px-7 py-4 font-bold text-[#063f46]"
              >
                Hakkımızda
              </a>
              <Link
                href="/lideacheck"
                className="rounded-full border border-[#00a6c8]/35 bg-white/55 px-7 py-4 font-bold text-[#063f46] shadow-[0_0_22px_rgba(0,166,200,.18)]"
              >
                LideaCheck →
              </Link>
            </div>
          </div>
          <div
            role="img"
            aria-label="Lidea Girişim Programı III. Dönem ön kuluçka başvuru afişi: Fikrin Likya'dan kalkışa geçsin"
            className="aspect-[1122/1402] w-full bg-[#052f36]"
            style={{
              backgroundImage: "url('/lidea-3-donem-afis.jpeg')",
              backgroundPosition: "center",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
            }}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {timelineCards.map((card, index) => {
            const hasImage = Boolean(card.image);

            return (
            <article
              className={`group relative min-h-[210px] overflow-hidden rounded-[1.75rem] border border-cyan-500/25 p-6 shadow-[0_24px_70px_rgba(0,86,102,.16),0_0_34px_rgba(23,230,210,.2)] backdrop-blur ${
                hasImage ? "bg-[#170b45] text-white" : "bg-white/45"
              }`}
              style={
                hasImage
                  ? {
                      backgroundImage: `linear-gradient(90deg, rgba(10, 5, 36, .82), rgba(18, 8, 58, .5)), url('${card.image}')`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }
                  : undefined
              }
              key={card.title}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00a6c8] via-[#17e6d2] to-[#8ad66f] shadow-[0_0_24px_rgba(23,230,210,.85)]" />
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#17e6d2]/20 blur-2xl transition group-hover:bg-[#8ad66f]/25" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={hasImage ? "text-sm font-black text-[#8ad66f]" : "text-sm font-black text-[#00a6c8]/75"}>0{index + 1}</p>
                  <h2 className={hasImage ? "mt-7 text-3xl font-black uppercase text-white" : "mt-7 text-3xl font-black uppercase text-[#052f36]"}>
                    {card.title}
                  </h2>
                </div>
                <div className={hasImage ? "rounded-2xl border border-white/20 bg-white/15 px-3 py-2 backdrop-blur" : "rounded-2xl border border-cyan-700/15 bg-white/50 px-3 py-2"}>
                  <div className="flex h-14 items-end gap-[3px]">
                    {barcodeBars.map((height, barIndex) => (
                      <span
                        className={hasImage ? "block w-[3px] rounded-full bg-white" : "block w-[3px] rounded-full bg-[#063f46]"}
                        style={{ height: `${height * 4}px` }}
                        key={`${card.title}-${barIndex}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className={hasImage ? "mt-10 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 backdrop-blur" : "mt-10 rounded-2xl border border-cyan-700/15 bg-[#eafff8]/70 px-4 py-3"}>
                <p className={hasImage ? "text-xs font-bold uppercase tracking-[.2em] text-[#8ad66f]" : "text-xs font-bold uppercase tracking-[.2em] text-[#0b7f5a]"}>
                  Tarih
                </p>
                <p className={hasImage ? "mt-1 text-xl font-black text-white" : "mt-1 text-xl font-black text-[#052f36]"}>
                  {card.date}
                </p>
              </div>
            </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <article
          className="lidea-period-card overflow-hidden rounded-[1.75rem] border border-cyan-500/25 bg-[#041419] text-white shadow-[0_28px_90px_rgba(0,86,102,.28),0_0_42px_rgba(23,230,210,.24)]"
          style={{ "--slide-count": secondPeriodPhotos.length } as CSSProperties}
        >
          <div className="grid gap-0 lg:grid-cols-[.72fr_1.28fr]">
            <div className="relative flex min-h-[430px] flex-col justify-between overflow-hidden p-7 sm:p-9">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(23,230,210,.22),transparent_34%),radial-gradient(circle_at_84%_78%,rgba(138,214,111,.18),transparent_36%)]" />
              <div className="absolute inset-y-0 right-0 w-px bg-white/10" />
              <div className="relative">
                <p className="text-sm font-black uppercase tracking-[.18em] text-[#17e6d2]">Arşiv</p>
                <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
                  2. Dönem Lidea Girişim Programı
                </h2>
                <p className="mt-5 max-w-md text-sm leading-7 text-white/68">
                  Başvurudan Demo Day ödüllerine uzanan ikinci dönem yolculuğu.
                </p>
              </div>

              <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {secondPeriodPhotos.map((photo, index) => (
                  <div
                    className="lidea-period-number rounded-md border border-white/12 bg-white/8 px-3 py-2"
                    key={photo.src}
                    style={
                      {
                        "--slide-index": index,
                        "--slide-duration": "4s",
                      } as CSSProperties
                    }
                  >
                    <span className="block text-lg font-black tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="mt-1 block truncate text-[11px] font-bold text-white/54">
                      {photo.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[520px] bg-black/55 p-4 sm:p-6">
              <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(23,230,210,.16),transparent_28%,rgba(138,214,111,.12)_78%,transparent)]" />
              <div className="relative h-full min-h-[488px] overflow-hidden rounded-lg border border-white/10 bg-[#020607]">
                {secondPeriodPhotos.map((photo, index) => (
                  <figure
                    className="lidea-period-slide absolute inset-0 bg-contain bg-center bg-no-repeat"
                    key={photo.src}
                    style={
                      {
                        "--slide-index": index,
                        "--slide-duration": "4s",
                        backgroundImage: `linear-gradient(135deg, rgba(23, 230, 210, .18), rgba(5, 47, 54, .12)), url('${photo.src}')`,
                      } as CSSProperties
                    }
                  >
                    <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/82 via-black/45 to-transparent px-5 pb-5 pt-20">
                      <span className="text-sm font-bold text-white/82">{photo.title}</span>
                      <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1 text-sm font-black tabular-nums text-white">
                        {String(index + 1).padStart(2, "0")} / {String(secondPeriodPhotos.length).padStart(2, "0")}
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>

      <PreIncubationCountdown />

      <KeywordMarquee />

      <LideaCheckPublicAnnouncements />

      <section id="hakkimizda" className="mx-auto max-w-7xl px-6 py-24">
        <p className="font-bold text-[#0b7f5a]">HAKKIMIZDA</p>
        <div className="mt-3 grid gap-8 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
          <h2 className="text-5xl font-black tracking-tight">
            Fikir aşamasından yatırıma uzanan iki adımlı girişimcilik programı.
          </h2>
          <p className="text-lg leading-8 text-[#052f36]/65">
            Ön kuluçka; erken aşama girişimlere eğitim, mentorluk ve kaynak desteği sunar.
            Kuluçka dönemi ise gelişmiş girişimlerin büyümesine, pazara hazırlanmasına ve
            yatırım fırsatlarına erişmesine odaklanır.
          </p>
        </div>

        <div className="mt-12">
          <div className="inline-flex rounded-full border border-cyan-700/20 bg-white/35 p-1 shadow-[0_0_28px_rgba(23,230,210,.22)]">
            <button className="rounded-full bg-[#063f46] px-6 py-3 text-sm font-bold text-white shadow-[0_0_22px_rgba(23,230,210,.38)]">
              Yönetim Kurulu
            </button>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {boardMembers.map((member) => (
              <article className="card p-6 text-center" key={member.name}>
                <div className="relative mx-auto flex aspect-square w-full max-w-[220px] items-center justify-center overflow-hidden rounded-3xl border border-cyan-600/25 bg-gradient-to-br from-white/60 via-[#d8fbff]/60 to-[#eafff8]/60 shadow-[0_0_28px_rgba(23,230,210,.24)]">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={`${member.name} profil fotoğrafı`}
                      fill
                      sizes="(min-width: 768px) 220px, 60vw"
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-cyan-700/20 bg-white/60 text-4xl font-black text-[#00a6c8]/45">
                      +
                    </div>
                  )}
                </div>
                <h3 className="mt-6 text-2xl font-black">{member.name}</h3>
                {member.title ? (
                  <p className="mt-2 text-sm font-bold uppercase tracking-[.18em] text-[#0b7f5a]">
                    {member.title}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="basinda-lidea" className="mx-auto max-w-7xl px-6 py-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-bold text-[#0b7f5a]">BASINDA LIDEA</p>
            <h2 className="mt-3 max-w-3xl text-5xl font-black tracking-tight">
              Basında LIDEA
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#052f36]/65">
              LIDEA Girişim Programı, Fethiye'de girişimcilik ekosisteminin gelişimine yönelik çalışmaları, lansmanları ve Demo Day etkinlikleriyle ulusal ve yerel basında yer aldı.
            </p>
          </div>
          <a
            href="https://www.google.com/search?q=LIDEA+Giri%C5%9Fim+Program%C4%B1+bas%C4%B1nda"
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#063f46] px-6 py-3 font-bold text-white shadow-[0_0_22px_rgba(23,230,210,.32)]"
          >
            Haberleri Keşfet
          </a>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {pressCards.map((item) => (
            <article className="card flex min-h-[280px] flex-col p-7" key={item.href}>
              {item.sourceLogo ? (
                <Image
                  src={item.sourceLogo}
                  alt={`${item.source} logosu`}
                  width={item.sourceLogoWidth ?? 144}
                  height={item.sourceLogoHeight ?? 38}
                  className={`${item.sourceLogoClassName ?? "h-7"} w-auto object-contain object-left`}
                />
              ) : (
                <p className="text-sm font-black uppercase text-[#0b7f5a]">
                  {item.source}
                </p>
              )}
              <h3 className="mt-5 text-2xl font-black leading-tight">
                {item.title}
              </h3>
              <p className="mt-4 flex-1 leading-7 text-[#052f36]/62">
                {item.description}
              </p>
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex font-black text-[#00a6c8]"
              >
                Haberi Görüntüle →
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="program" className="mx-auto max-w-7xl px-6 py-24">
        <p className="font-bold text-[#0b7f5a]">FİKİRDEN GİRİŞİME</p>
        <h2 className="mt-3 max-w-4xl text-5xl font-black tracking-tight">
          Girişimin için ihtiyaç duyduğun temel yapı tek programda.
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {benefits.map((benefit, i) => (
            <div className="card p-7" key={benefit.title}>
              <span className="text-sm font-black text-[#00a6c8]/70">0{i + 1}</span>
              <h3 className="mt-10 text-2xl font-black">{benefit.title}</h3>
              <p className="mt-3 text-[#052f36]/60">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-cyan-700/15 bg-white/30">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="font-bold text-[#0b7f5a]">EKOSİSTEM</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight">
            Program destekçileri ve paydaşları
          </h2>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-cyan-700/15 bg-cyan-800/15 sm:grid-cols-2 lg:grid-cols-4">
            {ecosystemPartners.map((partner) => (
              <div className="partner-logo-cell flex min-h-24 items-center justify-center bg-[#effffa] p-5 text-center font-black" key={partner.name}>
                {partner.logo ? (
                  <Image
                    src={partner.logo}
                    alt={`${partner.name} logosu`}
                    width={208}
                    height={112}
                    className={`${partner.logoClassName || "h-24 w-24"} object-contain`}
                  />
                ) : (
                  partner.name
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="takvim" aria-labelledby="training-calendar-title" className="scroll-mt-24 border-y border-cyan-700/15 bg-white/35">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm font-bold text-[#0b7f5a]">Eğitimler</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2 id="training-calendar-title" className="text-4xl font-black">Eğitim Takvimi</h2>
              <p className="mt-3 text-lg font-semibold text-[#052f36]">Girişimcilik Programı</p>
            </div>
            <div className="border-l-2 border-[#0b7f5a] pl-4">
              <p className="font-bold text-[#0b7f5a]">Ön Kuluçka</p>
              <p className="mt-1 text-sm text-[#052f36]">02 Kasım – 19 Aralık 2026</p>
            </div>
          </div>
          <div className="mt-8 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {preIncubationTrainings.map((training) => (
              <article key={training.date} aria-labelledby={`training-${training.date}`} className="flex min-w-0 flex-col rounded-lg border border-cyan-700/20 bg-white/80 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
                  <p className="text-[#0b7f5a]">{training.week}</p>
                  <p className="text-[#052f36]">{training.day}</p>
                </div>
                <time dateTime={training.date} className="mt-3 text-sm font-semibold text-[#052f36]">{training.dateLabel}</time>
                <h3 id={`training-${training.date}`} className="mt-5 break-words text-xl font-bold leading-7 text-[#052f36]">{training.title}</h3>
              </article>
            ))}
            <article aria-labelledby="training-demo-day" className="flex min-w-0 flex-col rounded-lg border border-[#0b7f5a]/30 bg-[#052f36] p-5 text-white">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
                <span aria-hidden="true" className="text-2xl">🏆</span>
                <p>Cumartesi</p>
              </div>
              <time dateTime="2026-12-19" className="mt-3 text-sm font-semibold">19 Aralık 2026</time>
              <h3 id="training-demo-day" className="mt-5 text-2xl font-black leading-7">DEMO DAY</h3>
              <p className="mt-3 text-sm text-[#8ad66f]">Ön Kuluçka</p>
            </article>
          </div>
        </div>
      </section>

      <section id="surec" className="bg-[#052f36] text-white shadow-[0_0_70px_rgba(0,166,200,.25)_inset]">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="font-bold text-[#17e6d2]">PROGRAM YOLCULUĞU</p>
          <h2 className="mt-3 text-5xl font-black">Başvurudan Demo Day'e.</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map((x, i) => (
              <div
                key={x}
                className="rounded-3xl border border-cyan-200/20 bg-white/5 p-7 shadow-[0_0_24px_rgba(23,230,210,.14)]"
              >
                <div className="text-[#8ad66f]">0{i + 1}</div>
                <div className="mt-12 text-2xl font-bold">{x}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sss" className="mx-auto max-w-7xl px-6 py-24">
        <p className="font-bold text-[#0b7f5a]">BİLMENİZ GEREKEN HER ŞEY</p>
        <div className="mt-3 grid gap-8 lg:grid-cols-[.82fr_1.18fr] lg:items-start">
          <div>
            <h2 className="text-5xl font-black tracking-tight">Sıkça Sorulan Sorular</h2>
          </div>
          <details className="rounded-lg border border-cyan-700/20 bg-white/45 p-6 shadow-[0_18px_55px_rgba(0,86,102,.12)] backdrop-blur" open>
            <summary className="cursor-pointer text-2xl font-black">Lidea Girişim Programı Nedir ?</summary>
            <p className="mt-5 text-lg leading-8 text-[#052f36]/65">
              LIDEA, girişimcileri bölgesel ve ulusal düzeyde başarıya ulaştırmayı amaçlayarak, iş
              dünyasında güçlü bir yer edinmelerine katkıda bulunur.
            </p>
          </details>
        </div>

        <div className="mt-16">
          <p className="font-bold text-[#0b7f5a]">PROGRAM TAKVİMİ</p>
          <h3 className="mt-3 text-4xl font-black tracking-tight">Program Takvimi</h3>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              ["Ön Kuluçka", "22 Aralık - 20 Şubat | 20:00"],
              ["Kuluçka", "02 Mart - 01 Mayıs | 20:00"],
              ["Demoday", "09 Mayıs 2026"],
            ].map(([title, date], index) => (
              <article
                className="relative min-h-52 overflow-hidden rounded-lg border border-cyan-600/20 bg-white/55 p-6 shadow-[0_18px_50px_rgba(0,86,102,.12)] backdrop-blur"
                key={title}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00a6c8] via-[#17e6d2] to-[#8ad66f]" />
                <p className="text-sm font-black text-[#00a6c8]">{String(index + 1).padStart(2, "0")}</p>
                <h4 className="mt-8 text-3xl font-black text-[#052f36]">{title}</h4>
                <p className="mt-6 rounded-md border border-cyan-700/15 bg-[#eafff8]/70 px-4 py-3 text-sm font-black text-[#0b7f5a]">
                  {date}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-gradient-to-br from-[#00a6c8] via-[#17e6d2] to-[#8ad66f] p-10 text-[#052f36] shadow-[0_0_55px_rgba(23,230,210,.48)] md:p-16">
          <h2 className="max-w-3xl text-5xl font-black">
            Sıradaki girişim neden seninki olmasın?
          </h2>
          <ApplicationCta
            className="mt-8 inline-block rounded-full bg-[#052f36] px-7 py-4 font-bold text-white shadow-[0_0_22px_rgba(5,47,54,.28)]"
          />
        </div>
      </section>

      <footer className="border-t border-cyan-800/15 px-6 py-10 text-center">
        <div className="mx-auto flex max-w-7xl flex-col items-center">
          <Image
            src="/lidea-logo.svg"
            alt="Likya Idea Girişim Programı"
            width={160}
            height={160}
            className="h-32 w-auto object-contain"
          />

          <div className="mt-6 flex items-center gap-3">
            {[
              {
                name: "LinkedIn",
                symbol: "in",
                href: "https://www.linkedin.com/company/lideagirisim/posts/?feedView=all",
              },
              {
                name: "Instagram",
                symbol: "📷",
                href: "https://www.instagram.com/lideagirisim/",
              },
              { name: "X", symbol: "X", href: "https://x.com/LideaGirisim" },
              {
                name: "YouTube",
                symbol: "▶",
                href: "https://www.youtube.com/@lideagirisim",
              },
            ].map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.name}
                title={social.name}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-800/20 bg-white text-base font-black text-[#052f36] shadow-sm transition hover:-translate-y-0.5 hover:border-[#00a6c8] hover:bg-[#052f36] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00a6c8]"
              >
                <span aria-hidden="true">{social.symbol}</span>
              </a>
            ))}
          </div>

          <p className="mt-8 text-center text-sm font-bold text-[#052f36]/60">
            Telif Hakkı 2026 - Likya Idea Girişim Programı
          </p>
        </div>
      </footer>
    </main>
  );
}
