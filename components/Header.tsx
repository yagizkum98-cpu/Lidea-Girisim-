import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-cyan-700/15 bg-[#eafff8]/80 shadow-[0_0_35px_rgba(23,230,210,.22)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" aria-label="Lidea ana sayfa" className="block shrink-0">
          <img
            src="/lidea-logo.svg"
            alt="Lidea Yalın Idea Girişim Programı"
            className="h-12 w-auto"
          />
        </Link>
        <nav className="hidden gap-7 text-sm font-semibold md:flex">
          <a href="/#hakkimizda">Hakkımızda</a>
          <a href="/#program">Program</a>
          <a href="/#surec">Süreç</a>
          <a href="/#sss">SSS</a>
        </nav>
        <Link
          href="/basvuru"
          className="rounded-full bg-[#063f46] px-5 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(23,230,210,.42)]"
        >
          3. Döneme Başvur →
        </Link>
      </div>
    </header>
  );
}
