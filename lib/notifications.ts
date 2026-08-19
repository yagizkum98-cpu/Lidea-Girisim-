import { readApplications } from "@/lib/applications";
import { readEvaluators } from "@/lib/evaluators";
import { readMentors } from "@/lib/mentors";
import { syncAcceptedApplicationsToStartups } from "@/lib/startups";

export type NotificationStatus = "Taslak" | "Gönderildi" | "Planlandı" | "Başarısız";
export type NotificationType = "Duyuru" | "Hatırlatma" | "Durum Güncellemesi" | "Belge / Görev" | "Etkinlik";
export type NotificationAudience =
  | "Tüm Kullanıcılar"
  | "Girişimciler"
  | "Değerlendiriciler"
  | "Mentorlar"
  | "Jüri Üyeleri"
  | "Özel Kullanıcılar";
export type NotificationChannel = "Platform İçi" | "E-posta";

export type NotificationRecipient = {
  name: string;
  email: string;
  role: string;
  sourceId?: string;
  read: boolean;
  readAt: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  audience: NotificationAudience;
  audienceFilter: string;
  program: string;
  channels: NotificationChannel[];
  status: NotificationStatus;
  scheduledDate: string;
  scheduledTime: string;
  sentAt: string;
  recipients: NotificationRecipient[];
  createdAt: string;
  updatedAt: string;
};

export type NotificationTemplate = {
  id: string;
  title: string;
  type: NotificationType;
  message: string;
  updatedAt: string;
};

type AdminUser = {
  id?: string;
  name: string;
  email: string;
  role: string;
  status?: string;
};

export const notificationsStorageKey = "lidea-notifications";
export const notificationTemplatesStorageKey = "lidea-notification-templates";
export const adminUsersStorageKey = "lidea-admin-users";
export const legacyAnnouncementsStorageKey = "lidea-announcements";

export const notificationStatuses: NotificationStatus[] = [
  "Gönderildi",
  "Planlandı",
  "Taslak",
  "Başarısız",
];

export const notificationTypes: NotificationType[] = [
  "Duyuru",
  "Hatırlatma",
  "Durum Güncellemesi",
  "Belge / Görev",
  "Etkinlik",
];

export const notificationAudiences: NotificationAudience[] = [
  "Tüm Kullanıcılar",
  "Girişimciler",
  "Değerlendiriciler",
  "Mentorlar",
  "Jüri Üyeleri",
  "Özel Kullanıcılar",
];

export const defaultNotificationTemplates: NotificationTemplate[] = [
  {
    id: "application-received",
    title: "Başvuru Alındı",
    type: "Durum Güncellemesi",
    message: "Merhaba {{name}}, {{startupName}} başvurunuz alınmıştır.",
    updatedAt: "",
  },
  {
    id: "missing-info",
    title: "Eksik Bilgi Talebi",
    type: "Belge / Görev",
    message: "Merhaba {{name}}, başvurunuz için ek bilgi gerekiyor.",
    updatedAt: "",
  },
  {
    id: "accepted",
    title: "Programa Kabul",
    type: "Durum Güncellemesi",
    message: "Merhaba {{name}}, Lidea Girişim Programı 3. Dönem'e kabul edildiniz.",
    updatedAt: "",
  },
  {
    id: "mentor-assigned",
    title: "Mentor Atandı",
    type: "Hatırlatma",
    message: "Merhaba {{name}}, yeni mentorunuz atanmıştır.",
    updatedAt: "",
  },
  {
    id: "demo-day",
    title: "Demo Day",
    type: "Etkinlik",
    message: "Demo Day sunum takvimi güncellendi.",
    updatedAt: "",
  },
];

function uniqueRecipients(recipients: NotificationRecipient[]) {
  const map = new Map<string, NotificationRecipient>();
  recipients.forEach((recipient) => {
    if (recipient.email) map.set(recipient.email.toLowerCase(), recipient);
  });
  return Array.from(map.values());
}

export function normalizeNotification(raw: Partial<Notification> & Record<string, unknown>) {
  return {
    id: String(raw.id || crypto.randomUUID()),
    title: String(raw.title || ""),
    message: String(raw.message || ""),
    type: (raw.type || "Duyuru") as NotificationType,
    audience: (raw.audience || "Girişimciler") as NotificationAudience,
    audienceFilter: String(raw.audienceFilter || ""),
    program: String(raw.program || "Lidea Girişim Programı / 3. Dönem"),
    channels: Array.isArray(raw.channels) ? (raw.channels as NotificationChannel[]) : ["Platform İçi"],
    status: (raw.status || "Taslak") as NotificationStatus,
    scheduledDate: String(raw.scheduledDate || ""),
    scheduledTime: String(raw.scheduledTime || ""),
    sentAt: String(raw.sentAt || ""),
    recipients: Array.isArray(raw.recipients)
      ? (raw.recipients as NotificationRecipient[]).map((recipient) => ({
          ...recipient,
          read: Boolean(recipient.read),
          readAt: recipient.readAt || "",
        }))
      : [],
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
  } satisfies Notification;
}

