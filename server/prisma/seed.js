import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
  const email = `${roleName.toLowerCase()}@demo.local`;
  const user = await prisma.user.upsert({
    where: { email },
    update: { isBlocked: false },
    create: { email, firstName, lastName, location: "Dhaka" },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });
  return prisma.user.findUnique({ where: { id: user.id }, include: { roles: { include: { role: true } } } });
}

async function evaluationUser(roleName, { emailVariable, passwordVariable, defaultEmail, firstName, lastName }) {
  if (process.env.EVALUATION_LOGIN_ENABLED?.toLowerCase() !== "true") return null;
  const email = String(process.env[emailVariable] || defaultEmail).trim().toLowerCase();
  const password = String(process.env[passwordVariable] || "");
  if (password.length < 12) throw new Error(`${passwordVariable} must contain at least 12 characters.`);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && !existing.isEvaluationAccount) {
    throw new Error(`${emailVariable} belongs to a normal user. Choose a dedicated evaluation email.`);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = existing
    ? await prisma.user.update({
      where: { id: existing.id },
      data: { firstName, lastName, passwordHash, isEvaluationAccount: true, isBlocked: false },
    })
    : await prisma.user.create({
      data: { email, firstName, lastName, location: "Evaluation workspace", passwordHash, isEvaluationAccount: true },
    });
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  await prisma.userRole.deleteMany({ where: { userId: user.id } });
  await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
  return user;
}

async function main() {
  for (const name of roles) await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  const [candidate, recruiter] = await Promise.all([
    demoUser("CANDIDATE", "Amina", "Rahman"),
    demoUser("RECRUITER", "Rafi", "Ahmed"),
    demoUser("ADMIN", "System", "Administrator"),
  ]);
  await evaluationUser("ADMIN", {
    emailVariable: "EVALUATION_ADMIN_EMAIL",
    passwordVariable: "EVALUATION_ADMIN_PASSWORD",
    defaultEmail: "reviewer-admin@cvforge.demo",
    firstName: "Evaluation",
    lastName: "Administrator",
  });
  await evaluationUser("RECRUITER", {
    emailVariable: "EVALUATION_RECRUITER_EMAIL",
    passwordVariable: "EVALUATION_RECRUITER_PASSWORD",
    defaultEmail: "reviewer-recruiter@cvforge.demo",
    firstName: "Evaluation",
    lastName: "Recruiter",
  });
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
  const publishedCv = await prisma.cv.upsert({ where: { userId_positionId: { userId: candidate.id, positionId: position.id } }, update: { status: "PUBLISHED", publishedAt: new Date() }, create: { userId: candidate.id, positionId: position.id, status: "PUBLISHED", publishedAt: new Date(), projects: { create: { projectId: project.id } } } });
  const draftPosition = await prisma.position.upsert({
    where: { id: "demo-frontend-developer" },
    update: {},
    create: {
      id: "demo-frontend-developer",
      title: "Frontend Developer",
      company: "ITransition Demo",
      level: "JUNIOR",
      description: "Build accessible user interfaces for a growing product team.",
      isPublic: false,
      maxProjects: 2,
      attributes: {
        create: ["Professional Summary", "Remote Work"].map((name, sortOrder) => ({ attributeId: saved[name].id, sortOrder })),
      },
      accessRules: {
        create: { attributeId: saved["Remote Work"].id, operator: "IS_TRUE", expected: "true" },
      },
      tags: { create: [{ tagId: tags.react.id }, { tagId: tags["node.js"].id }] },
    },
  });
  await prisma.cv.upsert({
    where: { userId_positionId: { userId: candidate.id, positionId: draftPosition.id } },
    update: { status: "DRAFT", publishedAt: null },
    create: { userId: candidate.id, positionId: draftPosition.id, status: "DRAFT", projects: { create: { projectId: project.id } } },
  });
  await prisma.discussionPost.upsert({
    where: { id: "demo-discussion-welcome" },
    update: {},
    create: { id: "demo-discussion-welcome", positionId: position.id, authorId: recruiter.id, content: "Please highlight measurable outcomes in your project examples." },
  });
  await prisma.cvLike.upsert({
    where: { cvId_userId: { cvId: publishedCv.id, userId: recruiter.id } },
    update: {},
    create: { cvId: publishedCv.id, userId: recruiter.id },
  });
  console.log("PostgreSQL database seeded with evaluation-ready sample data.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
