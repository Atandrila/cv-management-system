import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const tables = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name");
  const rows = [];
  for (const { name } of tables) {
    const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS count FROM "${name.replaceAll('"', '""')}"`);
    rows.push({ table: name, rows: Number(result[0].count) });
  }
  console.table(rows);
} finally {
  await prisma.$disconnect();
}
