const rows = [
  {
    text: "Fintech / Demo / Ön Kuluçka /",
    className: "keyword-marquee-track keyword-marquee-track-slow",
  },
  {
    text: "Startup / Yatırım / İnovasyon / Fintech / Demo / Ön Kuluçka /",
    className: "keyword-marquee-track keyword-marquee-track-reverse",
  },
  {
    text: "Yeni Nesil Zeka / Gelecek Şimdi / İnovasyonu Güçlendirme / Daha Akıllı Yarın /",
    className: "keyword-marquee-track keyword-marquee-track-fast",
  },
];

export default function KeywordMarquee() {
  return (
    <section className="keyword-marquee" aria-label="Lidea program temaları">
      <p className="sr-only">{rows.map((row) => row.text).join(" ")}</p>
      <div className="keyword-marquee-lines" aria-hidden="true">
        {rows.map((row) => (
          <div className="keyword-marquee-row" key={row.text}>
            <div className={row.className}>
              {[0, 1].map((copy) => (
                <span className="keyword-marquee-copy" key={copy}>
                  {row.text}
                  <span className="keyword-marquee-mark" />
                  {row.text}
                  <span className="keyword-marquee-mark" />
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
