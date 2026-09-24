import { Application, readApplications, saveApplication } from "@/lib/applications";

export type EvaluatorStatus = "Aktif" | "Pasif";

export type Evaluator = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  institution: string;
  title: string;
  expertise: string[];
  status: EvaluatorStatus;
  assignmentLimit: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type EvaluatorAssignment = {
  application: Application;
  status: "Bekliyor" | "Değerlendiriliyor" | "Tamamlandı";
};

type AdminUser = {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: string;
  status?: string;
  createdAt?: string;
};

export const evaluatorsStorageKey = "lidea-evaluators";
export const adminUsersStorageKey = "lidea-admin-users";

export const evaluatorStatuses: EvaluatorStatus[] = ["Aktif", "Pasif"];

export const expertiseOptions = [
  "Teknoloji",
  "Yapay Zeka",
  "SaaS",
  "Finans",
  "Pazarlama",
  "Satış",
  "İş Geliştirme",
  "Yatırım",
  "Sürdürülebilirlik",
  "Turizm",
  "Tarım",
  "Mobilite",
];

export const evaluationCriteria = [
  "Problem Tanımı",
  "Çözüm",
  "Yenilikçilik",
  "Pazar Potansiyeli",
  "İş Modeli",
  "Ölçeklenebilirlik",
  "Ekip",
  "Uygulanabilirlik",
];

export function normalizeEvaluator(raw: Partial<Evaluator> & Record<string, unknown>) {
  const id = String(raw.id || `EV-${Date.now().toString().slice(-6)}`);
  const expertise = Array.isArray(raw.expertise)
    ? (raw.expertise as string[]).filter(Boolean)
    : String(raw.expertise || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return {
    id,
    name: String(raw.name || ""),
    email: String(raw.email || "").toLowerCase(),
    password: String(raw.password || ""),
    phone: String(raw.phone || ""),
    institution: String(raw.institution || ""),
    title: String(raw.title || ""),
    expertise,
    status: (raw.status || "Aktif") as EvaluatorStatus,
    assignmentLimit: Number(raw.assignmentLimit || 8),
    notes: String(raw.notes || ""),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
  } satisfies Evaluator;
}

export function readEvaluators() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(evaluatorsStorageKey);
  const evaluatorRoles = new Set(["Değerlendirme Yetkilisi", "Jüri"]);
  const savedUsers = window.localStorage.getItem(adminUsersStorageKey);
  let users: AdminUser[] = [];

  try {
    users = savedUsers ? (JSON.parse(savedUsers) as AdminUser[]) : [];
  } catch {
    users = [];
  }

  const userEvaluators = users
    .filter((user) => evaluatorRoles.has(user.role))
    .map((user) =>
      normalizeEvaluator({
        id: user.id || `EV-${user.email}`,
        name: user.name,
        email: user.email,
        password: user.password,
        status: user.status === "Pasif" ? "Pasif" : "Aktif",
        createdAt: user.createdAt,
      }),
    );

  if (!saved) {
    window.localStorage.setItem(evaluatorsStorageKey, JSON.stringify(userEvaluators));
    return userEvaluators;
  }

  try {
    const storedEvaluators = (JSON.parse(saved) as Record<string, unknown>[]).map(normalizeEvaluator);
    const mergedByEmail = new Map<string, Evaluator>();
    userEvaluators.forEach((evaluator) => mergedByEmail.set(evaluator.email, evaluator));
    storedEvaluators.forEach((evaluator) =>
      mergedByEmail.set(evaluator.email, { ...mergedByEmail.get(evaluator.email), ...evaluator }),
    );
    const evaluators = Array.from(mergedByEmail.values());
    window.localStorage.setItem(evaluatorsStorageKey, JSON.stringify(evaluators));
    return evaluators;
  } catch {
    window.localStorage.setItem(evaluatorsStorageKey, JSON.stringify([]));
    return [];
  }
}

export function writeEvaluators(evaluators: Evaluator[]) {
  window.localStorage.setItem(evaluatorsStorageKey, JSON.stringify(evaluators));
  window.dispatchEvent(new Event("lidea-evaluators-updated"));
}

export function saveEvaluator(evaluator: Evaluator) {
  const evaluators = readEvaluators();
  const exists = evaluators.some((item) => item.id === evaluator.id);
  const next = exists
    ? evaluators.map((item) => (item.id === evaluator.id ? evaluator : item))
    : [evaluator, ...evaluators];
  writeEvaluators(next);
}

export function syncEvaluatorUser(evaluator: Evaluator) {
  const saved = window.localStorage.getItem(adminUsersStorageKey);
  let users: AdminUser[] = [];

  try {
    users = saved ? (JSON.parse(saved) as AdminUser[]) : [];
  } catch {
    users = [];
  }

  const exists = users.some((user) => user.email.toLowerCase() === evaluator.email.toLowerCase());
  const nextUser: AdminUser = {
    id: evaluator.id,
    name: evaluator.name,
    email: evaluator.email,
    password: evaluator.password,
    role: "Değerlendirme Yetkilisi",
    status: evaluator.status,
    createdAt: evaluator.createdAt,
  };

  const nextUsers = exists
    ? users.map((user) =>
        user.email.toLowerCase() === evaluator.email.toLowerCase()
          ? {
              ...user,
              name: evaluator.name,
              password: evaluator.password || user.password,
              role: user.role || "Değerlendirme Yetkilisi",
              status: evaluator.status,
            }
          : user,
      )
    : [nextUser, ...users];

  window.localStorage.setItem(adminUsersStorageKey, JSON.stringify(nextUsers));
  window.dispatchEvent(new Event("lidea-admin-users-updated"));
}

export function getEvaluatorAssignments(email: string): EvaluatorAssignment[] {
  return readApplications()
    .filter((application) => application.juryAssignees.includes(email))
    .map((application) => ({
      application,
      status: application.juryScore > 0 ? "Tamamlandı" : "Bekliyor",
    }));
}

export function assignApplicationsToEvaluator(
  evaluator: Evaluator,
  applicationIds: string[],
  juryDeadline: string,
) {
  readApplications()
    .filter((application) => applicationIds.includes(application.id))
    .forEach((application) => {
      saveApplication({
        ...application,
        status: "Jüriye Gönderildi",
        juryDeadline,
        juryAssignees: Array.from(new Set([...application.juryAssignees, evaluator.email])),
        updatedAt: new Date().toISOString(),
      });
    });

  window.dispatchEvent(new Event("lidea-applications-updated"));
}
