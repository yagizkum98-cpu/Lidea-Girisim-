export type AppRole =
  | "SUPER_ADMIN"
  | "PROGRAM_ADMIN"
  | "ENTREPRENEUR"
  | "EVALUATOR"
  | "MENTOR"
  | "JURY";

export type Permission =
  | "program:manage"
  | "applications:manage"
  | "applications:evaluate"
  | "startups:manage"
  | "startups:read_assigned"
  | "mentors:manage"
  | "mentor:sessions"
  | "jury:manage"
  | "jury:evaluate"
  | "notifications:send"
  | "reports:read"
  | "settings:manage";

export const rolePermissions: Record<AppRole, Permission[]> = {
  SUPER_ADMIN: [
    "program:manage",
    "applications:manage",
    "applications:evaluate",
    "startups:manage",
    "startups:read_assigned",
    "mentors:manage",
    "mentor:sessions",
    "jury:manage",
    "jury:evaluate",
    "notifications:send",
    "reports:read",
    "settings:manage",
  ],
  PROGRAM_ADMIN: [
    "program:manage",
    "applications:manage",
    "startups:manage",
    "mentors:manage",
    "jury:manage",
    "notifications:send",
    "reports:read",
  ],
  ENTREPRENEUR: ["startups:read_assigned"],
  EVALUATOR: ["applications:evaluate"],
  MENTOR: ["startups:read_assigned", "mentor:sessions"],
  JURY: ["jury:evaluate", "startups:read_assigned"],
};

export function hasPermission(role: AppRole, permission: Permission) {
  return rolePermissions[role]?.includes(permission) || false;
}

export function requirePermission(role: AppRole | undefined, permission: Permission) {
  if (!role || !hasPermission(role, permission)) {
    throw new Error("FORBIDDEN");
  }
}

export function canAccessStartup(params: {
  role: AppRole;
  userId: string;
  ownerId?: string | null;
  mentorIds?: string[];
  juryIds?: string[];
}) {
  if (["SUPER_ADMIN", "PROGRAM_ADMIN"].includes(params.role)) return true;
  if (params.role === "ENTREPRENEUR") return params.ownerId === params.userId;
  if (params.role === "MENTOR") return params.mentorIds?.includes(params.userId) || false;
  if (params.role === "JURY") return params.juryIds?.includes(params.userId) || false;
  return false;
}

export function canAccessApplication(params: {
  role: AppRole;
  userId: string;
  ownerId?: string | null;
  evaluatorIds?: string[];
}) {
  if (["SUPER_ADMIN", "PROGRAM_ADMIN"].includes(params.role)) return true;
  if (params.role === "ENTREPRENEUR") return params.ownerId === params.userId;
  if (params.role === "EVALUATOR") return params.evaluatorIds?.includes(params.userId) || false;
  return false;
}
