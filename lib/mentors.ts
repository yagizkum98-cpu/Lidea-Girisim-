import { Startup, readStartups, saveStartup } from "@/lib/startups";

export type MentorStatus = "Aktif" | "Pasif";
export type MeetingStatus = "Planlandı" | "Tamamlandı" | "İptal" | "Katılmadı";
export type MeetingType = "Online" | "Yüz Yüze";

export type Mentor = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  institution: string;
  title: string;
  linkedin: string;
  expertise: string[];
  bio: string;
  status: MentorStatus;
  assignmentLimit: number;
  createdAt: string;
  updatedAt: string;
};

export type MentorMeeting = {
  id: string;
  mentorId: string;
  mentorEmail: string;
  mentorName: string;
  startupId: string;
  startupName: string;
  date: string;
  time: string;
  duration: string;
  type: MeetingType;
  link: string;
  topic: string;
  status: MeetingStatus;
  note: string;
  nextActions: string;
  createdAt: string;
  updatedAt: string;
};

export type MentorActionStatus = "Yapılacak" | "Gönderildi" | "Revizyon İstendi" | "Tamamlandı";

export type MentorAction = {
  id: string;
  mentorId: string;
  mentorName: string;
  meetingId: string;
  startupId: string;
  startupName: string;
  title: string;
  description: string;
  deadline: string;
  status: MentorActionStatus;
  submissionNote: string;
  submissionFileName: string;
  feedback: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
  createdAt: string;
};

export const mentorsStorageKey = "lidea-mentors";
export const mentorMeetingsStorageKey = "lidea-mentor-meetings";
export const mentorActionsStorageKey = "lidea-mentor-actions";
export const adminUsersStorageKey = "lidea-admin-users";

export const mentorStatuses: MentorStatus[] = ["Aktif", "Pasif"];
export const meetingStatuses: MeetingStatus[] = ["Planlandı", "Tamamlandı", "İptal", "Katılmadı"];
export const mentorActionStatuses: MentorActionStatus[] = [
  "Yapılacak",
  "Gönderildi",
  "Revizyon İstendi",
  "Tamamlandı",
];

export const mentorExpertiseOptions = [
  "İş Modeli",
  "Girişimcilik",
  "Ürün Geliştirme",
  "Yazılım / Teknoloji",
  "Yapay Zeka",
  "Pazarlama",
  "Growth",
  "Satış",
  "Finans",
  "Yatırım",
  "Hukuk",
  "Marka",
  "Uluslararasılaşma",
];

