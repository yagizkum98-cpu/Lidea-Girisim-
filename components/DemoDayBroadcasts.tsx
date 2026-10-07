"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const broadcasts = [
  { period: "I", title: "Lidea Girişim I. Dönem DEMODAY YouTube'da!", videoUrl: "https://www.youtube.com/watch?v=sbkKHFdLet4", cover: "/demoday-first-period-youtube-cover.jpg" },
  { period: "II", title: "Lidea Girişim II. Dönem DEMODAY YouTube'da!", videoUrl: "https://www.youtube.com/watch?v=2AYMawl6thQ", cover: "/demoday-youtube-cover.jpg" },
];

export default function DemoDayBroadcasts() {
  const container = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = container.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).dataset.revealed = "true";
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    element.dataset.motionReady = "true";
    element.querySelectorAll(".broadcast-entry").forEach((entry) => observer.observe(entry));
    return () => { observer.disconnect(); delete element.dataset.motionReady; };
  }, []);

  return (
    <section ref={container} id="demoday-yayinlari" aria-label="Demo Day YouTube yayınları" className="scroll-mt-24">
      {broadcasts.map((broadcast, index) => (
        <article key={broadcast.period} aria-labelledby={`broadcast-title-${broadcast.period}`} className={`demoday-broadcast ${index === 1 ? "demoday-broadcast-dark" : ""}`}>
          <div className="broadcast-entry demoday-broadcast-inner">
            <div className="min-w-0">
              <p className="broadcast-eyebrow"><span aria-hidden="true" className="broadcast-youtube-icon">▶</span>YouTube&apos;da Yayında</p>
              <h2 id={`broadcast-title-${broadcast.period}`} className="broadcast-title">{broadcast.title}</h2>
              <p className="broadcast-description">Girişimlerin final sunumlarını ve jüri değerlendirmelerini kaydından izleyin.</p>
              <a href={broadcast.videoUrl} target="_blank" rel="noopener noreferrer" className="broadcast-watch">
                <span aria-hidden="true">▶</span><span>Yayını İzle</span><span aria-hidden="true" className="broadcast-arrow">↗</span>
              </a>
            </div>
            <a href={broadcast.videoUrl} target="_blank" rel="noopener noreferrer" aria-label={`${broadcast.period}. Dönem Demo Day yayınını YouTube'da izle`} className="broadcast-preview">
              <Image src={broadcast.cover} alt={`Lidea ${broadcast.period}. Dönem Demo Day YouTube video kapağı`} width={1280} height={720} sizes="(min-width: 1024px) 520px, (min-width: 768px) 45vw, 100vw" className="broadcast-cover" />
              <span aria-hidden="true" className="broadcast-play">▶</span>
            </a>
          </div>
        </article>
      ))}
    </section>
  );
}
