export type SystemSettings = {
  platformName: string;
  shortName: string;
  supportEmail: string;
  timezone: string;
  language: "Türkçe" | "English";
  logo: string;
  favicon: string;
  sessionMinutes: number;
  failedLoginLimit: number;
  strongPasswordRequired: boolean;
  adminTwoFactorRequired: boolean;
  uploadLimitMb: number;
  allowedFiles: string[];
  notificationToggles: Record<string, boolean>;
  emailEnabled: boolean;
  updatedAt: string;
};

export type AdminUserRecord = {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: string;
  status?: string;
  createdAt?: string;
};

export const settingsStorageKey = "lidea-system-settings";
export const adminUsersStorageKey = "lidea-admin-users";

export const defaultSystemSettings: SystemSettings = {
  platformName: "Lidea Girişim Programı",
  shortName: "LIDEA",
  supportEmail: "destek@lideagirisim.com",
  timezone: "Europe/Istanbul",
  language: "Türkçe",
  logo: "",
  favicon: "",
  sessionMinutes: 60,
  failedLoginLimit: 5,
  strongPasswordRequired: true,
  adminTwoFactorRequired: true,
  uploadLimitMb: 10,
  allowedFiles: ["PDF", "PPTX", "DOCX", "PNG", "JPG"],
  notificationToggles: {
    "Başvuru Alındı": true,
    "Eksik Belge": true,
    "Değerlendirme Ataması": true,
    "Programa Kabul": true,
    "Mentor Ataması": true,
    "Mentor Görüşmesi": true,
    "Jüri Oturumu": true,
    "Demo Day": true,
  },
  emailEnabled: true,
  updatedAt: "",
};

export const rolePermissions: Record<string, string[]> = {
  "Süper Admin": [
    "Tüm programları yönet",
    "Başvuruları yönet",
    "Kullanıcı yönet",
    "Roller ve yetkiler",
    "Raporlar",
    "Sistem ayarları",
    "Nihai karar",
  ],
  "Program Yetkilisi": [
    "Kendi programını yönet",
    "Başvuruları yönet",
    "Girişimleri yönet",
    "Değerlendirici ata",
    "Mentor ata",
    "Bildirim gönder",
    "Rapor görüntüle",
  ],
  "Değerlendirme Yetkilisi": ["Atanan başvurular", "Puanlama", "Değerlendirme notu", "Karar önerisi"],
  Mentor: ["Atanan girişimler", "Görüşmeler", "Mentor notları", "Aksiyonlar"],
  Jüri: ["Atanan jüri oturumu", "Atanan girişimler", "Pitch Deck", "Final puanlama", "Jüri notu"],
  Girişimci: ["Kendi girişimi", "Kendi başvurusu", "Program süreci", "Belgeler", "Mentorluk", "Bildirimler"],
};

export function readSystemSettings() {
  if (typeof window === "undefined") return defaultSystemSettings;
  const saved = window.localStorage.getItem(settingsStorageKey);
  if (!saved) {
    const settings = { ...defaultSystemSettings, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    return settings;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<SystemSettings>;
    return {
      ...defaultSystemSettings,
      ...parsed,
      notificationToggles: {
        ...defaultSystemSettings.notificationToggles,
        ...(parsed.notificationToggles || {}),
      },
      allowedFiles: Array.isArray(parsed.allowedFiles) ? parsed.allowedFiles : defaultSystemSettings.allowedFiles,
    };
  } catch {
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(defaultSystemSettings));
    return defaultSystemSettings;
  }
}

export function writeSystemSettings(settings: SystemSettings) {
  window.localStorage.setItem(
    settingsStorageKey,
    JSON.stringify({ ...settings, updatedAt: new Date().toISOString() }),
  );
  window.dispatchEvent(new Event("lidea-settings-updated"));
}

export function readAdminUsers() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(adminUsersStorageKey);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as AdminUserRecord[];
  } catch {
    return [];
  }
}

export function writeAdminUsers(users: AdminUserRecord[]) {
  window.localStorage.setItem(adminUsersStorageKey, JSON.stringify(users));
  window.dispatchEvent(new Event("lidea-admin-users-updated"));
}
