"use client";

import { useEffect, useState } from "react";

type Language = "tr" | "en";

const languageKey = "lidea-language";

const dictionary: Record<string, string> = {
  "Hakkımızda": "About",
  "Program": "Program",
  "Süreç": "Process",
  "SSS": "FAQ",
  "Girişimci": "Entrepreneur",
  "GiriÅŸimci": "Entrepreneur",
  "Jüri": "Jury",
  "Admin": "Admin",
  "3. Döneme Başvur →": "Apply for Cohort 3 →",
  "Başvurunu Yap →": "Apply Now →",
  "3. Döneme Başvur â†’": "Apply for Cohort 3 →",
  "FİKRİNİ GELİŞTİR.": "BUILD YOUR IDEA.",
  "GİRİŞİMİNİ BÜYÜT.": "GROW YOUR STARTUP.",
  "3. DÖNEM • MVP": "COHORT 3 • MVP",
  "DÖNEM": "COHORT",
  "Tarih": "Date",
  "Tarih belirlenecek": "Date to be announced",
  "Yönetim Kurulu": "Board",
  "Eğitim Takvimi": "Training Calendar",
  "Eğitim Adı": "Training Name",
  "Program Yolculuğu": "Program Journey",
  "Başvurudan Demo Day'e.": "From Application to Demo Day.",
  "Sık Sorulan Sorular": "Frequently Asked Questions",
  "Kimler başvurabilir?": "Who can apply?",
  "Fikir aşamasında başvurabilir miyim?": "Can I apply at the idea stage?",
  "Tek başıma başvurabilir miyim?": "Can I apply alone?",
  "Program nasıl ilerliyor?": "How does the program work?",
  "3. Dönem Başvuru Formu": "Cohort 3 Application Form",
  "Başvuru alındı.": "Application received.",
  "Ad Soyad": "Full Name",
  "E-posta": "Email",
  "Telefon": "Phone",
  "Girişim Adı": "Startup Name",
  "Şehir": "City",
  "Ekip Büyüklüğü": "Team Size",
  "Girişim Aşaması": "Startup Stage",
  "Fikir": "Idea",
  "Prototip": "Prototype",
  "İlk müşteriler": "First customers",
  "Gelir elde ediyor": "Generating revenue",
  "Hangi problemi çözüyorsunuz?": "What problem are you solving?",
  "Çözümünüz nedir?": "What is your solution?",
  "Başvuruyu Tamamla →": "Submit Application →",
  "Dashboard": "Dashboard",
  "Başvurular": "Applications",
  "Girişimler": "Startups",
  "Girişimciler": "Entrepreneurs",
  "Değerlendiriciler": "Evaluators",
  "Mentorlar": "Mentors",
  "Eğitimler": "Trainings",
  "Etkinlikler": "Events",
  "Görevler": "Tasks",
  "Dokümanlar": "Documents",
  "Bildirimler": "Notifications",
  "Raporlar": "Reports",
  "Landing Page Yönetimi": "Landing Page Management",
  "Sistem Ayarları": "System Settings",
  "Süper Admin": "Super Admin",
  "Program Yetkilisi": "Program Officer",
  "Değerlendirme Yetkilisi": "Evaluation Officer",
  "Mentor": "Mentor",
  "Admin ve Program Yönetim Paneli": "Admin and Program Management Panel",
  "Güvenli Giriş": "Secure Login",
  "Yönetici hesabı": "Admin account",
  "Şifre": "Password",
  "Giriş Yap": "Log In",
  "Çıkış": "Log Out",
  "Program Paneli": "Program Panel",
  "Lidea Merkezi Yönetim": "Lidea Central Management",
  "Başvuru": "Application",
  "Ön Değerlendirmede": "In Pre-Evaluation",
  "Programa Kabul": "Accepted to Program",
  "Aktif Mentor": "Active Mentors",
  "Aktif Girişim": "Active Startups",
  "Başvuru Yönetimi": "Application Management",
  "Operasyon Dashboard": "Operations Dashboard",
  "3. DÖNEM / GENEL BAKIŞ": "COHORT 3 / OVERVIEW",
  "Toplam Başvuru": "Total Applications",
  "İncelemede": "Under Review",
  "Admin aksiyonu bekliyor": "Waiting for admin action",
  "Jüri Değerlendirmesinde": "In Jury Evaluation",
  "Jüriye gönderildi": "Sent to jury",
  "Kabul Edildi": "Accepted",
  "Programa seçildi": "Selected for program",
  "Son Başvurular": "Recent Applications",
  "Kurucu": "Founder",
  "İşlem": "Action",
  "İncele →": "Review →",
  "Tüm Başvuruları Gör →": "View All Applications →",
  "Hızlı İşlemler": "Quick Actions",
  "Yeni Başvuru": "New Application",
  "Başvuruları İncele": "Review Applications",
  "Jüriye Ata": "Assign to Jury",
  "Program Takvimini Yönet": "Manage Program Calendar",
  "Program Yönetimi": "Program Management",
  "PROGRAM YÖNETİMİ": "PROGRAM MANAGEMENT",
  "Program Bilgileri": "Program Information",
  "Program Adı": "Program Name",
  "Kısa Açıklama": "Short Description",
  "Kontenjan": "Quota",
  "Program Durumu": "Program Status",
  "Başlangıç Tarihi": "Start Date",
  "Bitiş Tarihi": "End Date",
  "Taslak": "Draft",
  "Başvurular Açık": "Applications Open",
  "Başvurular Kapandı": "Applications Closed",
  "Başvurular Kapalı": "Applications Closed",
  "Değerlendirme": "Evaluation",
  "Program Aktif": "Program Active",
  "Tamamlandı": "Completed",
  "Düzenle": "Edit",
  "Bilgileri Düzenle": "Edit Information",
  "Genel": "General",
  "Takvim": "Calendar",
  "Başvuru Ayarları": "Application Settings",
  "Aşamalar": "Stages",
  "Değişiklikleri Kaydet": "Save Changes",
  "Takvimi Kaydet": "Save Calendar",
  "+ Aşama Ekle": "+ Add Stage",
  "Başvurunun Açılması": "Applications Opening",
  "Başvuruların Açılması": "Applications Opening",
  "Sonuçların Açıklanması": "Results Announcement",
  "Program Başlangıcı": "Program Start",
  "Tarih girilmedi": "No date entered",
  "Tarih belirlenmedi": "Date not set",
  "Başvuru Limiti": "Application Limit",
  "Sınırsız": "Unlimited",
  "Başvurabilecek Aşamalar": "Eligible Startup Stages",
  "İlk Müşteri": "First Customer",
  "Gelir Elde Ediyor": "Generating Revenue",
  "Zorunlu Pitch Deck": "Required Pitch Deck",
  "Evet": "Yes",
  "Hayır": "No",
  "KVKK Onayı": "KVKK Consent",
  "Zorunlu": "Required",
  "Ayarları Kaydet": "Save Settings",
  "Program Aşamaları": "Program Stages",
  "Aktif Aşama": "Active Stages",
  "Aşamaları Kaydet": "Save Stages",
  "+ Yeni Aşama Ekle": "+ Add New Stage",
  "Başvurular sona erdi.": "Applications have ended.",
  "Yeni başvuru alımı şu anda kapalı.": "New applications are currently closed.",
  "Beklemede": "Waiting",
  "Aktif": "Active",
  "Son Başvuru": "Application Deadline",
  "Henüz planlanmadı": "Not planned yet",
  "Son Aktiviteler": "Recent Activities",
  "Henüz aktivite yok.": "No activity yet.",
  "Filtreye uygun canlı başvuru bulunamadı.": "No live application matches the filter.",
  "Dönem": "Cohort",
  "Sektör": "Sector",
  "Belirtilmedi": "Not specified",
  "Girişim aşaması": "Startup stage",
  "Aşama": "Stage",
  "Ekip": "Team",
  "Puan": "Score",
  "Durum": "Status",
  "Yeni": "New",
  "İnceleniyor": "Under Review",
  "Jüriye Gönderildi": "Sent to Jury",
  "Kabul": "Accepted",
  "Yedek": "Waitlist",
  "Reddedildi": "Rejected",
  "Durum Akışı": "Status Flow",
  "Şifre Değiştir": "Change Password",
  "Mevcut şifre": "Current password",
  "Yeni şifre": "New password",
  "Güncelle": "Update",
  "Yetkili Tanımla": "Add Authorized User",
  "İsim": "Name",
  "Geçici şifre": "Temporary password",
  "Yetkili Ekle": "Add User",
  "Girişimci Duyurusu": "Entrepreneur Announcement",
  "Girişimci seç": "Select entrepreneur",
  "Duyuru başlığı": "Announcement title",
  "Duyuru mesajı": "Announcement message",
  "Duyuru Gönder": "Send Announcement",
  "Girişimci Paneli": "Entrepreneur Portal",
  "Yetkili Giriş": "Authorized Login",
  "Tanımlı girişimci hesabı": "Registered entrepreneur account",
  "Program İlerlemesi": "Program Progress",
  "Program ilerleme yüzdesi": "Program progress percentage",
  "Sıfırla": "Reset",
  "Başvurum": "My Application",
  "Girişimim": "My Startup",
  "Programım": "My Program",
  "Mentorluk": "Mentorship",
  "Pitch Deck": "Pitch Deck",
  "Profil": "Profile",
  "Profili Kaydet": "Save Profile",
  "Başvuru Durumu": "Application Status",
  "Eksik Belgeler": "Missing Documents",
  "Bekliyor": "Pending",
  "Devam ediyor": "In Progress",
  "Henüz duyuru yok.": "No announcements yet.",
  "Jüri ve Değerlendirici Paneli": "Jury and Evaluator Panel",
  "Değerlendirici Girişi": "Evaluator Login",
  "Tanımlı yetkili hesabı": "Registered authorized account",
  "Jüri / Değerlendirici Paneli": "Jury / Evaluator Panel",
  "Atanan Girişim Değerlendirmeleri": "Assigned Startup Evaluations",
  "Toplam": "Total",
  "Problem": "Problem",
  "Çözüm": "Solution",
  "Yenilikçilik": "Innovation",
  "Pazar Potansiyeli": "Market Potential",
  "Ölçeklenebilirlik": "Scalability",
  "Değerlendirici Yorumu": "Evaluator Comment",
  "Öneri": "Recommendation",
  "Kabul Öner": "Recommend Accept",
  "Yedek Öner": "Recommend Waitlist",
  "Ret Öner": "Recommend Reject",
  "Kayıt durumu": "Save status",
  "Atanmış girişim bulunamadı": "No assigned startup found",
};

