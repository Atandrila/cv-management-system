import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const roles = ["CANDIDATE", "RECRUITER", "ADMIN"];
const attributes = [
  { name: "First Name", category: "PERSONAL_INFORMATION", type: "STRING", description: "Legal or preferred first name", isBuiltIn: true },
  { name: "Last Name", category: "PERSONAL_INFORMATION", type: "STRING", description: "Family name", isBuiltIn: true },
  { name: "Location", category: "PERSONAL_INFORMATION", type: "STRING", description: "Current city or region", isBuiltIn: true },
  { name: "Personal Photo", category: "PERSONAL_INFORMATION", type: "IMAGE", description: "Externally hosted profile image", isBuiltIn: true },
  { name: "Professional Summary", category: "EXPERIENCE", type: "TEXT", description: "Markdown-formatted professional introduction" },
  { name: "Years of Experience", category: "EXPERIENCE", type: "NUMERIC", description: "Total relevant professional experience" },
  { name: "English Level", category: "SOFT_SKILLS", type: "SELECT", description: "Working English proficiency", options: ["Beginner", "Intermediate", "Advanced", "Fluent"] },
  { name: "IELTS Score", category: "CERTIFICATION", type: "NUMERIC", description: "Most recent IELTS overall score" },
  { name: "Remote Work", category: "PERSONAL_INFORMATION", type: "BOOLEAN", description: "Available for remote work" },
  { name: "Presentation Skills", category: "SOFT_SKILLS", type: "SELECT", description: "Self-assessed presentation level", options: ["Beginner", "Intermediate", "Advanced"] },
];

async function demoUser(roleName, firstName, lastName) {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  return prisma.user.upsert({ where: { email: `${roleName.toLowerCase()}@demo.local` }, update: {}, create: { email: `${roleName.toLowerCase()}@demo.local`, firstName, lastName, location: "Dhaka", roles: { create: { roleId: role.id } } }, include: { roles: { include: { role: true } } } });
}

async function main() {
  await prisma.$executeRawUnsafe('CREATE VIRTUAL TABLE IF NOT EXISTS "PositionSearch" USING fts5("id" UNINDEXED, "title", "company", "description")');
  await prisma.$executeRawUnsafe('CREATE TRIGGER IF NOT EXISTS "position_search_insert" AFTER INSERT ON "Position" BEGIN INSERT INTO "PositionSearch"("id", "title", "company", "description") VALUES (new."id", new."title", new."company", new."description"); END');
  await prisma.$executeRawUnsafe('CREATE TRIGGER IF NOT EXISTS "position_search_update" AFTER UPDATE ON "Position" BEGIN DELETE FROM "PositionSearch" WHERE "id" = old."id"; INSERT INTO "PositionSearch"("id", "title", "company", "description") VALUES (new."id", new."title", new."company", new."description"); END');
  await prisma.$executeRawUnsafe('CREATE TRIGGER IF NOT EXISTS "position_search_delete" AFTER DELETE ON "Position" BEGIN DELETE FROM "PositionSearch" WHERE "id" = old."id"; END');
  for (const name of roles) await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  const [candidate] = await Promise.all([demoUser("CANDIDATE", "Amina", "Rahman"), demoUser("RECRUITER", "Rafi", "Ahmed"), demoUser("ADMIN", "System", "Administrator")]);
  const saved = {};
  for (const item of attributes) {
    const { options = [], ...data } = item;
    saved[item.name] = await prisma.attributeDefinition.upsert({ where: { name: item.name }, update: data, create: { ...data, options: { create: options.map((label, sortOrder) => ({ label, sortOrder })) } } });
  }
  const sampleValues = { "Professional Summary": "Business analyst focused on clear requirements and measurable outcomes.", "Years of Experience": "4", "English Level": "Advanced", "IELTS Score": "7.5", "Remote Work": "true", "Presentation Skills": "Advanced" };
  for (const [name, value] of Object.entries(sampleValues)) await prisma.profileAttributeValue.upsert({ where: { userId_attributeId: { userId: candidate.id, attributeId: saved[name].id } }, update: { value }, create: { userId: candidate.id, attributeId: saved[name].id, value } });
  const tagNames = ["react", "node.js", "sql", "business-analysis"]; const tags = {};
  for (const name of tagNames) tags[name] = await prisma.technologyTag.upsert({ where: { name }, update: {}, create: { name } });
  const project = await prisma.project.upsert({ where: { id: "demo-project-analysis" }, update: {}, create: { id: "demo-project-analysis", userId: candidate.id, name: "Recruitment Workflow Redesign", description: "Mapped stakeholder needs and delivered a streamlined **recruitment workflow**.", startDate: new Date("2025-01-01"), endDate: new Date("2025-06-30"), tags: { create: [{ tagId: tags["business-analysis"].id }, { tagId: tags.sql.id }] } } });
  const position = await prisma.position.upsert({ where: { id: "demo-business-analyst" }, update: {}, create: { id: "demo-business-analyst", title: "Business Analyst", company: "Northstar Labs", level: "MIDDLE", description: "Turn stakeholder needs into practical product requirements.", maxProjects: 3, attributes: { create: ["Professional Summary", "Years of Experience", "English Level", "IELTS Score", "Presentation Skills"].map((name, sortOrder) => ({ attributeId: saved[name].id, sortOrder })) }, tags: { create: [{ tagId: tags["business-analysis"].id }, { tagId: tags.sql.id }] } } });
  await prisma.$executeRawUnsafe('DELETE FROM "PositionSearch"');
  await prisma.$executeRawUnsafe('INSERT INTO "PositionSearch"("id", "title", "company", "description") SELECT "id", "title", "company", "description" FROM "Position"');
  await prisma.cv.upsert({ where: { userId_positionId: { userId: candidate.id, positionId: position.id } }, update: {}, create: { userId: candidate.id, positionId: position.id, status: "PUBLISHED", publishedAt: new Date(), projects: { create: { projectId: project.id } } } });
  console.log("Local database seeded. Demo logins: candidate, recruiter, and admin.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
