export type ApplicationStatus =
  | "Yeni"
  | "İnceleniyor"
  | "Eksik Bilgi"
  | "Jüriye Gönderildi"
  | "Kabul"
  | "Yedek"
  | "Reddedildi";

export type ProgramTrack = "Ön Kuluçka" | "Kuluçka";

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
  programTrack: ProgramTrack | "";
  sector: string;
  city: string;
  district: string;
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
  programExpectations: string[];
  programExpectationOther: string;
  kvkkAccepted: boolean;
  kvkkAcceptedAt: string;
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

const applicationCompletionChecks = [
  { key: "applicationNumber", label: "Başvuru No" },
  { key: "founder", label: "Kurucu" },
  { key: "email", label: "E-posta" },
  { key: "phone", label: "Telefon" },
  { key: "startup", label: "Girişim" },
  { key: "period", label: "Dönem" },
  { key: "sector", label: "Sektör" },
  { key: "city", label: "Şehir" },
  { key: "district", label: "İlçe" },
  { key: "stage", label: "Aşama" },
  { key: "website", label: "Web Sitesi" },
  { key: "problem", label: "Problem" },
  { key: "solution", label: "Çözüm" },
  { key: "targetMarket", label: "Hedef Kitle" },
  { key: "businessModel", label: "İş Modeli" },
  { key: "competitors", label: "Rakipler" },
  { key: "differentiation", label: "Farklılaşma" },
  { key: "traction", label: "Traction" },
  { key: "futureGoals", label: "Gelecek Hedefleri" },
] as const;

const applicationProcessSteps: { label: string; statuses: ApplicationStatus[] }[] = [
  { label: "Başvuru", statuses: ["Yeni"] },
  { label: "Ön İnceleme", statuses: ["İnceleniyor", "Eksik Bilgi"] },
  { label: "Değerlendirme", statuses: ["Jüriye Gönderildi"] },
  { label: "Sonuç", statuses: ["Kabul", "Yedek", "Reddedildi"] },
];

const friendlyStatus: Record<ApplicationStatus, { label: string; description: string }> = {
  Yeni: {
    label: "Gönderildi",
    description: "Başvurunuz başarıyla alındı ve ön kontrol için sıraya eklendi.",
  },
  İnceleniyor: {
    label: "Ön İncelemede",
    description: "Başvurunuz değerlendirme ekibi tarafından inceleniyor.",
  },
  "Eksik Bilgi": {
    label: "Ek Bilgi Gerekli",
    description: "Başvurunuz için ek bilgi veya belge talebi bulunuyor.",
  },
  "Jüriye Gönderildi": {
    label: "Jüri Aşamasında",
    description: "Başvurunuz final değerlendirme aşamasına iletildi.",
  },
  Kabul: {
    label: "Kabul Edildi",
    description: "Tebrikler, başvurunuz programa kabul edildi.",
  },
  Yedek: {
    label: "Yedek Liste",
    description: "Başvurunuz yedek listeye alındı.",
  },
  Reddedildi: {
    label: "Sonuçlandı",
    description: "Başvuru süreciniz bu dönem için tamamlandı.",
  },
};

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
    programTrack:
      raw.programTrack === "Ön Kuluçka" || raw.programTrack === "Kuluçka"
        ? raw.programTrack
        : "",
    sector: String(raw.sector || "Belirtilmedi"),
    city: String(raw.city || ""),
    district: String(raw.district || ""),
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
    programExpectations: Array.isArray(raw.programExpectations)
      ? raw.programExpectations.map(String)
      : [],
    programExpectationOther: String(raw.programExpectationOther || ""),
    kvkkAccepted: raw.kvkkAccepted === true,
    kvkkAcceptedAt: String(raw.kvkkAcceptedAt || ""),
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

const apiStatusMap: Record<string, ApplicationStatus> = {
  NEW: "Yeni",
  UNDER_REVIEW: "İnceleniyor",
  MISSING_INFO: "Eksik Bilgi",
  SENT_TO_JURY: "Jüriye Gönderildi",
  ACCEPTED: "Kabul",
  WAITLIST: "Yedek",
  REJECTED: "Reddedildi",
};

export function applicationFromApi(raw: Record<string, unknown>) {
  const createdAt = String(raw.createdAt || new Date().toISOString());

  return normalizeApplication({
    ...raw,
    applicationNumber: String(raw.applicationNo || raw.applicationNumber || raw.id || ""),
    startup: String(raw.startupName || raw.startup || ""),
    status: apiStatusMap[String(raw.status || "NEW")] || "Yeni",
    submittedAt: createdAt.slice(0, 10),
    updatedAt: String(raw.updatedAt || createdAt),
    documents: [],
  });
}

export function mergeApplicationsFromApi(remote: Application[], local: Application[]) {
  const remoteIds = new Set(remote.map((item) => item.id));
  const mergedRemote = remote.map((item) => {
    const existing = local.find((candidate) => candidate.id === item.id);
    if (!existing) return item;

    return normalizeApplication({
      ...item,
      ...existing,
      applicationNumber: item.applicationNumber,
      founder: item.founder,
      email: item.email,
      phone: item.phone,
      startup: item.startup,
      startupName: item.startupName,
      sector: item.sector,
      city: item.city,
      district: item.district,
      stage: item.stage,
      website: item.website,
      teamSize: item.teamSize,
      status: item.status,
      programTrack: item.programTrack,
      score: item.score,
      juryScore: item.juryScore,
      problem: item.problem,
      solution: item.solution,
      targetMarket: item.targetMarket,
      businessModel: item.businessModel,
      programExpectations: item.programExpectations,
      programExpectationOther: item.programExpectationOther,
      kvkkAccepted: item.kvkkAccepted,
      kvkkAcceptedAt: item.kvkkAcceptedAt,
      submittedAt: item.submittedAt,
      updatedAt: item.updatedAt,
    });
  });

  return [...mergedRemote, ...local.filter((item) => !remoteIds.has(item.id))];
}

export function getApplicationSubmissionCompletion(application: Application | null) {
  const items = applicationCompletionChecks.map((item) => {
    if (!application) return { label: item.label, completed: false };
    const value = application[item.key];
    return { label: item.label, completed: String(value || "").trim().length > 0 };
  });
  const completedCount = items.filter((item) => item.completed).length;

  return {
    percent: items.length ? Math.round((completedCount / items.length) * 100) : 0,
    completedCount,
    totalCount: items.length,
    items,
  };
}

export function getApplicationProcess(application: Application | null) {
  if (!application) {
    return {
      percent: 0,
      statusLabel: "Başvuru yok",
      description: "Başvuru formu doldurulduğunda bu alan canlı olarak güncellenir.",
      steps: applicationProcessSteps.map((step) => ({
        label: step.label,
        state: "Bekliyor" as const,
      })),
    };
  }

  const activeStepIndex = applicationProcessSteps.findIndex((step) =>
    step.statuses.includes(application.status),
  );
  const resultIndex = applicationProcessSteps.length - 1;
  const isFinished = activeStepIndex === resultIndex;
  const completedSteps = isFinished
    ? applicationProcessSteps.length
    : Math.max(activeStepIndex + 1, 0);

  return {
    percent: Math.round((completedSteps / applicationProcessSteps.length) * 100),
    statusLabel: friendlyStatus[application.status].label,
    description: friendlyStatus[application.status].description,
    steps: applicationProcessSteps.map((step, index) => ({
      label: step.label,
      state:
        index < completedSteps
          ? ("Tamamlandı" as const)
          : index === activeStepIndex
            ? ("Devam Ediyor" as const)
            : ("Bekliyor" as const),
    })),
  };
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
