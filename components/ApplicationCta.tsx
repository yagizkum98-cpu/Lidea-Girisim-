"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const programStorageKey = "lidea-program";

type ApplicationCtaProps = {
  className: string;
  openLabel?: string;
};

function readApplicationOpen() {
  const saved = window.localStorage.getItem(programStorageKey);
  if (!saved) return true;

  try {
    return Boolean((JSON.parse(saved) as { applicationOpen?: boolean }).applicationOpen);
  } catch {
    return true;
  }
}

export default function ApplicationCta({
  className,
  openLabel = "3. Döneme Başvur →",
}: ApplicationCtaProps) {
  const [applicationOpen, setApplicationOpen] = useState(true);

  useEffect(() => {
    const syncProgram = () => setApplicationOpen(readApplicationOpen());
    syncProgram();
    window.addEventListener("storage", syncProgram);
    window.addEventListener("focus", syncProgram);
    window.addEventListener("lidea-program-updated", syncProgram);

    return () => {
      window.removeEventListener("storage", syncProgram);
      window.removeEventListener("focus", syncProgram);
      window.removeEventListener("lidea-program-updated", syncProgram);
    };
  }, []);

  return (
    <Link
      href="/basvuru"
      aria-disabled={!applicationOpen}
      className={className}
    >
      {applicationOpen ? openLabel : "BAŞVURULAR SONA ERDİ"}
    </Link>
  );
}
