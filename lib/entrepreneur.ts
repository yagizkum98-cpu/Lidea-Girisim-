import { Application, readApplications } from "@/lib/applications";
import { MentorMeeting, readMentorMeetings } from "@/lib/mentors";
import { Startup, StartupDocument, StartupMember, StartupNote, normalizeStartup, readStartups, saveStartup, syncAcceptedApplicationsToStartups } from "@/lib/startups";

export type EntrepreneurTaskStatus = "Bekliyor" | "Devam Ediyor" | "Tamamlandı";

export type EntrepreneurTask = {
  id: string;
  title: string;
  dueDate: string;
  status: EntrepreneurTaskStatus;
  progress: string;
};

export type ProgramStage = {
  id: string;
  programId: string;
  title: string;
  order: number;
  startDate: string;
  endDate: string;
  active: boolean;
  description: string;
};

export type EntrepreneurTraining = {
  id: string;
  title: string;
  date: string;
  type: string;
  completed: boolean;
};

export type EntrepreneurWorkspace = {
  email: string;
  progress: number;
  pitchDeckStatus: string;
  nextStep: string;
  tasks: EntrepreneurTask[];
  trainings: EntrepreneurTraining[];
  documents: StartupDocument[];
  notes: StartupNote[];
  updatedAt: string;
};

export const entrepreneurWorkspacesStorageKey = "lidea-entrepreneur-workspaces";
export const programStagesStorageKey = "lidea-program-stages";

function emptyWorkspace(email: string): EntrepreneurWorkspace {
  return {
    email,
    progress: 0,
    pitchDeckStatus: "Bekliyor",
    nextStep: "",
    tasks: [],
    trainings: [],
    documents: [],
    notes: [],
    updatedAt: new Date().toISOString(),
  };
}

export function readEntrepreneurWorkspaces() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(entrepreneurWorkspacesStorageKey);
  if (!saved) {
    window.localStorage.setItem(entrepreneurWorkspacesStorageKey, JSON.stringify([]));
    return [];
  }

  try {
    return JSON.parse(saved) as EntrepreneurWorkspace[];
  } catch {
    window.localStorage.setItem(entrepreneurWorkspacesStorageKey, JSON.stringify([]));
    return [];
  }
}

export function readEntrepreneurWorkspace(email: string) {
  const normalizedEmail = email.toLowerCase();
  const workspaces = readEntrepreneurWorkspaces();
  const existing = workspaces.find((workspace) => workspace.email.toLowerCase() === normalizedEmail);
  return existing || emptyWorkspace(normalizedEmail);
}

export function saveEntrepreneurWorkspace(workspace: EntrepreneurWorkspace) {
  const workspaces = readEntrepreneurWorkspaces();
  const exists = workspaces.some((item) => item.email.toLowerCase() === workspace.email.toLowerCase());
  const next = exists
    ? workspaces.map((item) => (item.email.toLowerCase() === workspace.email.toLowerCase() ? workspace : item))
    : [workspace, ...workspaces];
  window.localStorage.setItem(entrepreneurWorkspacesStorageKey, JSON.stringify(next));
  window.dispatchEvent(new Event("lidea-entrepreneur-workspaces-updated"));
}

export function readProgramStages() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(programStagesStorageKey);
  if (!saved) {
    window.localStorage.setItem(programStagesStorageKey, JSON.stringify([]));
    return [];
  }

  try {
    return (JSON.parse(saved) as ProgramStage[])
      .filter((stage) => !/^stage-\d+$/.test(stage.id))
      .sort((a, b) => a.order - b.order);
  } catch {
    window.localStorage.setItem(programStagesStorageKey, JSON.stringify([]));
    return [];
  }
}

export function getProgramProgress(workspace: EntrepreneurWorkspace | null) {
  const tasks = workspace?.tasks || [];
  const completedTasks = tasks.filter((task) => task.status === "Tamamlandı").length;

  return {
    percent: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
    completedTasks,
    totalTasks: tasks.length,
    nextTask: tasks.find((task) => task.status !== "Tamamlandı") || null,
    overdueTasks: tasks.filter((task) => {
      if (!task.dueDate || task.status === "Tamamlandı") return false;
      return new Date(`${task.dueDate}T23:59:59`) < new Date();
    }),
  };
}

export function findEntrepreneurApplication(email: string): Application | null {
  return (
    readApplications().find((application) => application.email.toLowerCase() === email.toLowerCase()) ||
    null
  );
}

export function findEntrepreneurStartup(email: string) {
  syncAcceptedApplicationsToStartups();
  const application = findEntrepreneurApplication(email);
  if (!application) return null;
  return readStartups().find((startup) => startup.applicationId === application.id) || null;
}

export function createManualStartupForEntrepreneur(email: string, founder: string, name: string) {
  const startup = normalizeStartup({
    id: `ST-MAN-${Date.now().toString().slice(-6)}`,
    applicationId: "",
    programId: "program-3",
    name,
    founder,
    status: "Aktif",
    progress: 0,
    acceptedAt: "",
    members: [],
    documents: [],
    notes: [],
  });
  saveStartup(startup);
  saveEntrepreneurWorkspace({ ...emptyWorkspace(email), progress: 0 });
  return startup;
}

export function readEntrepreneurMeetings(startup: Startup | null): MentorMeeting[] {
  if (!startup) return [];
  return readMentorMeetings().filter((meeting) => meeting.startupId === startup.id);
}
