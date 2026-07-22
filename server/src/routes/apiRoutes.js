import { Router } from "express";
import { randomUUID } from "node:crypto";
import prisma from "../config/database.js";
import { requireAuthentication } from "../middleware/authenticate.js";
import { requireAnyRole } from "../middleware/authorize.js";
import { asArray, cleanText, conflict, hasRole, positionAccessible, unique } from "../utils/domain.js";
import { formatUser } from "../controllers/authController.js";

const router = Router();
const attributeInclude = { options: { orderBy: { sortOrder: "asc" } } };
const positionInclude = {
  attributes: { include: { attribute: { include: attributeInclude } }, orderBy: { sortOrder: "asc" } },
  accessRules: { include: { attribute: true } },
  tags: { include: { tag: true } },
  _count: { select: { cvs: true, posts: true } },
};
const projectInclude = { tags: { include: { tag: true } } };

async function tagsConnect(names) {
  const cleaned = unique(asArray(names).map((name) => cleanText(name, 40).toLowerCase()));
  if (!cleaned.length) return [];
  const values = cleaned.flatMap((name) => [randomUUID(), name]);
  const placeholders = cleaned.map(() => "(?, ?)").join(", ");
  await prisma.$executeRawUnsafe(`INSERT OR IGNORE INTO "TechnologyTag" ("id", "name") VALUES ${placeholders}`, ...values);
  const tags = await prisma.technologyTag.findMany({ where: { name: { in: cleaned } } });
  return tags.map((tag) => ({ tagId: tag.id }));
}

async function candidateValues(userId) {
  return prisma.profileAttributeValue.findMany({ where: { userId } });
}

async function fullTextPositionIds(query) {
  const tokens = cleanText(query, 100).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (!tokens.length) return null;
  const expression = tokens.map((token) => `"${token.replaceAll('"', '""')}"*`).join(" AND ");
  const matches = await prisma.$queryRawUnsafe('SELECT "id" FROM "PositionSearch" WHERE "PositionSearch" MATCH ? LIMIT 100', expression);
  return matches.map((item) => item.id);
}

async function visiblePosition(position, user) {
  return positionAccessible(position, user ? await candidateValues(user.id) : [], user);
}

function positionPayload(body) {
  return {
    title: cleanText(body.title, 120), description: cleanText(body.description), company: cleanText(body.company, 120),
    level: body.level || null, isPublic: body.isPublic !== false, maxProjects: Math.max(0, Math.min(10, Number(body.maxProjects) || 0)),
  };
}

// Public dashboard, positions and global search.
router.get("/dashboard", async (_request, response, next) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [latest, popular, tags, positions, candidates, recruiters, submitted, recentCvs] = await Promise.all([
      prisma.position.findMany({ take: 8, orderBy: { updatedAt: "desc" }, include: { _count: { select: { cvs: true } } } }),
      prisma.position.findMany({ take: 5, orderBy: { cvs: { _count: "desc" } }, include: { _count: { select: { cvs: true } } } }),
      prisma.technologyTag.findMany({ take: 30, include: { _count: { select: { projects: true, positions: true } } }, orderBy: { name: "asc" } }),
      prisma.position.count(),
      prisma.userRole.count({ where: { role: { name: "CANDIDATE" } } }),
      prisma.userRole.count({ where: { role: { name: "RECRUITER" } } }),
      prisma.cv.count({ where: { status: "PUBLISHED" } }),
      prisma.cv.count({ where: { createdAt: { gte: since } } }),
    ]);
    response.json({ success: true, data: { latest, popular, tags, stats: { positions, candidates, recruiters, submitted, recentCvs } } });
  } catch (error) { next(error); }
});

