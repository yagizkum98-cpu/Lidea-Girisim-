"use client";

import { useEffect, useState } from "react";
import { externalApplicationUrl } from "@/lib/application-intake";

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

  if (!applicationOpen) return <span aria-disabled="true" className={className}>BAŞVURULAR SONA ERDİ</span>;

  return (
    <a
      href={externalApplicationUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {openLabel}
    </a>
  );
}
