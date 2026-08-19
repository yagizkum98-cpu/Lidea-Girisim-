import Link from "next/link";
import Header from "@/components/Header";
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

const timelineCards = ["Ön Kuluçka", "Kuluçka", "DemoDay"];

const barcodeBars = [10, 3, 7, 4, 12, 5, 3, 9, 6, 14, 4, 8, 3, 11, 5, 7];

const benefits = [
  "Mentorluk",
  "MVP Geliştirme",
  "İş Modeli",
  "Networking",
  "Eğitimler",
  "Demo Day",
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
              3. DÖNEM • MVP
            </div>
            <h1 className="max-w-4xl text-6xl font-black leading-[.95] tracking-[-.06em] md:text-8xl">
              FİKRİNİ GELİŞTİR.
              <br />
              <span className="text-[#00a6c8] drop-shadow-[0_0_18px_rgba(23,230,210,.5)]">
                GİRİŞİMİNİ BÜYÜT.
              </span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#052f36]/70">
              Eğitim, mentorluk, iş modeli doğrulama ve MVP geliştirme desteğiyle
              girişimcilik yolculuğunu bir sonraki aşamaya taşı.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/basvuru"
                className="rounded-full bg-[#063f46] px-7 py-4 font-bold text-white shadow-[0_0_26px_rgba(23,230,210,.45)]"
              >
                Başvurunu Yap →
              </Link>
              <a
                href="#hakkimizda"
                className="rounded-full border border-cyan-700/25 bg-white/25 px-7 py-4 font-bold text-[#063f46]"
              >
                Hakkımızda
              </a>
            </div>
          </div>
          <div className="card p-8">
            <img
              src="/lidea-logo.svg"
              alt="Lidea Yalın Idea Girişim Programı"
              className="h-auto w-full max-w-[300px]"
            />
            <div className="mt-20 text-7xl font-black">03</div>
            <div className="mt-2 text-3xl font-black">DÖNEM</div>
            <div className="mt-12 h-2 rounded-full bg-gradient-to-r from-[#00a6c8] via-[#17e6d2] to-[#8ad66f] shadow-[0_0_28px_rgba(23,230,210,.7)]" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {timelineCards.map((card, index) => {
            const image =
              index === 0
                ? "/timeline-on-kulucka.png"
                : index === 1
                  ? "/timeline-kulucka.png"
                  : "/timeline-demoday.png";
            const hasImage = Boolean(image);

            return (
            <article
              className={`group relative min-h-[210px] overflow-hidden rounded-[1.75rem] border border-cyan-500/25 p-6 shadow-[0_24px_70px_rgba(0,86,102,.16),0_0_34px_rgba(23,230,210,.2)] backdrop-blur ${
                hasImage ? "bg-[#170b45] text-white" : "bg-white/45"
              }`}
              style={
                hasImage
                  ? {
                      backgroundImage: `linear-gradient(90deg, rgba(10, 5, 36, .82), rgba(18, 8, 58, .5)), url('${image}')`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }
                  : undefined
              }
              key={card}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00a6c8] via-[#17e6d2] to-[#8ad66f] shadow-[0_0_24px_rgba(23,230,210,.85)]" />
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#17e6d2]/20 blur-2xl transition group-hover:bg-[#8ad66f]/25" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={hasImage ? "text-sm font-black text-[#8ad66f]" : "text-sm font-black text-[#00a6c8]/75"}>0{index + 1}</p>
                  <h2 className={hasImage ? "mt-7 text-3xl font-black uppercase text-white" : "mt-7 text-3xl font-black uppercase text-[#052f36]"}>
                    {card}
                  </h2>
                </div>
                <div className={hasImage ? "rounded-2xl border border-white/20 bg-white/15 px-3 py-2 backdrop-blur" : "rounded-2xl border border-cyan-700/15 bg-white/50 px-3 py-2"}>
                  <div className="flex h-14 items-end gap-[3px]">
                    {barcodeBars.map((height, barIndex) => (
                      <span
                        className={hasImage ? "block w-[3px] rounded-full bg-white" : "block w-[3px] rounded-full bg-[#063f46]"}
                        style={{ height: `${height * 4}px` }}
                        key={`${card}-${barIndex}`}
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
                  Tarih belirlenecek
                </p>
              </div>
            </article>
            );
          })}
        </div>
      </section>

      <section id="hakkimizda" className="mx-auto max-w-7xl px-6 py-24">
        <p className="font-bold text-[#0b7f5a]">HAKKIMIZDA</p>
        <div className="mt-3 grid gap-8 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
          <h2 className="text-5xl font-black tracking-tight">
            Lidea, girişim fikrini sahaya taşıyan yalın gelişim programıdır.
          </h2>
          <p className="text-lg leading-8 text-[#052f36]/65">
            Fethiye'nin mavi-yeşil enerjisinden ilham alan program; fikir, ekip,
            ürün ve pazar doğrulama adımlarını mentor desteğiyle bir araya getirir.
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

      <section id="program" className="mx-auto max-w-7xl px-6 py-24">
        <p className="font-bold text-[#0b7f5a]">FİKİRDEN GİRİŞİME</p>
        <h2 className="mt-3 max-w-4xl text-5xl font-black tracking-tight">
          Girişimin için ihtiyaç duyduğun temel yapı tek programda.
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {benefits.map((x, i) => (
            <div className="card p-7" key={x}>
              <span className="text-sm font-black text-[#00a6c8]/70">0{i + 1}</span>
              <h3 className="mt-10 text-2xl font-black">{x}</h3>
              <p className="mt-3 text-[#052f36]/60">
                Uygulamalı, girişim odaklı ve ölçeklenebilir gelişim desteği.
              </p>
            </div>
          ))}
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
          "Kimler başvurabilir?",
          "Fikir aşamasında başvurabilir miyim?",
          "Tek başıma başvurabilir miyim?",
          "Program nasıl ilerliyor?",
        ].map((q) => (
          <details className="border-b border-cyan-800/15 py-6" key={q}>
            <summary className="cursor-pointer text-xl font-bold">{q}</summary>
            <p className="pt-4 text-[#052f36]/65">
              Program koşulları ve kesin bilgiler 3. dönem duyurularına göre yönetim
              panelinden güncellenebilir.
            </p>
          </details>
        ))}
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-gradient-to-br from-[#00a6c8] via-[#17e6d2] to-[#8ad66f] p-10 text-[#052f36] shadow-[0_0_55px_rgba(23,230,210,.48)] md:p-16">
          <h2 className="max-w-3xl text-5xl font-black">
            Sıradaki girişim neden seninki olmasın?
          </h2>
          <Link
            href="/basvuru"
            className="mt-8 inline-block rounded-full bg-[#052f36] px-7 py-4 font-bold text-white shadow-[0_0_22px_rgba(5,47,54,.28)]"
          >
            3. Döneme Başvur →
          </Link>
        </div>
      </section>
    </main>
  );
}