export function normalizeMentor(raw: Partial<Mentor> & Record<string, unknown>) {
  const expertise = Array.isArray(raw.expertise)
    ? (raw.expertise as string[]).filter(Boolean)
    : String(raw.expertise || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return {
    id: String(raw.id || `MN-${Date.now().toString().slice(-6)}`),
    name: String(raw.name || ""),
    email: String(raw.email || "").toLowerCase(),
    password: String(raw.password || ""),
    phone: String(raw.phone || ""),
    institution: String(raw.institution || ""),
    title: String(raw.title || ""),
    linkedin: String(raw.linkedin || ""),
    expertise,
    bio: String(raw.bio || ""),
    status: (raw.status || "Aktif") as MentorStatus,
    assignmentLimit: Number(raw.assignmentLimit || 4),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
  } satisfies Mentor;
}

export function normalizeMentorMeeting(raw: Partial<MentorMeeting> & Record<string, unknown>) {
  return {
    id: String(raw.id || crypto.randomUUID()),
    mentorId: String(raw.mentorId || ""),
    mentorEmail: String(raw.mentorEmail || "").toLowerCase(),
    mentorName: String(raw.mentorName || ""),
    startupId: String(raw.startupId || ""),
    startupName: String(raw.startupName || ""),
    date: String(raw.date || new Date().toISOString().slice(0, 10)),
    time: String(raw.time || "10:00"),
    duration: String(raw.duration || "60 dakika"),
    type: (raw.type || "Online") as MeetingType,
    link: String(raw.link || ""),
    topic: String(raw.topic || ""),
    status: (raw.status || "Planlandı") as MeetingStatus,
    note: String(raw.note || ""),
    nextActions: String(raw.nextActions || ""),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
  } satisfies MentorMeeting;
}

export function normalizeMentorAction(raw: Partial<MentorAction> & Record<string, unknown>) {
  return {
    id: String(raw.id || crypto.randomUUID()),
    mentorId: String(raw.mentorId || ""),
    mentorName: String(raw.mentorName || ""),
    meetingId: String(raw.meetingId || ""),
    startupId: String(raw.startupId || ""),
    startupName: String(raw.startupName || ""),
    title: String(raw.title || ""),
    description: String(raw.description || ""),
    deadline: String(raw.deadline || ""),
    status: (raw.status || "Yapılacak") as MentorActionStatus,
    submissionNote: String(raw.submissionNote || ""),
    submissionFileName: String(raw.submissionFileName || ""),
    feedback: String(raw.feedback || ""),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
    completedAt: String(raw.completedAt || ""),
  } satisfies MentorAction;
}

export function readMentors() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(mentorsStorageKey);
  if (!saved) {
    window.localStorage.setItem(mentorsStorageKey, JSON.stringify([]));
    return [];
  }

  try {
    const mentors = (JSON.parse(saved) as Record<string, unknown>[]).map(normalizeMentor);
    window.localStorage.setItem(mentorsStorageKey, JSON.stringify(mentors));
    return mentors;
  } catch {
    window.localStorage.setItem(mentorsStorageKey, JSON.stringify([]));
    return [];
  }
}

export function writeMentors(mentors: Mentor[]) {
  window.localStorage.setItem(mentorsStorageKey, JSON.stringify(mentors));
  window.dispatchEvent(new Event("lidea-mentors-updated"));
}

export function saveMentor(mentor: Mentor) {
  const mentors = readMentors();
  const exists = mentors.some((item) => item.id === mentor.id);
  writeMentors(exists ? mentors.map((item) => (item.id === mentor.id ? mentor : item)) : [mentor, ...mentors]);
}

export function readMentorMeetings() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(mentorMeetingsStorageKey);
  if (!saved) {
    window.localStorage.setItem(mentorMeetingsStorageKey, JSON.stringify([]));
    return [];
  }

  try {
    const meetings = (JSON.parse(saved) as Record<string, unknown>[]).map(normalizeMentorMeeting);
    window.localStorage.setItem(mentorMeetingsStorageKey, JSON.stringify(meetings));
    return meetings;
  } catch {
    window.localStorage.setItem(mentorMeetingsStorageKey, JSON.stringify([]));
    return [];
  }
}

export function writeMentorMeetings(meetings: MentorMeeting[]) {
  window.localStorage.setItem(mentorMeetingsStorageKey, JSON.stringify(meetings));
  window.dispatchEvent(new Event("lidea-mentor-meetings-updated"));
}

export function saveMentorMeeting(meeting: MentorMeeting) {
  const meetings = readMentorMeetings();
  const exists = meetings.some((item) => item.id === meeting.id);
  writeMentorMeetings(exists ? meetings.map((item) => (item.id === meeting.id ? meeting : item)) : [meeting, ...meetings]);
}

export function readMentorActions() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(mentorActionsStorageKey);
  if (!saved) {
    window.localStorage.setItem(mentorActionsStorageKey, JSON.stringify([]));
    return [];
  }

  try {
    const actions = (JSON.parse(saved) as Record<string, unknown>[]).map(normalizeMentorAction);
    window.localStorage.setItem(mentorActionsStorageKey, JSON.stringify(actions));
    return actions;
  } catch {
    window.localStorage.setItem(mentorActionsStorageKey, JSON.stringify([]));
    return [];
  }
}