const reverseDictionary = Object.fromEntries(
  Object.entries(dictionary).map(([tr, en]) => [en, tr]),
) as Record<string, string>;

function translateValue(value: string, language: Language) {
  const trimmed = value.trim();
  if (!trimmed) return value;

  const next = language === "en" ? dictionary[trimmed] : reverseDictionary[trimmed];
  if (!next) return value;

  return value.replace(trimmed, next);
}

function translatePage(language: Language) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node = walker.nextNode();

  while (node) {
    const parent = node.parentElement;
    if (parent && !["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) {
      nodes.push(node as Text);
    }
    node = walker.nextNode();
  }

  nodes.forEach((textNode) => {
    textNode.nodeValue = translateValue(textNode.nodeValue || "", language);
  });

  document.querySelectorAll<HTMLElement>("input, textarea, img, button, a").forEach((element) => {
    ["placeholder", "alt", "aria-label", "title"].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (value) element.setAttribute(attribute, translateValue(value, language));
    });
  });

  document.documentElement.lang = language;
}

export default function LanguageSwitch() {
  const [language, setLanguage] = useState<Language>("tr");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(languageKey) as Language | null;
    const initialLanguage = savedLanguage === "en" ? "en" : "tr";
    setLanguage(initialLanguage);
    translatePage(initialLanguage);
  }, []);

  useEffect(() => {
    let translating = false;
    const observer = new MutationObserver(() => {
      if (translating) return;
      translating = true;
      window.requestAnimationFrame(() => {
        translatePage(language);
        translating = false;
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "alt", "aria-label", "title"],
    });

    translatePage(language);
    return () => observer.disconnect();
  }, [language]);

  function chooseLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    window.localStorage.setItem(languageKey, nextLanguage);
    window.setTimeout(() => translatePage(nextLanguage), 0);
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,.16)]">
      <button
        type="button"
        onClick={() => chooseLanguage("tr")}
        className={`h-10 px-4 text-sm font-black ${
          language === "tr" ? "bg-[#063f46] text-white" : "text-slate-600"
        }`}
        aria-label="Türkçe"
      >
        TR
      </button>
      <button
        type="button"
        onClick={() => chooseLanguage("en")}
        className={`h-10 px-4 text-sm font-black ${
          language === "en" ? "bg-[#063f46] text-white" : "text-slate-600"
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
