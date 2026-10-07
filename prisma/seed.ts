import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const org = await db.organization.upsert({
    where: { slug: "certiport-learning" },
    update: {},
    create: { name: "CertiPort Learning Co.", slug: "certiport-learning" },
  });

  const passwordHash = await bcrypt.hash("DemoPass123!", 10);

  const [admin, hr, issuer] = await Promise.all([
    db.user.upsert({
      where: { email: "j.fernandes@gttdata.ai" },
      update: {},
      create: { organizationId: org.id, name: "J. Fernandes", email: "j.fernandes@gttdata.ai", passwordHash, role: "ORG_ADMIN", status: "ACTIVE" },
    }),
    db.user.upsert({
      where: { email: "r.okafor@gttdata.ai" },
      update: {},
      create: { organizationId: org.id, name: "R. Okafor", email: "r.okafor@gttdata.ai", passwordHash, role: "HR", status: "ACTIVE" },
    }),
    db.user.upsert({
      where: { email: "devraj.shinde@gttdata.ai" },
      update: {},
      create: { organizationId: org.id, name: "D. Shinde", email: "devraj.shinde@gttdata.ai", passwordHash, role: "CERT_ISSUER", status: "ACTIVE" },
    }),
  ]);

  const template = await db.template.create({
    data: {
      organizationId: org.id,
      name: "Certificate of Merit — SEED",
      type: "CERTIFICATE",
      source: "UPLOADED_IMAGE",
      fieldLayout: [
        { fieldId: "firstName", left: 5.98, top: 44.12, width: 37.32, height: 7.45 },
        { fieldId: "courseName", left: 6.55, top: 56.81, width: 40.46, height: 4.03 },
      ],
    },
  });

  await db.certificate.upsert({
    where: { certificateRef: "MER/2026/UXFN/000214" },
    update: {
      recipientEmail: "ananya.rao@gttdata.ai",
    },
    create: {
      organizationId: org.id,
      templateId: template.id,
      certificateRef: "MER/2026/UXFN/000214",
      recipientName: "Ananya Rao",
      recipientEmail: "ananya.rao@gttdata.ai",
      courseName: "UX Foundations",
      status: "DELIVERED",
      issuedById: admin.id,
      issuedAt: new Date(),
      deliveredAt: new Date(),
    },
  });

  console.log("Seed complete.");
  console.log("Demo login: j.fernandes@gttdata.ai / DemoPass123!  (Org Admin)");
  console.log("Demo login: r.okafor@gttdata.ai / DemoPass123!     (HR)");
  console.log("Demo login: devraj.shinde@gttdata.ai / DemoPass123! (Certificate Issuer)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
