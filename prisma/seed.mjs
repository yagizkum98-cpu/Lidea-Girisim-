import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultPassword = process.env.SEED_DEFAULT_PASSWORD;

if (!defaultPassword) {
  throw new Error("SEED_DEFAULT_PASSWORD must be set before seeding.");
}

async function main() {
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const [admin, evaluator, mentor, jury] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@lidea.local" },
      update: {},
      create: {
        name: "Lidea Admin",
        email: "admin@lidea.local",
        passwordHash,
        role: "SUPER_ADMIN",
      },
    }),
    prisma.user.upsert({
      where: { email: "degerlendirici@lidea.local" },
      update: {},
      create: {
        name: "Demo Degerlendirici",
        email: "degerlendirici@lidea.local",
        passwordHash,
        role: "EVALUATOR",
      },
    }),
    prisma.user.upsert({
      where: { email: "mentor@lidea.local" },
      update: {},
      create: {
        name: "Demo Mentor",
        email: "mentor@lidea.local",
        passwordHash,
        role: "MENTOR",
      },
    }),
    prisma.user.upsert({
      where: { email: "juri@lidea.local" },
      update: {},
      create: {
        name: "Demo Juri",
        email: "juri@lidea.local",
        passwordHash,
        role: "JURY",
      },
    }),
  ]);

  const program = await prisma.program.upsert({
    where: { id: "program-3" },
    update: {
      status: "APPLICATIONS_OPEN",
      applicationOpen: true,
    },
    create: {
      id: "program-3",
      name: "Lidea Girisim Programi",
      period: "3. Donem",
      description: "Girisimlerin basvuru, degerlendirme ve mentor takip sureci.",
      quota: 40,
      status: "APPLICATIONS_OPEN",
      applicationOpen: true,
      applicationStart: new Date("2026-09-01T09:00:00.000Z"),
      applicationDeadline: new Date("2026-12-31T20:59:59.000Z"),
      stages: {
        create: [
          { title: "Basvuru", order: 1, active: true },
          { title: "On Degerlendirme", order: 2, active: true },
          { title: "Mentorluk", order: 3, active: true },
          { title: "Demo Day", order: 4, active: true },
        ],
      },
    },
  });

  const application = await prisma.application.upsert({
    where: { applicationNo: "LID-DEMO-001" },
    update: {},
    create: {
      applicationNo: "LID-DEMO-001",
      programId: program.id,
      userId: admin.id,
      founder: "Ayse Demir",
      email: "ayse@example.com",
      phone: "+90 555 000 00 00",
      startupName: "Akilli Tarim",
      sector: "AgriTech",
      city: "Mugla",
      stage: "MVP",
      website: "https://example.com",
      teamSize: 3,
      problem: "Kucuk ureticiler sulama ve verim takibini manuel yapiyor.",
      solution: "Sensor verisiyle sulama onerisi veren sade bir takip paneli.",
      targetMarket: "Kucuk ve orta olcekli tarim isletmeleri.",
      businessModel: "Aylik abonelik ve cihaz kurulumu.",
      status: "UNDER_REVIEW",
      score: 72,
      assignments: {
        create: {
          evaluatorId: evaluator.id,
          dueDate: new Date("2026-10-15T20:59:59.000Z"),
        },
      },
    },
  });

  const startup = await prisma.startup.upsert({
    where: { applicationId: application.id },
    update: {},
    create: {
      applicationId: application.id,
      programId: program.id,
      ownerId: admin.id,
      name: application.startupName,
      slug: "akilli-tarim",
      sector: application.sector,
      stage: application.stage,
      website: application.website,
      problem: application.problem,
      solution: application.solution,
      businessModel: application.businessModel,
      progress: 35,
      mentorTasks: {
        create: {
          mentorId: mentor.id,
          expertise: "Urun ve pazar dogrulama",
          primary: true,
          targetMeetingCount: 4,
        },
      },
    },
  });

  await prisma.jurySession.upsert({
    where: { id: "jury-demo-day-1" },
    update: {},
    create: {
      id: "jury-demo-day-1",
      programId: program.id,
      title: "Demo Day On Juri",
      startsAt: new Date("2026-11-20T10:00:00.000Z"),
      assignments: {
        create: { juryId: jury.id },
      },
      evaluations: {
        create: {
          startupId: startup.id,
          juryId: jury.id,
          total: 80,
          comment: "Demo veri kaydi.",
        },
      },
    },
  });

  await prisma.notification.upsert({
    where: { id: "notification-welcome" },
    update: {},
    create: {
      id: "notification-welcome",
      title: "Platform hazir",
      message: "MongoDB altyapisi ve demo verileri kuruldu.",
      type: "ANNOUNCEMENT",
      status: "SENT",
      sentAt: new Date(),
      recipients: {
        create: [{ email: admin.email, userId: admin.id, role: admin.role }],
      },
    },
  });

  console.log(`Seed completed. Login users use password: ${defaultPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
