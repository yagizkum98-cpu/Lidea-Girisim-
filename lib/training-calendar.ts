import { ProgramEvent, eventCalendar, googleCalendarUrl } from "@/lib/events";
import { TrainingSession, trainingStartsAt } from "@/lib/trainings";

function trainingEvent(training: TrainingSession): ProgramEvent {
  const startsAt = trainingStartsAt(training);
  const endsAt = training.endTime ? new Date(`${training.date}T${training.endTime}:00+03:00`) : new Date(startsAt.getTime() + 86_400_000);
  return { id: training.id, title: training.title, description: training.description, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(),
    mode: training.mode, location: training.location, meetingUrl: training.meetingUrl, status: training.status === "cancelled" ? "cancelled" : "published",
    hostEmail: training.hostEmail, guests: [], reminders: training.reminders, createdAt: startsAt.toISOString(), updatedAt: new Date().toISOString() };
}

export function trainingCalendarFile(training: TrainingSession, detailUrl: string) {
  return eventCalendar(trainingEvent(training), detailUrl, { allDay: !training.startTime, reminders: training.startTime ? training.reminders : [] });
}

export function trainingGoogleCalendar(training: TrainingSession, detailUrl: string) {
  const event = trainingEvent(training);
  if (training.startTime) return googleCalendarUrl(event, detailUrl);
  const nextDay = new Date(`${training.date}T12:00:00Z`); nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: "TEMPLATE", text: training.title,
    dates: `${training.date.replace(/-/g, "")}/${nextDay.toISOString().slice(0, 10).replace(/-/g, "")}`,
    details: `${training.description}\n${detailUrl}`, location: training.mode === "online" ? detailUrl : training.location, ctz: "Europe/Istanbul" })}`;
}
