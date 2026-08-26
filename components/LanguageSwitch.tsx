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
  "Şehir": "City",
  "Ekip Büyüklüğü": "Team Size",
  "Fikir": "Idea",
  "Prototip": "Prototype",
  "İlk müşteriler": "First customers",
  "Hangi problemi çözüyorsunuz?": "What problem are you solving?",
  "Çözümünüz nedir?": "What is your solution?",
  "Başvuruyu Tamamla →": "Submit Application →",
  "Dashboard": "Dashboard",
  "Başvurular": "Applications",
  "Girişimler": "Startups",
  "Toplam Girişim": "Total Startups",
  "MVP Aşamasında": "In MVP Stage",
  "Demo Day'e Hazır": "Ready for Demo Day",
  "Girişim Ekle": "Add Startup",
  "+ Girişim Ekle": "+ Add Startup",
  "Girişim adı": "Startup name",
  "Web sitesi": "Website",
  "Girişim, kurucu veya sektör ara...": "Search startup, founder or sector...",
  "Programdan Ayrıldı": "Left Program",
  "Mezun": "Graduate",
  "Pasif": "Passive",
  "Programa Kabul:": "Accepted to Program:",
  "Notlar": "Notes",
  "Rol": "Role",
  "Unvan": "Title",
  "+ Ekip Üyesi Ekle": "+ Add Team Member",
  "Tamamlanan Aşama": "Completed Stage",
  "Demo Day Durumu": "Demo Day Status",
  "Hazır": "Ready",
  "Hazırlanıyor": "Preparing",
  "Demo Day Hazırlığı": "Demo Day Preparation",
  "Mentor seç": "Select mentor",
  "Uzmanlık alanı": "Expertise",
  "Mentor Ata": "Assign Mentor",
  "Belge türü": "Document type",
  "Dosya adı": "File name",
  "+ Belge Ekle": "+ Add Document",
  "Yeni not": "New note",
  "Not Ekle": "Add Note",
  "Bağlantı": "Connection",
  "Orijinal Başvuruyu Gör →": "View Original Application →",
  "Girişimciler": "Entrepreneurs",
  "Değerlendiriciler": "Evaluators",
  "Mentorlar": "Mentors",
  "Eğitimler": "Trainings",
  "Etkinlikler": "Events",
  "Görevler": "Tasks",
  "Dokümanlar": "Documents",
  "Bildirimler": "Notifications",
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