export function writeMentorActions(actions: MentorAction[]) {
  window.localStorage.setItem(mentorActionsStorageKey, JSON.stringify(actions));
  window.dispatchEvent(new Event("lidea-mentor-actions-updated"));
}

export function saveMentorAction(action: MentorAction) {
  const actions = readMentorActions();
  const exists = actions.some((item) => item.id === action.id);
  writeMentorActions(exists ? actions.map((item) => (item.id === action.id ? action : item)) : [action, ...actions]);
}

export function getMentorActionsForStartup(startup: Startup | null) {
  if (!startup) return [];
  return readMentorActions().filter((action) => action.startupId === startup.id);
}

export function getMentoringMetrics(startup: Startup | null, meetings: MentorMeeting[], actions: MentorAction[]) {
  const targetMeetings = startup?.mentor?.targetMeetingCount || 0;
  const completedMeetings = meetings.filter((meeting) => meeting.status === "Tamamlandı").length;
  const completedActions = actions.filter((action) => action.status === "Tamamlandı").length;
  const openActions = actions.filter((action) => action.status !== "Tamamlandı").length;
  const overdueActions = actions.filter((action) => {
    if (!action.deadline || action.status === "Tamamlandı") return false;
    return new Date(`${action.deadline}T23:59:59`) < new Date();
  });

  return {
    targetMeetings,
    completedMeetings,
    plannedMeetings: meetings.filter((meeting) => meeting.status === "Planlandı").length,
    meetingPercent: targetMeetings ? Math.min(100, Math.round((completedMeetings / targetMeetings) * 100)) : 0,
    totalActions: actions.length,
    completedActions,
    openActions,
    overdueActions,
    actionPercent: actions.length ? Math.round((completedActions / actions.length) * 100) : 0,
  };
}

export function syncMentorUser(mentor: Mentor) {
  const saved = window.localStorage.getItem(adminUsersStorageKey);
  let users: AdminUser[] = [];

  try {
    users = saved ? (JSON.parse(saved) as AdminUser[]) : [];
  } catch {
    users = [];
  }

  const exists = users.some((user) => user.email.toLowerCase() === mentor.email.toLowerCase());
  const nextUser: AdminUser = {
    id: mentor.id,
    name: mentor.name,
    email: mentor.email,
    password: mentor.password,
    role: "Mentor",
    status: mentor.status,
    createdAt: mentor.createdAt,
  };
  const nextUsers = exists
    ? users.map((user) =>
        user.email.toLowerCase() === mentor.email.toLowerCase()
          ? { ...user, name: mentor.name, password: mentor.password || user.password, role: "Mentor", status: mentor.status }
          : user,
      )
    : [nextUser, ...users];

  window.localStorage.setItem(adminUsersStorageKey, JSON.stringify(nextUsers));
  window.dispatchEvent(new Event("lidea-admin-users-updated"));
}

export function getMentorStartups(mentor: Mentor) {
  return readStartups().filter(
    (startup) =>
      startup.mentor?.mentorId === mentor.id ||
      startup.mentor?.mentorEmail === mentor.email ||
      startup.mentor?.mentorName === mentor.name,
  );
}

export function assignStartupsToMentor(
  mentor: Mentor,
  startupIds: string[],
  expertise: string,
  startDate: string,
  targetMeetingCount: number,
) {
  readStartups()
    .filter((startup) => startupIds.includes(startup.id))
    .forEach((startup: Startup) => {
      saveStartup({
        ...startup,
        mentor: {
          mentorId: mentor.id,
          mentorEmail: mentor.email,
          mentorName: mentor.name,
          expertise,
          assignmentType: "Ana Mentor",
          startDate,
          targetMeetingCount,
          meetingCount: startup.mentor?.meetingCount || 0,
          lastMeeting: startup.mentor?.lastMeeting || "",
        },
        updatedAt: new Date().toISOString(),
      });
    });

  window.dispatchEvent(new Event("lidea-startups-updated"));
}