export function readNotifications() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(notificationsStorageKey);
  if (!saved) {
    window.localStorage.setItem(notificationsStorageKey, JSON.stringify([]));
    return [];
  }

  try {
    const notifications = (JSON.parse(saved) as Record<string, unknown>[]).map(normalizeNotification);
    window.localStorage.setItem(notificationsStorageKey, JSON.stringify(notifications));
    return notifications;
  } catch {
    window.localStorage.setItem(notificationsStorageKey, JSON.stringify([]));
    return [];
  }
}

export function writeNotifications(notifications: Notification[]) {
  window.localStorage.setItem(notificationsStorageKey, JSON.stringify(notifications));
  window.dispatchEvent(new Event("lidea-notifications-updated"));
}

export function saveNotification(notification: Notification) {
  const notifications = readNotifications();
  const exists = notifications.some((item) => item.id === notification.id);
  writeNotifications(
    exists
      ? notifications.map((item) => (item.id === notification.id ? notification : item))
      : [notification, ...notifications],
  );
}

export function readNotificationTemplates() {
  if (typeof window === "undefined") return defaultNotificationTemplates;
  const saved = window.localStorage.getItem(notificationTemplatesStorageKey);
  if (!saved) {
    const templates = defaultNotificationTemplates.map((template) => ({
      ...template,
      updatedAt: new Date().toISOString(),
    }));
    window.localStorage.setItem(notificationTemplatesStorageKey, JSON.stringify(templates));
    return templates;
  }

  try {
    return JSON.parse(saved) as NotificationTemplate[];
  } catch {
    window.localStorage.setItem(notificationTemplatesStorageKey, JSON.stringify(defaultNotificationTemplates));
    return defaultNotificationTemplates;
  }
}

export function readAdminUsers() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(adminUsersStorageKey);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as AdminUser[];
  } catch {
    return [];
  }
}

export function resolveNotificationRecipients(
  audience: NotificationAudience,
  audienceFilter: string,
  customEmails: string[],
) {
  const users = readAdminUsers();
  const startups = syncAcceptedApplicationsToStartups();
  const applications = readApplications();
  const evaluators = readEvaluators();
  const mentors = readMentors();

  const startupRecipients = startups
    .filter((startup) => {
      if (!audienceFilter) return true;
      if (audienceFilter === "Aktif") return startup.status === "Aktif";
      if (audienceFilter === "Demo Day Hazır") return startup.status === "Demo Day Hazır";
      if (audienceFilter === "Mentorsuz") return !startup.mentor;
      if (audienceFilter === "Belgesi Eksik") return startup.documents.length === 0;
      return true;
    })
    .map((startup) => ({
      name: startup.founder || startup.name,
      email: applications.find((application) => application.id === startup.applicationId)?.email || "",
      role: "Girişimci",
      sourceId: startup.id,
      read: false,
      readAt: "",
    }))
    .filter((recipient) => recipient.email);

  const userRecipients = users.map((user) => ({
    name: user.name,
    email: user.email,
    role: user.role,
    sourceId: user.id,
    read: false,
    readAt: "",
  }));
  const entrepreneurUsers = userRecipients.filter((recipient) => recipient.role === "Girişimci");

  if (audience === "Tüm Kullanıcılar") return uniqueRecipients([...userRecipients, ...startupRecipients]);
  if (audience === "Girişimciler") return uniqueRecipients([...startupRecipients, ...entrepreneurUsers]);
  if (audience === "Değerlendiriciler" || audience === "Jüri Üyeleri") {
    return uniqueRecipients(
      evaluators
        .filter((evaluator) => evaluator.status === "Aktif")
        .map((evaluator) => ({
          name: evaluator.name,
          email: evaluator.email,
          role: "Değerlendirici",
          sourceId: evaluator.id,
          read: false,
          readAt: "",
        })),
    );
  }
  if (audience === "Mentorlar") {
    return uniqueRecipients(
      mentors
        .filter((mentor) => mentor.status === "Aktif")
        .map((mentor) => ({
          name: mentor.name,
          email: mentor.email,
          role: "Mentor",
          sourceId: mentor.id,
          read: false,
          readAt: "",
        })),
    );
  }

  return uniqueRecipients(
    customEmails.map((email) => ({
      name: email,
      email,
      role: "Özel Kullanıcı",
      read: false,
      readAt: "",
    })),
  );
}

export function readNotificationsForUser(email: string, role: string) {
  const legacy = readLegacyAnnouncements(email);
  const notifications = readNotifications().filter(
    (notification) =>
      notification.status === "Gönderildi" &&
      notification.channels.includes("Platform İçi") &&
      notification.recipients.some((recipient) => recipient.email.toLowerCase() === email.toLowerCase()) &&
      (role || true),
  );

  return [...notifications, ...legacy].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function readLegacyAnnouncements(email: string): Notification[] {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(legacyAnnouncementsStorageKey);
  if (!saved) return [];

  try {
    return (JSON.parse(saved) as { id: string; to: string; title: string; message: string; createdAt: string }[])
      .filter((announcement) => announcement.to.toLowerCase() === email.toLowerCase())
      .map((announcement) =>
        normalizeNotification({
          id: announcement.id,
          title: announcement.title,
          message: announcement.message,
          audience: "Özel Kullanıcılar",
          channels: ["Platform İçi"],
          status: "Gönderildi",
          sentAt: announcement.createdAt,
          createdAt: announcement.createdAt,
          recipients: [{ name: email, email, role: "Girişimci", read: false, readAt: "" }],
        }),
      );
  } catch {
    return [];
  }
}
