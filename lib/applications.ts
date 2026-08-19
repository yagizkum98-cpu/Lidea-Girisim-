export type ApplicationStatus =
  | "Yeni"
  | "İnceleniyor"
  | "Eksik Bilgi"
  | "Jüriye Gönderildi"
  | "Kabul"
  | "Yedek"
  | "Reddedildi";

export type ApplicationDocument = {
  id: string;
  applicationId: string;
  type: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
};

export type ApplicationStatusHistory = {
  id: string;
  applicationId: string;
  oldStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  changedBy: string;
  createdAt: string;
};

export type Application = {
  id: string;
  applicationNumber: string;
  programId: string;
  founder: string;
  founderId: string;
  email: string;
  phone: string;
  startup: string;
  startupName: string;
  period: string;
  sector: string;
  city: string;
  stage: string;
  website: string;
  teamSize: number;
  score: number;
  juryScore: number;
  status: ApplicationStatus;
  problem: string;
  solution: string;
  targetMarket: string;
  businessModel: string;
  competitors: string;
  differentiation: string;
  traction: string;
  futureGoals: string;
  adminNote: string;
  preEvaluation: Record<string, boolean>;
  missingInfoRequest: string;
  juryAssignees: string[];
  juryDeadline: string;
  documents: ApplicationDocument[];
  statusHistory: ApplicationStatusHistory[];
  submittedAt: string;
  updatedAt: string;
};

export const applicationsStorageKey = "lidea-applications";
export const adminActivitiesStorageKey = "lidea-admin-activities";

export const applicationStatuses: ApplicationStatus[] = [
  "Yeni",
  "İnceleniyor",
  "Eksik Bilgi",
  "Jüriye Gönderildi",
  "Kabul",
  "Yedek",
  "Reddedildi",
];

export const preEvaluationItems = [
  "Başvuru eksiksiz",
  "Program kriterlerine uygun",
  "Problem açık tanımlanmış",
  "Çözüm anlaşılır",
  "Ekip bilgileri mevcut",
  "Gerekli belgeler mevcut",
];

const legacyDemoIds = new Set([
  "LID-0301",
  "LID-0302",
  "LID-0303",
  "LID-0304",
  "LID-0305",
  "LID-0306",
]);

function emptyChecklist() {
  return Object.fromEntries(preEvaluationItems.map((item) => [item, false])) as Record<
    string,
    boolean
  >;
}

export function normalizeApplication(raw: Partial<Application> & Record<string, unknown>) {
  const id = String(raw.id || `LID-${Date.now().toString().slice(-6)}`);
  const startup = String(raw.startup || raw.startupName || "");
  const status = (raw.status || "Yeni") as ApplicationStatus;

  return {
    id,
    applicationNumber: String(raw.applicationNumber || id),
    programId: String(raw.programId || "program-3"),
    founder: String(raw.founder || ""),
    founderId: String(raw.founderId || ""),
    email: String(raw.email || ""),
    phone: String(raw.phone || ""),
    startup,
    startupName: String(raw.startupName || startup),
    period: String(raw.period || "3. Dönem"),
    sector: String(raw.sector || "Belirtilmedi"),
    city: String(raw.city || ""),
    stage: String(raw.stage || "Fikir"),
    website: String(raw.website || ""),
    teamSize: Number(raw.teamSize || 1),
    score: Number(raw.score || 0),
    juryScore: Number(raw.juryScore || raw.score || 0),
    status,
    problem: String(raw.problem || ""),
    solution: String(raw.solution || ""),
    targetMarket: String(raw.targetMarket || ""),
    businessModel: String(raw.businessModel || ""),
    competitors: String(raw.competitors || ""),
    differentiation: String(raw.differentiation || ""),
    traction: String(raw.traction || ""),
    futureGoals: String(raw.futureGoals || ""),
    adminNote: String(raw.adminNote || ""),
    preEvaluation: { ...emptyChecklist(), ...(raw.preEvaluation as Record<string, boolean>) },
    missingInfoRequest: String(raw.missingInfoRequest || ""),
    juryAssignees: Array.isArray(raw.juryAssignees) ? (raw.juryAssignees as string[]) : [],
    juryDeadline: String(raw.juryDeadline || ""),
    documents: Array.isArray(raw.documents) ? (raw.documents as ApplicationDocument[]) : [],
    statusHistory: Array.isArray(raw.statusHistory)
      ? (raw.statusHistory as ApplicationStatusHistory[])
      : [],
    submittedAt: String(raw.submittedAt || new Date().toISOString().slice(0, 10)),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
  } satisfies Application;
}

export function readApplications() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(applicationsStorageKey);
  if (!saved) {
    window.localStorage.setItem(applicationsStorageKey, JSON.stringify([]));
    return [];
  }

  try {
    const applications = (JSON.parse(saved) as Record<string, unknown>[])
      .map(normalizeApplication)
      .filter((item) => !legacyDemoIds.has(item.id));
    window.localStorage.setItem(applicationsStorageKey, JSON.stringify(applications));
    return applications;
  } catch {
    window.localStorage.setItem(applicationsStorageKey, JSON.stringify([]));
    return [];
  }
}

export function writeApplications(applications: Application[]) {
  window.localStorage.setItem(applicationsStorageKey, JSON.stringify(applications));
  window.dispatchEvent(new Event("lidea-applications-updated"));
}

export function saveApplication(application: Application) {
  const applications = readApplications();
  const exists = applications.some((item) => item.id === application.id);
  const next = exists
    ? applications.map((item) => (item.id === application.id ? application : item))
    : [application, ...applications];
  writeApplications(next);
}

export function addAdminActivity(title: string, detail: string) {
  const saved = window.localStorage.getItem(adminActivitiesStorageKey);
  let activities: { time: string; title: string; detail: string }[] = [];

  try {
    activities = saved ? JSON.parse(saved) : [];
  } catch {
    activities = [];
  }

  window.localStorage.setItem(
    adminActivitiesStorageKey,
    JSON.stringify(
      [
        {
          time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
          title,
          detail,
        },
        ...activities,
      ].slice(0, 30),
    ),
  );
}
