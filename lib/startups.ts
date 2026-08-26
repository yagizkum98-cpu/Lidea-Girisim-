import { Application, readApplications } from "@/lib/applications";

export type StartupStatus = "Aktif" | "Demo Day Hazır" | "Mezun" | "Pasif" | "Programdan Ayrıldı";

export type StartupMember = {
  id: string;
  name: string;
  role: string;
  title: string;
  active: boolean;
};

export type StartupDocument = {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
};

export type StartupNote = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
};

export type MentorAssignment = {
  mentorId?: string;
  mentorEmail?: string;
  mentorName: string;
  expertise: string;
  assignmentType?: "Ana Mentor" | "Alan Mentoru";
  startDate?: string;
  targetMeetingCount?: number;
  meetingCount: number;
  lastMeeting: string;
};

export type Startup = {
  id: string;
  applicationId: string;
  programId: string;
  name: string;
  slug: string;
  logo: string;
  founder: string;
  sector: string;
  stage: string;
  website: string;
  problem: string;
  solution: string;
  businessModel: string;
  traction: string;
  status: StartupStatus;
  progress: number;
  acceptedAt: string;
  members: StartupMember[];
  documents: StartupDocument[];
  notes: StartupNote[];
  mentor: MentorAssignment | null;
  demoDayChecklist: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
};

export const startupsStorageKey = "lidea-startups";

export const startupStatuses: StartupStatus[] = [
  "Aktif",
  "Demo Day Hazır",
  "Mezun",
  "Pasif",
  "Programdan Ayrıldı",
];

export const demoDayItems = [
  "Pitch Deck",
  "Business Model",
  "MVP",
  "Mentor Onayı",
  "Demo Video",
  "Final Pitch",
];

const profileCompletionChecks = [
  { key: "logo", label: "Logo" },
  { key: "name", label: "Temel Bilgiler" },
  { key: "sector", label: "Sektör" },
  { key: "stage", label: "Aşama" },
  { key: "website", label: "Web Sitesi" },
  { key: "problem", label: "Problem" },
  { key: "solution", label: "Çözüm" },
  { key: "businessModel", label: "İş Modeli" },
  { key: "traction", label: "Traction" },
  { key: "members", label: "Ekip" },
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function emptyDemoChecklist() {
  return Object.fromEntries(demoDayItems.map((item) => [item, false])) as Record<string, boolean>;
}

export function startupFromApplication(application: Application) {
  const now = new Date().toISOString();

  return {
    id: `ST-${application.id}`,
    applicationId: application.id,
    programId: application.programId,
    name: application.startup,
    slug: slugify(application.startup),
    logo: application.startup.slice(0, 2).toUpperCase(),
    founder: application.founder,
    sector: application.sector,
    stage: application.stage,
    website: application.website,
    problem: application.problem,
    solution: application.solution,
    businessModel: application.businessModel,
    traction: application.traction,
    status: "Aktif",
    progress: 0,
    acceptedAt: new Date().toISOString().slice(0, 10),
    members: [
      {
        id: crypto.randomUUID(),
        name: application.founder || "Kurucu",
        role: "Kurucu",
        title: "Founder",
        active: true,
      },
    ],
    documents: application.documents.map((document) => ({
      id: document.id,
      type: document.type,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      uploadedAt: document.uploadedAt,
    })),
    notes: [],
    mentor: null,
    demoDayChecklist: emptyDemoChecklist(),
    createdAt: now,
    updatedAt: now,
  } satisfies Startup;
}

export function getStartupProfileCompletion(startup: Startup | null) {
  const items = profileCompletionChecks.map((item) => {
    if (!startup) return { label: item.label, completed: false };
    const value = startup[item.key];
    const completed = Array.isArray(value) ? value.length > 0 : String(value || "").trim().length > 0;
    return { label: item.label, completed };
  });
  const completedCount = items.filter((item) => item.completed).length;

  return {
    percent: items.length ? Math.round((completedCount / items.length) * 100) : 0,
    completedCount,
    totalCount: items.length,
    items,
  };
}

export function normalizeStartup(raw: Partial<Startup> & Record<string, unknown>) {
  const name = String(raw.name || "");

  return {
    id: String(raw.id || `ST-${Date.now().toString().slice(-6)}`),
    applicationId: String(raw.applicationId || ""),
    programId: String(raw.programId || "program-3"),
    name,
    slug: String(raw.slug || slugify(name)),
    logo: String(raw.logo || name.slice(0, 2).toUpperCase()),
    founder: String(raw.founder || ""),
    sector: String(raw.sector || "Belirtilmedi"),
    stage: String(raw.stage || "MVP"),
    website: String(raw.website || ""),
    problem: String(raw.problem || ""),
    solution: String(raw.solution || ""),
    businessModel: String(raw.businessModel || ""),
    traction: String(raw.traction || ""),
    status: (raw.status || "Aktif") as StartupStatus,
    progress: Number(raw.progress || 0),
    acceptedAt: String(raw.acceptedAt || new Date().toISOString().slice(0, 10)),
    members: Array.isArray(raw.members) ? (raw.members as StartupMember[]) : [],
    documents: Array.isArray(raw.documents) ? (raw.documents as StartupDocument[]) : [],
    notes: Array.isArray(raw.notes) ? (raw.notes as StartupNote[]) : [],
    mentor: (raw.mentor as MentorAssignment | null) || null,
    demoDayChecklist: { ...emptyDemoChecklist(), ...(raw.demoDayChecklist as Record<string, boolean>) },
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
  } satisfies Startup;
}

export function readStartups() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(startupsStorageKey);
  if (!saved) {
    window.localStorage.setItem(startupsStorageKey, JSON.stringify([]));
    return [];
  }

  try {
    const startups = (JSON.parse(saved) as Record<string, unknown>[]).map(normalizeStartup);
    window.localStorage.setItem(startupsStorageKey, JSON.stringify(startups));
    return startups;
  } catch {
    window.localStorage.setItem(startupsStorageKey, JSON.stringify([]));
    return [];
  }
}

export function writeStartups(startups: Startup[]) {
  window.localStorage.setItem(startupsStorageKey, JSON.stringify(startups));
  window.dispatchEvent(new Event("lidea-startups-updated"));
}

export function saveStartup(startup: Startup) {
  const startups = readStartups();
  const exists = startups.some((item) => item.id === startup.id);
  writeStartups(
    exists
      ? startups.map((item) => (item.id === startup.id ? startup : item))
      : [startup, ...startups],
  );
}

export function syncAcceptedApplicationsToStartups() {
  const startups = readStartups();
  const applications = readApplications().filter((application) => application.status === "Kabul");
  const missingStartups = applications
    .filter((application) => !startups.some((startup) => startup.applicationId === application.id))
    .map(startupFromApplication);

  if (!missingStartups.length) return startups;

  const nextStartups = [...missingStartups, ...startups];
  writeStartups(nextStartups);
  return nextStartups;
}
