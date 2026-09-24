import Link from "next/link";
import ApplicationCta from "@/components/ApplicationCta";
import Header from "@/components/Header";
import LideaCheckPublicAnnouncements from "@/components/LideaCheckPublicAnnouncements";
import KeywordMarquee from "@/components/KeywordMarquee";
import TrainingCalendar from "@/components/TrainingCalendar";

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
    title: "Fethiye'nin ücretsiz girişimcilik programı tanıtıldı",
    description:
      "Programın ilk döneminde 50'den fazla başvuru alındığı, 26 girişimin ön kuluçkaya ve 14 girişimin kuluçkaya kabul edildiği aktarıldı.",
    href: "https://www.dha.com.tr/ekonomi/fethiyenin-ucretsiz-girisimcilik-programi-tanitildi-2542479",
  },
  {
    source: "Demirören Haber Ajansı (DHA)",
    title: "Fethiye'de LİDEA Demo Day etkinliği gerçekleşti",
    description:
      "LIDEA Demo Day'in girişimcileri yatırımcılar, jüri üyeleri ve ekosistem temsilcileriyle buluşturduğu aktarıldı.",
    href: "https://www.dha.com.tr/kurumsal/fethiyede-lidea-girisimcilik-programi-demo-day-etkinligi-gerceklesti-2623881",
  },
  {
    source: "eGirişim",
    title: "Fethiye bölgesinin ilk girişimcilik programı: LİDEA",
    description:
      "24 haftalık programın ardından 15 girişimin yatırımcı ve jüri karşısına çıktığı haberleştirildi.",
    href: "https://egirisim.com/2025/04/21/fethiye-bolgesinin-ilk-girisimcilik-programi-lidea/",
  },
  {
    source: "Fethiye TV",
    title: "Lidea Girişimcilik Programı'nda Demo Day heyecanı",
    description:
      "15 girişimcinin projelerini yatırımcılar ve jüri önünde sunduğu Demo Day yerel basına yansıdı.",
    href: "https://www.fethiyetv.com/lidea-girisimcilik-programinda-demoday-heyecani",
  },
  {
    source: "İstanbul Arel Üniversitesi - ArtıArel",
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
    <main>
      <Header />
      <section className="grid-bg min-h-[82vh] border-b border-cyan-700/15">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1fr_.7fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-cyan-600/25 bg-white/35 px-4 py-2 text-sm font-bold shadow-[0_0_22px_rgba(23,230,210,.25)]">
              2026 • II. DÖNEM
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
            className="relative min-h-[520px] overflow-hidden rounded-[1.75rem] border border-cyan-200/30 bg-[#052f36] p-8 text-white shadow-[0_24px_80px_rgba(0,86,102,.28),0_0_42px_rgba(23,230,210,.32)]"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(5, 47, 54, .2), rgba(5, 47, 54, .72)), url('/lidea-pegasus-mvp.png')",
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(23,230,210,.18),transparent_42%)]" />
            <div className="relative flex h-full min-h-[456px] flex-col justify-end">
              <div className="text-7xl font-black drop-shadow-[0_0_20px_rgba(23,230,210,.65)]">
                09
              </div>
              <div className="mt-2 text-3xl font-black drop-shadow-[0_0_16px_rgba(23,230,210,.75)]">
                MAYIS 2026 • DEMO DAY
              </div>
              <div className="mt-8 h-2 rounded-full bg-gradient-to-r from-[#00a6c8] via-[#17e6d2] to-[#8ad66f] shadow-[0_0_28px_rgba(23,230,210,.7)]" />
            </div>
          </div>
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
                <div className="mx-auto flex aspect-square w-full max-w-[220px] items-center justify-center overflow-hidden rounded-3xl border border-cyan-600/25 bg-gradient-to-br from-white/60 via-[#d8fbff]/60 to-[#eafff8]/60 shadow-[0_0_28px_rgba(23,230,210,.24)]">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={`${member.name} profil fotoğrafı`}
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
              <p className="text-sm font-black uppercase text-[#0b7f5a]">
                {item.source}
              </p>
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
                  <img
                    src={partner.logo}
                    alt={`${partner.name} logosu`}
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

      <TrainingCalendar />

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

      <section id="sss" className="mx-auto max-w-4xl px-6 py-24">
        <h2 className="text-5xl font-black">Sık Sorulan Sorular</h2>
        {[
          {
            question: "Lidea Girişim Programı nedir?",
            answer: "Erken aşama fikirleri ön kuluçkada olgunlaştıran, gelişmiş girişimleri ise kuluçka döneminde büyüme ve yatırıma hazırlayan iki aşamalı bir programdır.",
          },
          {
            question: "Kimler başvurabilir?",
            answer: "İş fikrini geliştirmek veya mevcut girişimini büyütmek isteyen girişimciler programa başvurabilir.",
          },
          {
            question: "Fikir aşamasında başvurabilir miyim?",
            answer: "Evet. Ön kuluçka programı erken aşamadaki fikirlerin doğrulanması ve iş modeline dönüştürülmesi için tasarlanmıştır.",
          },
          {
            question: "Tek başıma başvurabilir miyim?",
            answer: "Evet. Başvuru formunda ekip büyüklüğünü bir kişi olarak belirterek bireysel başvuru yapabilirsiniz.",
          },
          {
            question: "Ön kuluçka ne zaman?",
            answer: "Ön kuluçka programı 22 Aralık - 20 Şubat tarihleri arasında, eğitimler saat 20.00'de gerçekleşir.",
          },
          {
            question: "Kuluçka ne zaman?",
            answer: "Kuluçka programı 02 Mart - 01 Mayıs tarihleri arasında, eğitimler saat 20.00'de gerçekleşir.",
          },
          {
            question: "Demo Day ne zaman?",
            answer: "Lidea Demo Day, 09 Mayıs 2026 tarihinde Fethiye'de düzenlenir.",
          },
        ].map((item) => (
          <details className="border-b border-cyan-800/15 py-6" key={item.question}>
            <summary className="cursor-pointer text-xl font-bold">{item.question}</summary>
            <p className="pt-4 text-[#052f36]/65">
              {item.answer}
            </p>
          </details>
        ))}
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
    </main>
  );
}