router.get("/positions", async (request, response, next) => {
  try {
    const query = cleanText(request.query.q, 100);
    const ids = query ? await fullTextPositionIds(query) : null;
    const rows = await prisma.position.findMany({
      where: ids ? { id: { in: ids } } : {},
      orderBy: { updatedAt: "desc" }, include: positionInclude, take: 100,
    });
    const values = request.user ? await candidateValues(request.user.id) : [];
    const data = rows.filter((row) => positionAccessible(row, values, request.user));
    response.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get("/positions/:id", async (request, response, next) => {
  try {
    const position = await prisma.position.findUnique({ where: { id: request.params.id }, include: positionInclude });
    if (!position || !(await visiblePosition(position, request.user))) return response.status(404).json({ success: false, message: "Position not found or unavailable." });
    response.json({ success: true, data: position });
  } catch (error) { next(error); }
});

router.get("/search", async (request, response, next) => {
  try {
    const q = cleanText(request.query.q, 100);
    if (q.length < 2) return response.json({ success: true, data: { positions: [], cvs: [], users: [] } });
    const positionIds = await fullTextPositionIds(q);
    const positions = await prisma.position.findMany({ where: { id: { in: positionIds || [] } }, take: 20, orderBy: { updatedAt: "desc" }, include: positionInclude });
    const values = request.user ? await candidateValues(request.user.id) : [];
    const visible = positions.filter((item) => positionAccessible(item, values, request.user));
    let cvs = [], users = [];
    if (hasRole(request.user, "RECRUITER", "ADMIN")) {
      cvs = await prisma.cv.findMany({ where: { status: "PUBLISHED", OR: [{ position: { title: { contains: q } } }, { user: { firstName: { contains: q } } }, { user: { lastName: { contains: q } } }] }, take: 20, include: { position: true, user: true, _count: { select: { likes: true } } } });
      users = await prisma.user.findMany({ where: { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { email: { contains: q } }] }, take: 20, select: { id: true, firstName: true, lastName: true, photoUrl: true } });
    }
    response.json({ success: true, data: { positions: visible, cvs, users } });
  } catch (error) { next(error); }
});

// Attribute library.
router.get("/attributes", requireAuthentication, async (request, response, next) => {
  try {
    const q = cleanText(request.query.q, 100); const category = request.query.category;
    const where = { ...(q ? { name: { startsWith: q } } : {}), ...(category ? { category } : {}) };
    response.json({ success: true, data: await prisma.attributeDefinition.findMany({ where, include: attributeInclude, orderBy: [{ usageCount: "desc" }, { name: "asc" }], take: 100 }) });
  } catch (error) { next(error); }
});

router.post("/attributes", requireAuthentication, requireAnyRole("RECRUITER", "ADMIN"), async (request, response, next) => {
  try {
    const data = { name: cleanText(request.body.name, 100), description: cleanText(request.body.description, 1000), category: request.body.category, type: request.body.type,
      options: { create: unique(asArray(request.body.options).map((x) => cleanText(x, 100))).map((label, sortOrder) => ({ label, sortOrder })) } };
    if (!data.name) return response.status(400).json({ success: false, message: "Name is required." });
    response.status(201).json({ success: true, data: await prisma.attributeDefinition.create({ data, include: attributeInclude }) });
  } catch (error) { next(error); }
});

router.put("/attributes/:id", requireAuthentication, requireAnyRole("RECRUITER", "ADMIN"), async (request, response, next) => {
  try {
    const current = await prisma.attributeDefinition.findUnique({ where: { id: request.params.id } });
    if (!current) return response.status(404).json({ success: false, message: "Attribute not found." });
    if (current.version !== Number(request.body.version)) return conflict(response, "Attribute");
    const data = { name: cleanText(request.body.name, 100), description: cleanText(request.body.description, 1000), category: request.body.category, type: request.body.type, version: { increment: 1 },
      options: { deleteMany: {}, create: unique(asArray(request.body.options).map((x) => cleanText(x, 100))).map((label, sortOrder) => ({ label, sortOrder })) } };
    response.json({ success: true, data: await prisma.attributeDefinition.update({ where: { id: current.id }, data, include: attributeInclude }) });
  } catch (error) { next(error); }
});

router.delete("/attributes/:id", requireAuthentication, requireAnyRole("RECRUITER", "ADMIN"), async (request, response, next) => {
  try {
    const item = await prisma.attributeDefinition.findUnique({ where: { id: request.params.id }, include: { _count: { select: { positions: true, accessRules: true } } } });
    if (!item) return response.status(204).end();
    if (item.isBuiltIn || item._count.positions || item._count.accessRules) return response.status(409).json({ success: false, message: "Built-in or currently used attributes cannot be deleted." });
    await prisma.attributeDefinition.delete({ where: { id: item.id } }); response.status(204).end();
  } catch (error) { next(error); }
});

// Position management with normalized attributes/rules/tags.
router.post("/positions", requireAuthentication, requireAnyRole("RECRUITER", "ADMIN"), async (request, response, next) => {
  try {
    const attributes = unique(asArray(request.body.attributeIds)); const rules = asArray(request.body.accessRules); const tags = await tagsConnect(request.body.tags);
    const data = { ...positionPayload(request.body), attributes: { create: attributes.map((attributeId, sortOrder) => ({ attributeId, sortOrder })) }, accessRules: { create: rules.map((r) => ({ attributeId: r.attributeId, operator: r.operator, expected: cleanText(r.expected, 200) })) }, tags: { create: tags } };
    if (!data.title) return response.status(400).json({ success: false, message: "Title is required." });
    const created = await prisma.position.create({ data, include: positionInclude });
    await prisma.attributeDefinition.updateMany({ where: { id: { in: attributes } }, data: { usageCount: { increment: 1 } } });
    response.status(201).json({ success: true, data: created });
  } catch (error) { next(error); }
});

router.put("/positions/:id", requireAuthentication, requireAnyRole("RECRUITER", "ADMIN"), async (request, response, next) => {
  try {
    const current = await prisma.position.findUnique({ where: { id: request.params.id } });
    if (!current) return response.status(404).json({ success: false, message: "Position not found." });
    if (current.version !== Number(request.body.version)) return conflict(response, "Position");
    const attributes = unique(asArray(request.body.attributeIds)); const tags = await tagsConnect(request.body.tags);
    const data = { ...positionPayload(request.body), version: { increment: 1 },
      attributes: { deleteMany: {}, create: attributes.map((attributeId, sortOrder) => ({ attributeId, sortOrder })) },
      accessRules: { deleteMany: {}, create: asArray(request.body.accessRules).map((r) => ({ attributeId: r.attributeId, operator: r.operator, expected: cleanText(r.expected, 200) })) },
      tags: { deleteMany: {}, create: tags } };
    response.json({ success: true, data: await prisma.position.update({ where: { id: current.id }, data, include: positionInclude }) });
  } catch (error) { next(error); }
});

router.post("/positions/:id/duplicate", requireAuthentication, requireAnyRole("RECRUITER", "ADMIN"), async (request, response, next) => {
  try {
    const item = await prisma.position.findUnique({ where: { id: request.params.id }, include: positionInclude });
    if (!item) return response.status(404).json({ success: false, message: "Position not found." });
    const data = { title: `${item.title} (Copy)`, description: item.description, company: item.company, level: item.level, isPublic: item.isPublic, maxProjects: item.maxProjects,
      attributes: { create: item.attributes.map((x) => ({ attributeId: x.attributeId, sortOrder: x.sortOrder, required: x.required })) },
      accessRules: { create: item.accessRules.map((x) => ({ attributeId: x.attributeId, operator: x.operator, expected: x.expected })) },
      tags: { create: item.tags.map((x) => ({ tagId: x.tagId })) } };
    response.status(201).json({ success: true, data: await prisma.position.create({ data, include: positionInclude }) });
  } catch (error) { next(error); }
});

router.delete("/positions/:id", requireAuthentication, requireAnyRole("RECRUITER", "ADMIN"), async (request, response, next) => {
  try { await prisma.position.delete({ where: { id: request.params.id } }); response.status(204).end(); } catch (error) { next(error); }
});

// Candidate profile and projects.
router.get("/profile", requireAuthentication, async (request, response, next) => {
  try {
    const id = hasRole(request.user, "ADMIN") && request.query.userId ? request.query.userId : request.user.id;
    if (id !== request.user.id && !hasRole(request.user, "ADMIN")) return response.status(403).json({ success: false, message: "Forbidden." });
    const user = await prisma.user.findUnique({ where: { id }, include: { roles: { include: { role: true } }, attributeValues: { include: { attribute: { include: attributeInclude } }, orderBy: { attribute: { name: "asc" } } }, projects: { include: projectInclude, orderBy: { updatedAt: "desc" } }, cvs: { include: { position: true, _count: { select: { likes: true } } }, orderBy: { updatedAt: "desc" } } } });
    response.json({ success: true, data: { ...formatUser(user), attributeValues: user.attributeValues, projects: user.projects, cvs: user.cvs } });
  } catch (error) { next(error); }
});

router.put("/profile", requireAuthentication, async (request, response, next) => {
  try {
    const id = hasRole(request.user, "ADMIN") && request.body.userId ? request.body.userId : request.user.id;
    const current = await prisma.user.findUnique({ where: { id } });
    if (!current) return response.status(404).json({ success: false, message: "User not found." });
    if (current.version !== Number(request.body.version)) return conflict(response, "Profile");
    const user = await prisma.user.update({ where: { id }, data: { firstName: cleanText(request.body.firstName, 80), lastName: cleanText(request.body.lastName, 80), location: cleanText(request.body.location, 120), photoUrl: cleanText(request.body.photoUrl, 1000) || null, preferredLanguage: request.body.preferredLanguage || current.preferredLanguage, preferredTheme: request.body.preferredTheme || current.preferredTheme, version: { increment: 1 } }, include: { roles: { include: { role: true } } } });
    response.json({ success: true, data: formatUser(user) });
  } catch (error) { next(error); }
});

router.put("/profile/attributes/:attributeId", requireAuthentication, async (request, response, next) => {
  try {
    const id = hasRole(request.user, "ADMIN") && request.body.userId ? request.body.userId : request.user.id;
    const current = await prisma.profileAttributeValue.findUnique({ where: { userId_attributeId: { userId: id, attributeId: request.params.attributeId } } });
    if (current && current.version !== Number(request.body.version)) return conflict(response, "Profile value");
    const item = await prisma.profileAttributeValue.upsert({ where: { userId_attributeId: { userId: id, attributeId: request.params.attributeId } }, update: { value: cleanText(request.body.value, 20000), version: { increment: 1 } }, create: { userId: id, attributeId: request.params.attributeId, value: cleanText(request.body.value, 20000) }, include: { attribute: { include: attributeInclude } } });
    response.json({ success: true, data: item });
  } catch (error) { next(error); }
});

router.delete("/profile/attributes/:attributeId", requireAuthentication, async (request, response, next) => {
  try { const userId = hasRole(request.user, "ADMIN") && request.query.userId ? request.query.userId : request.user.id; await prisma.profileAttributeValue.deleteMany({ where: { userId, attributeId: request.params.attributeId, attribute: { isBuiltIn: false } } }); response.status(204).end(); } catch (error) { next(error); }
});

router.post("/projects", requireAuthentication, async (request, response, next) => {
  try { const tags = await tagsConnect(request.body.tags); const userId = hasRole(request.user, "ADMIN") && request.body.userId ? request.body.userId : request.user.id; const data = { userId, name: cleanText(request.body.name, 160), description: cleanText(request.body.description, 20000), startDate: request.body.startDate ? new Date(request.body.startDate) : null, endDate: request.body.endDate ? new Date(request.body.endDate) : null, tags: { create: tags } }; response.status(201).json({ success: true, data: await prisma.project.create({ data, include: projectInclude }) }); } catch (error) { next(error); }
});

router.put("/projects/:id", requireAuthentication, async (request, response, next) => {
  try { const current = await prisma.project.findUnique({ where: { id: request.params.id } }); if (!current || (current.userId !== request.user.id && !hasRole(request.user, "ADMIN"))) return response.status(404).json({ success: false, message: "Project not found." }); if (current.version !== Number(request.body.version)) return conflict(response, "Project"); const tags = await tagsConnect(request.body.tags); const data = { name: cleanText(request.body.name, 160), description: cleanText(request.body.description, 20000), startDate: request.body.startDate ? new Date(request.body.startDate) : null, endDate: request.body.endDate ? new Date(request.body.endDate) : null, version: { increment: 1 }, tags: { deleteMany: {}, create: tags } }; response.json({ success: true, data: await prisma.project.update({ where: { id: current.id }, data, include: projectInclude }) }); } catch (error) { next(error); }
});

router.delete("/projects/:id", requireAuthentication, async (request, response, next) => {
  try { const current = await prisma.project.findUnique({ where: { id: request.params.id } }); if (!current || (current.userId !== request.user.id && !hasRole(request.user, "ADMIN"))) return response.status(404).json({ success: false, message: "Project not found." }); await prisma.project.delete({ where: { id: current.id } }); response.status(204).end(); } catch (error) { next(error); }
});

router.get("/tags", async (request, response, next) => { try { response.json({ success: true, data: await prisma.technologyTag.findMany({ where: request.query.q ? { name: { startsWith: cleanText(request.query.q, 40).toLowerCase() } } : {}, take: 20, orderBy: { name: "asc" } }) }); } catch (error) { next(error); } });

// CV generation reads live profile values; no duplicated JSON payload is stored.
async function hydrateCv(id, viewer) {
  const cv = await prisma.cv.findUnique({ where: { id }, include: { user: true, position: { include: positionInclude }, projects: { include: { project: { include: projectInclude } }, orderBy: { sortOrder: "asc" } }, likes: true } });
  if (!cv) return null;
  const owner = viewer?.id === cv.userId; const staff = hasRole(viewer, "RECRUITER", "ADMIN");
  if (!owner && (!staff || cv.status !== "PUBLISHED")) return null;
  const values = await prisma.profileAttributeValue.findMany({ where: { userId: cv.userId, attributeId: { in: cv.position.attributes.map((x) => x.attributeId) } }, include: { attribute: { include: attributeInclude } } });
  const byAttribute = new Map(values.map((x) => [x.attributeId, x]));
  const builtIn = { "First Name": cv.user.firstName, "Last Name": cv.user.lastName, Location: cv.user.location, "Personal Photo": cv.user.photoUrl };
  return { ...cv, values: cv.position.attributes.map((x) => ({ attribute: x.attribute, required: x.required, value: x.attribute.isBuiltIn ? builtIn[x.attribute.name] || "" : byAttribute.get(x.attributeId)?.value || "", version: byAttribute.get(x.attributeId)?.version || 0 })), likeCount: cv.likes.length, likedByMe: cv.likes.some((x) => x.userId === viewer?.id), canEdit: owner || hasRole(viewer, "ADMIN") };
}

router.get("/cvs", requireAuthentication, async (request, response, next) => {
  try { const staff = hasRole(request.user, "RECRUITER", "ADMIN"); const where = staff ? { status: "PUBLISHED", ...(request.query.positionId ? { positionId: request.query.positionId } : {}) } : { userId: request.user.id }; response.json({ success: true, data: await prisma.cv.findMany({ where, include: { position: true, user: true, _count: { select: { likes: true } } }, orderBy: { updatedAt: "desc" } }) }); } catch (error) { next(error); }
});

router.post("/cvs", requireAuthentication, requireAnyRole("CANDIDATE", "ADMIN"), async (request, response, next) => {
  try { const position = await prisma.position.findUnique({ where: { id: request.body.positionId }, include: positionInclude }); if (!position || !(await visiblePosition(position, request.user))) return response.status(403).json({ success: false, message: "This position is not accessible." }); const matches = await prisma.project.findMany({ where: { userId: request.user.id, ...(position.tags.length ? { tags: { some: { tagId: { in: position.tags.map((x) => x.tagId) } } } } : {}) }, take: position.maxProjects, orderBy: { updatedAt: "desc" } }); const cv = await prisma.cv.create({ data: { userId: request.user.id, positionId: position.id, projects: { create: matches.map((project, sortOrder) => ({ projectId: project.id, sortOrder })) } } }); response.status(201).json({ success: true, data: await hydrateCv(cv.id, request.user) }); } catch (error) { next(error); }
});

router.get("/cvs/:id", requireAuthentication, async (request, response, next) => { try { const cv = await hydrateCv(request.params.id, request.user); if (!cv) return response.status(404).json({ success: false, message: "CV not found." }); response.json({ success: true, data: cv }); } catch (error) { next(error); } });

router.put("/cvs/:id", requireAuthentication, async (request, response, next) => {
  try { const current = await prisma.cv.findUnique({ where: { id: request.params.id } }); if (!current || (current.userId !== request.user.id && !hasRole(request.user, "ADMIN"))) return response.status(404).json({ success: false, message: "CV not found." }); if (current.version !== Number(request.body.version)) return conflict(response, "CV"); const projectIds = unique(asArray(request.body.projectIds)); const updated = await prisma.cv.update({ where: { id: current.id }, data: { version: { increment: 1 }, projects: { deleteMany: {}, create: projectIds.map((projectId, sortOrder) => ({ projectId, sortOrder })) } } }); response.json({ success: true, data: await hydrateCv(updated.id, request.user) }); } catch (error) { next(error); }
});

router.post("/cvs/:id/publish", requireAuthentication, async (request, response, next) => {
  try { const cv = await hydrateCv(request.params.id, request.user); if (!cv || !cv.canEdit) return response.status(404).json({ success: false, message: "CV not found." }); const missing = cv.values.filter((x) => x.required && !x.value.trim()); if (missing.length) return response.status(422).json({ success: false, message: "Fill every required attribute before publishing.", missing: missing.map((x) => x.attribute.name) }); await prisma.cv.update({ where: { id: cv.id }, data: { status: "PUBLISHED", publishedAt: new Date(), version: { increment: 1 } } }); response.json({ success: true, data: await hydrateCv(cv.id, request.user) }); } catch (error) { next(error); }
});

router.delete("/cvs/:id", requireAuthentication, async (request, response, next) => { try { const cv = await prisma.cv.findUnique({ where: { id: request.params.id } }); if (!cv || (cv.userId !== request.user.id && !hasRole(request.user, "ADMIN"))) return response.status(404).json({ success: false, message: "CV not found." }); await prisma.cv.delete({ where: { id: cv.id } }); response.status(204).end(); } catch (error) { next(error); } });

router.post("/cvs/:id/like", requireAuthentication, requireAnyRole("RECRUITER", "ADMIN"), async (request, response, next) => { try { const key = { cvId_userId: { cvId: request.params.id, userId: request.user.id } }; const existing = await prisma.cvLike.findUnique({ where: key }); if (existing) await prisma.cvLike.delete({ where: key }); else await prisma.cvLike.create({ data: key.cvId_userId }); response.json({ success: true, liked: !existing, count: await prisma.cvLike.count({ where: { cvId: request.params.id } }) }); } catch (error) { next(error); } });

// Discussions are polled by clients every three seconds.
router.get("/positions/:id/posts", requireAuthentication, async (request, response, next) => { try { response.json({ success: true, data: await prisma.discussionPost.findMany({ where: { positionId: request.params.id, ...(request.query.after ? { createdAt: { gt: new Date(request.query.after) } } : {}) }, include: { author: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } }, orderBy: { createdAt: "asc" }, take: 200 }) }); } catch (error) { next(error); } });
router.post("/positions/:id/posts", requireAuthentication, async (request, response, next) => { try { const content = cleanText(request.body.content, 5000); if (!content) return response.status(400).json({ success: false, message: "Post text is required." }); response.status(201).json({ success: true, data: await prisma.discussionPost.create({ data: { positionId: request.params.id, authorId: request.user.id, content }, include: { author: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } } }) }); } catch (error) { next(error); } });

