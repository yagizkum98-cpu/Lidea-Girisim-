import { db } from "@/lib/db";

export async function createPlatformNotification(input: {
  title: string;
  message: string;
  type: "ANNOUNCEMENT" | "REMINDER" | "STATUS_UPDATE" | "DOCUMENT_TASK" | "EVENT";
  status?: "DRAFT" | "SENT" | "SCHEDULED" | "FAILED";
  recipientEmails: string[];
}) {
  return db.notification.create({
    data: {
      title: input.title,
      message: input.message,
      type: input.type,
      status: input.status || "DRAFT",
      sentAt: input.status === "SENT" ? new Date() : undefined,
      recipients: {
        create: input.recipientEmails.map((email) => ({ email })),
      },
    },
    include: { recipients: true },
  });
}
