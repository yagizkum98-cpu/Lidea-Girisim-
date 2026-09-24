import { Application, ApplicationStatus, applicationStatuses, readApplications } from "@/lib/applications";
import { Evaluator, readEvaluators } from "@/lib/evaluators";
import { readMentorMeetings, readMentors } from "@/lib/mentors";
import { Startup, startupStatuses, syncAcceptedApplicationsToStartups } from "@/lib/startups";
import { readNotifications } from "@/lib/notifications";

export type ReportsSnapshot = {
  applications: Application[];
  startups: Startup[];
  evaluators: Evaluator[];
  mentors: ReturnType<typeof readMentors>;
  notifications: ReturnType<typeof readNotifications>;
  mentorMeetings: ReturnType<typeof readMentorMeetings>;
};

export function readReportsSnapshot(): ReportsSnapshot {
  return {
    applications: readApplications(),
    startups: syncAcceptedApplicationsToStartups(),
    evaluators: readEvaluators(),
    mentors: readMentors(),
    notifications: readNotifications(),
    mentorMeetings: readMentorMeetings(),
  };
}

export function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item) || "Belirtilmedi";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

export function createReportsMetrics(snapshot: ReportsSnapshot) {
  const statusCounts = Object.fromEntries(
    applicationStatuses.map((status) => [
      status,
      snapshot.applications.filter((application) => application.status === status).length,
    ]),
  ) as Record<ApplicationStatus, number>;

  const evaluatorRows = snapshot.evaluators.map((evaluator) => {
    const assigned = snapshot.applications.filter((application) =>
      application.juryAssignees.includes(evaluator.email),
    );
    const completed = assigned.filter((application) => application.juryScore > 0);
    return {
      name: evaluator.name,
      assigned: assigned.length,
      completed: completed.length,
      waiting: assigned.length - completed.length,
    };
  });

  const mentorAssigned = snapshot.startups.filter((startup) => startup.mentor);
  const completedMentorMeetings = snapshot.mentorMeetings.filter((meeting) => meeting.status === "Tamamlandı");
  const juryStartups = snapshot.applications.filter((application) => application.status === "Jüriye Gönderildi");

  return {
    overview: {
      applications: snapshot.applications.length,
      accepted: statusCounts.Kabul || 0,
      evaluators: snapshot.evaluators.length,
      mentors: snapshot.mentors.length,
      remainingJury: juryStartups.filter((application) => application.juryScore === 0).length,
      conversionRate: snapshot.applications.length
        ? Math.round(((statusCounts.Kabul || 0) / snapshot.applications.length) * 1000) / 10
        : 0,
    },
    application: {
      statusCounts,
      sectorCounts: countBy(snapshot.applications, (application) => application.sector),
      cityCounts: countBy(snapshot.applications, (application) => application.city),
    },
    startup: {
      total: snapshot.startups.length,
      statusCounts: Object.fromEntries(
        startupStatuses.map((status) => [
          status,
          snapshot.startups.filter((startup) => startup.status === status).length,
        ]),
      ),
      stageCounts: countBy(snapshot.startups, (startup) => startup.stage),
      sectorCounts: countBy(snapshot.startups, (startup) => startup.sector),
    },
    evaluation: {
      totalAssignments: snapshot.applications.reduce((sum, application) => sum + application.juryAssignees.length, 0),
      completed: snapshot.applications.filter((application) => application.juryAssignees.length && application.juryScore > 0).length,
      waiting: snapshot.applications.filter((application) => application.juryAssignees.length && application.juryScore === 0).length,
      rows: evaluatorRows,
    },
    mentorship: {
      activeMentors: snapshot.mentors.filter((mentor) => mentor.status === "Aktif").length,
      assignments: mentorAssigned.length,
      completedMeetings: completedMentorMeetings.length,
      withoutMentor: snapshot.startups.length - mentorAssigned.length,
      rows: snapshot.startups.map((startup) => ({
        name: startup.name,
        meetingCount: startup.mentor?.meetingCount || 0,
        targetMeetingCount: startup.mentor?.targetMeetingCount || 0,
        mentorName: startup.mentor?.mentorName || "",
      })),
    },
    jury: {
      startups: juryStartups.length,
      members: snapshot.evaluators.length,
      scores: snapshot.applications.filter((application) => application.juryScore > 0).length,
      completion: juryStartups.length
        ? Math.round((snapshot.applications.filter((application) => application.juryScore > 0).length / juryStartups.length) * 100)
        : 0,
      ranking: [...snapshot.applications]
        .filter((application) => application.juryScore > 0)
        .sort((a, b) => b.juryScore - a.juryScore)
        .map((application, index) => ({
          rank: index + 1,
          startup: application.startup,
          average: application.juryScore,
        })),
    },
  };
}

export function toCsv(rows: Record<string, string | number>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const body = rows.map((row) =>
    headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(","),
  );
  return [headers.join(","), ...body].join("\n");
}