// Administrator user management, driven by selection toolbars in the UI.
router.get("/users/:id/public", requireAuthentication, async (request, response, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: request.params.id }, select: { id: true, firstName: true, lastName: true, location: true, photoUrl: true, cvs: { where: { status: "PUBLISHED" }, include: { position: true, _count: { select: { likes: true } } }, orderBy: { updatedAt: "desc" } } } });
    if (!user) return response.status(404).json({ success: false, message: "User not found." });
    response.json({ success: true, data: user });
  } catch (error) { next(error); }
});
router.get("/users", requireAuthentication, requireAnyRole("ADMIN"), async (_request, response, next) => { try { response.json({ success: true, data: (await prisma.user.findMany({ include: { roles: { include: { role: true } } }, orderBy: { createdAt: "desc" } })).map(formatUser) }); } catch (error) { next(error); } });
router.patch("/users/bulk", requireAuthentication, requireAnyRole("ADMIN"), async (request, response, next) => {
  try {
    const ids = unique(asArray(request.body.ids));
    const action = request.body.action;
    if (!ids.length) return response.status(400).json({ success: false, message: "Select at least one user." });
    if (action === "block" || action === "unblock") {
      await prisma.user.updateMany({ where: { id: { in: ids } }, data: { isBlocked: action === "block" } });
    } else if (action === "delete") {
      await prisma.user.deleteMany({ where: { AND: [{ id: { in: ids } }, { id: { not: request.user.id } }] } });
    } else if (["addRole", "removeRole"].includes(action)) {
      const role = await prisma.role.findUnique({ where: { name: request.body.role } });
      if (!role) return response.status(400).json({ success: false, message: "Invalid role." });
      if (action === "addRole") {
        const existing = await prisma.userRole.findMany({ where: { userId: { in: ids }, roleId: role.id }, select: { userId: true } });
        const present = new Set(existing.map((item) => item.userId));
        const additions = ids.filter((userId) => !present.has(userId)).map((userId) => ({ userId, roleId: role.id }));
        if (additions.length) await prisma.userRole.createMany({ data: additions });
      } else {
        await prisma.userRole.deleteMany({ where: { userId: { in: ids }, roleId: role.id } });
      }
    } else return response.status(400).json({ success: false, message: "Invalid action." });
    response.json({ success: true });
  } catch (error) { next(error); }
});

export default router;