const extraDictionary: Record<string, string> = {
  "LIDEA, girişimcilerin fikirlerini geliştirmelerine ve işlerini büyütmelerine destek olan bir girişimcilik programıdır.": "LIDEA is an entrepreneurship program that supports entrepreneurs in developing their ideas and growing their businesses.",
  "LIDEA Girişim Programı, girişimcilere fikirlerini geliştirme, iş modellerini oluşturma ve girişimlerini büyütme süreçlerinde destek sağlar.": "The LIDEA Entrepreneurship Program supports entrepreneurs as they develop their ideas, build their business models, and grow their startups.",
  "BASINDA LIDEA": "LIDEA IN THE PRESS",
  "Basında LIDEA": "LIDEA in the Press",
  "LIDEA Girişim Programı, Fethiye'de girişimcilik ekosisteminin gelişimine yönelik çalışmaları, lansmanları ve Demo Day etkinlikleriyle ulusal ve yerel basında yer aldı.": "The LIDEA Entrepreneurship Program has appeared in national and local press through its work, launches, and Demo Day events supporting the growth of Fethiye's entrepreneurship ecosystem.",
  "Haberleri Keşfet": "Explore News",
  "Haberi Görüntüle →": "View Article →",
  "Demirören Haber Ajansı (DHA)": "Demirören News Agency (DHA)",
  "Fethiye'nin ücretsiz girişimcilik programı tanıtıldı": "Fethiye's Free Entrepreneurship Program Was Introduced",
  "Programın ilk döneminde 50'den fazla başvuru alındığı, 26 girişimin ön kuluçkaya ve 14 girişimin kuluçkaya kabul edildiği aktarıldı.": "The article reported that the program received more than 50 applications in its first cohort, with 26 startups accepted to pre-incubation and 14 to incubation.",
  "Fethiye'de LİDEA Demo Day etkinliği gerçekleşti": "LİDEA Demo Day Took Place in Fethiye",
  "LIDEA Demo Day'in girişimcileri yatırımcılar, jüri üyeleri ve ekosistem temsilcileriyle buluşturduğu aktarıldı.": "The article covered how LIDEA Demo Day brought entrepreneurs together with investors, jury members, and ecosystem representatives.",
  "eGirişim": "eGirişim",
  "Fethiye bölgesinin ilk girişimcilik programı: LİDEA": "Fethiye Region's First Entrepreneurship Program: LİDEA",
  "24 haftalık programın ardından 15 girişimin yatırımcı ve jüri karşısına çıktığı haberleştirildi.": "The article reported that 15 startups presented to investors and jury members after the 24-week program.",
  "Fethiye TV": "Fethiye TV",
  "Lidea Girişimcilik Programı'nda Demo Day heyecanı": "Demo Day Excitement at the Lidea Entrepreneurship Program",
  "15 girişimcinin projelerini yatırımcılar ve jüri önünde sunduğu Demo Day yerel basına yansıdı.": "The local press covered Demo Day, where 15 entrepreneurs presented their projects to investors and the jury.",
  "İstanbul Arel Üniversitesi - ArtıArel": "Istanbul Arel University - ArtıArel",
  "Fethiye'den yükselen yenilik dalgası": "A Wave of Innovation Rising from Fethiye",
  "LIDEA, Fethiye'den yükselen girişimcilik ve yenilik hareketi olarak ele alındı; Agritech, yapay zeka, sürdürülebilirlik, turizm ve sağlık teknolojileri alanlarındaki girişimlere dikkat çekildi.": "LIDEA was covered as an entrepreneurship and innovation movement rising from Fethiye, highlighting startups in agritech, artificial intelligence, sustainability, tourism, and health technologies.",
  "Jüri": "Jury",
  "Juri": "Jury",
  "Değerlendirme Yetkilisi": "Evaluation Officer",
  "Jüri Üyesi": "Jury Member",
  "Jüri Üyeleri": "Jury Members",
  "Ayarlar": "Settings",
  "Bildirimler": "Notifications",
  "Mentorlar": "Mentors",
  "Değerlendiriciler": "Evaluators",
  "Girişimler": "Startups",
  "Başvurular": "Applications",
  "Yeni Bildirim": "New Notification",
  "Canlı gönderim merkezi": "Live delivery center",
  "Gönderilen": "Sent",
  "Gönderimler": "Deliveries",
  "Taslaklar": "Drafts",
  "Planlanan": "Scheduled",
  "Başarısız": "Failed",
  "Okunmadı": "Unread",
  "Okundu": "Read",
  "Alıcı": "Recipient",
  "Tür": "Type",
  "Hedef": "Target",
  "Hedef filtresi": "Target filter",
  "Bildirim ara...": "Search notification...",
  "Bildirim başlığı": "Notification title",
  "Mesaj": "Message",
  "Platform İçi Bildirim": "In-platform notification",
  "E-posta": "Email",
  "Özel e-postalar, virgülle": "Custom emails, comma separated",
  "Taslak": "Draft",
  "Planla": "Schedule",
  "Gönder": "Send",
  "Duyuru": "Announcement",
  "Hatırlatma": "Reminder",
  "Durum Güncellemesi": "Status Update",
  "Belge / Görev": "Document / Task",
  "Etkinlik": "Event",
  "Tüm Kullanıcılar": "All Users",
  "Özel Kullanıcılar": "Custom Users",
  "Bildirim Şablonları": "Notification Templates",
  "Düzenle": "Edit",
  "Raporlar": "Reports",
  "Canlı veri ve dışa aktarım": "Live data and export",
  "Başvuru → Kabul Dönüşümü": "Application → Acceptance Conversion",
  "Kabul Oranı": "Acceptance Rate",
  "Başvurular CSV": "Applications CSV",
  "Girişimler CSV": "Startups CSV",
  "Mentorluk CSV": "Mentorship CSV",
  "Başvuru Durumları": "Application Statuses",
  "Sektör Dağılımı": "Sector Distribution",
  "Girişim Aşamaları": "Startup Stages",
  "Girişim Durumu": "Startup Status",
  "Değerlendirme": "Evaluation",
  "Toplam Atama": "Total Assignments",
  "Atama": "Assignment",
  "Tamamlanan": "Completed",
  "Bekleyen": "Pending",
  "Mentorluk": "Mentorship",
  "Aktif Mentor": "Active Mentor",
  "Tamamlanan Görüşme": "Completed Meeting",
  "Mentorsuz Girişim": "Startup Without Mentor",
  "Final Jüri": "Final Jury",
  "Puanlama": "Scoring",
  "Tamamlanma": "Completion",
  "Sistem, kullanıcı, rol, bildirim ve güvenlik ayarları": "System, user, role, notification and security settings",
  "Genel Ayarlar": "General Settings",
  "Kullanıcılar": "Users",
  "Roller & Yetkiler": "Roles & Permissions",
  "Bildirim": "Notification",
  "Güvenlik": "Security",
  "Platform adı": "Platform name",
  "Platform kısa adı": "Platform short name",
  "Destek e-postası": "Support email",
  "Logo URL": "Logo URL",
  "Favicon URL": "Favicon URL",
  "Değişiklikleri Kaydet": "Save Changes",
  "Kullanıcı ara...": "Search user...",
  "Kullanıcı Ekle": "Add User",
  "Ad Soyad": "Full Name",
  "Geçici şifre": "Temporary password",
  "Aktif/Pasif": "Active/Passive",
  "Bildirim Ayarları": "Notification Settings",
  "Başvuru Alındı": "Application Received",
  "Eksik Belge": "Missing Document",
  "Değerlendirme Ataması": "Evaluation Assignment",
  "Programa Kabul": "Accepted to Program",
  "Mentor Ataması": "Mentor Assignment",
  "Mentor Görüşmesi": "Mentor Meeting",
  "Jüri Oturumu": "Jury Session",
  "Sistem E-postaları": "System Emails",
  "Admin oturum süresi": "Admin session duration",
  "Başarısız giriş limiti": "Failed login limit",
  "Dosya yükleme limiti MB": "File upload limit MB",
  "Güçlü Parola Zorunluluğu": "Strong Password Required",
  "Admin 2FA": "Admin 2FA",
  "Yeni Değerlendirici": "New Evaluator",
  "Değerlendirici hesabı oluşturuldu.": "Evaluator account created.",
  "Ad, e-posta, kurum veya uzmanlık ara...": "Search name, email, institution or expertise...",
  "Atanan Başvuru": "Assigned Applications",
  "Kalan Kapasite": "Remaining Capacity",
  "Standart Değerlendirme Kriterleri": "Standard Evaluation Criteria",
  "Nihai kabul, yedek ve ret kararı admin/program yönetimi tarafından başvuru detayında verilir.": "Final acceptance, waitlist and rejection decisions are made by admin/program management in application details.",
  "Yeni Mentor": "New Mentor",
  "Mentor hesabı oluşturuldu.": "Mentor account created.",
  "Mentor, kurum veya uzmanlık ara...": "Search mentor, institution or expertise...",
  "Gerçekleşen Görüşme": "Completed Meeting",
  "Kısa biyografi": "Short biography",
  "Mentor Bilgileri": "Mentor Information",
  "Girişim Ata": "Assign Startup",
  "Görüşmeler": "Meetings",
  "Görüşme Ekle": "Add Meeting",
  "Görüşmeyi Oluştur": "Create Meeting",
  "Toplantı bağlantısı": "Meeting link",
  "Sonraki aksiyonlar": "Next actions",
  "Mentor Notları": "Mentor Notes",
  "Girişimi Gör →": "View Startup →",
  "Atamayı Gör →": "View Assignment →",
  "Başvuruları Ata": "Assign Applications",
  "Başvuru Ata": "Assign Application",
  "Görüşme": "Meeting",
  "Online": "Online",
  "Yüz Yüze": "In Person",
  "Planlandı": "Scheduled",
  "İptal": "Cancelled",
  "Katılmadı": "No Show",
  "Tüm Başvurular": "All Applications",
  "Tümü": "All",
  "Eksik Bilgi": "Missing Info",
  "Jüride": "In Jury",
  "En Yeni": "Newest",
  "En Eski": "Oldest",
  "En Yüksek Jüri Puanı": "Highest Jury Score",
  "Durum Değiştir": "Change Status",
  "Seç": "Select",
  "Ara: Girişim / Kurucu / E-posta...": "Search: Startup / Founder / Email...",
  "Henüz canlı bildirim yok. Yeni bildirim oluşturunca sayaçlar güncellenir.": "No live notifications yet. Counters update when a notification is created.",
  "Henüz canlı mentor yok. Mentor ekleyince sayaçlar ve atama listesi güncellenir.": "No live mentors yet. Counters and assignment list update when a mentor is added.",
  "Henüz canlı değerlendirici yok. Yeni değerlendirici ekleyince sayaçlar ve atama listesi güncellenir.": "No live evaluators yet. Counters and assignment list update when an evaluator is added.",
  "LideaCheck": "LideaCheck",
  "LideaCheck →": "LideaCheck →",
  "LIDEACHECK DUYURULARI": "LIDEACHECK ANNOUNCEMENTS",
  "Demo Day son aşama listesi": "Demo Day final-stage list",
  "Bu alan LideaCheck panelinde verilen canlı kararlarla otomatik güncellenir.": "This area updates automatically with live decisions made in the LideaCheck panel.",
  "Demo Day final listesinde yer almaya devam ediyor.": "Continues to remain on the Demo Day final list.",
  "Demo Day final listesine alınmadı. Stant açabilirsiniz.": "Not included in the Demo Day final list. You may open a booth.",
  "Demo Day son aşama değerlendirme listesinde aday olarak yer alıyor.": "Listed as a candidate in the Demo Day final-stage evaluation.",
  "Akıllı Yoklama Paneli": "Smart Attendance Panel",
  "Süper Admin ve ayarlardan tanımlanan Yoklama Yetkilisi dışında giriş kapalıdır.": "Access is limited to Super Admin and the Attendance Officer defined in settings.",
  "Bu panele sadece Süper Admin veya tanımlı Yoklama Yetkilisi giriş yapabilir.": "Only Super Admin or a defined Attendance Officer can access this panel.",
  "Panele Gir": "Enter Panel",
  "Yoklama Yetkilisi": "Attendance Officer",
  "LideaCheck paneline giriş": "Access LideaCheck panel",
  "Haftalık yoklama oluştur": "Create weekly attendance",
  "Geldi/Gelmedi işaretle": "Mark Present/Absent",
  "Kota takibi": "Quota tracking",
  "Demo Day aday listesi": "Demo Day candidate list",
  "Demo Day duyurusu": "Demo Day announcement",
  "Toplam Yoklama": "Total Attendance",
  "Geldi": "Present",
  "Gelmedi": "Absent",
  "Kota": "Quota",
  "Haftalık Manuel Yoklama": "Weekly Manual Attendance",
  "Girişim seç": "Select startup",
  "Ön Kuluçka": "Pre-Incubation",
  "Kuluçka": "Incubation",
  "Hafta": "Week",
  "Yoklama Kaydet": "Save Attendance",
  "Yoklama için önce bir girişim seçin.": "Select a startup before saving attendance.",
  "Yoklama kaydı eklendi. Sayılar otomatik güncellendi.": "Attendance record added. Numbers updated automatically.",
  "Demo Day Adayı Ekle": "Add Demo Day Candidate",
  "Son hafta": "Final week",
  "Adaylık notu": "Candidate note",
  "Son Aşama Listesine Ekle": "Add to Final-Stage List",
  "Demo Day adayı için girişim seçin.": "Select a startup for the Demo Day candidate.",
  "Girişim Demo Day son aşama aday listesine eklendi.": "Startup added to the Demo Day final-stage candidate list.",
  "Kayıt": "Record",
  "Oran": "Rate",
  "Canlı Yoklama Kayıtları": "Live Attendance Records",
  "Henüz yoklama kaydı yok. Sistem sıfırdan başlar.": "No attendance record yet. The system starts from zero.",
  "Demo Day Son Aşama Listesi": "Demo Day Final-Stage List",
  "Aday": "Candidate",
  "Onaylandı": "Approved",
  "Reddedildi": "Rejected",
  "Onayla": "Approve",
  "Reddet": "Reject",
  "Girişim Demo Day listesinde onaylandı.": "Startup approved on the Demo Day list.",
  "Girişim reddedilenler tarafına alındı ve stant mesajı oluşturuldu.": "Startup moved to rejected and the booth message was created.",
  "Henüz Demo Day adayı yok.": "No Demo Day candidate yet.",
  "Reddedilenler": "Rejected",
  "Reddedilen girişim yok.": "No rejected startup.",
  "Ana sayfa": "Home",
  "Girişim": "Startup",
  "Alan": "Track",
  "Not": "Note",
  "Tarih": "Date",
  "Durum": "Status",
  "Çıkış": "Log Out",
};

const translations = { ...dictionary, ...extraDictionary };

const reverseDictionary = Object.fromEntries(
  Object.entries(translations).map(([tr, en]) => [en, tr]),
) as Record<string, string>;

const sortedTranslations = Object.entries(translations).sort((a, b) => b[0].length - a[0].length);
const sortedReverseTranslations = Object.entries(reverseDictionary).sort((a, b) => b[0].length - a[0].length);

function translateValue(value: string, language: Language) {
  const trimmed = value.trim();
  if (!trimmed) return value;

  const exact = language === "en" ? translations[trimmed] : reverseDictionary[trimmed];
  if (exact) return value.replace(trimmed, exact);

  const entries = language === "en" ? sortedTranslations : sortedReverseTranslations;
  let translated = value;
  entries.forEach(([source, target]) => {
    if (source.length < 4 || !translated.includes(source)) return;
    translated = translated.split(source).join(target);
  });

  return translated;
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
