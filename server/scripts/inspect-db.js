import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const tables = await prisma.$queryRaw`
    SELECT tablename AS name
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  const rows = [];
  for (const { name } of tables) {
    const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS count FROM "${name.replaceAll('"', '""')}"`);
    rows.push({ table: name, rows: Number(result[0].count) });
  }
  console.table(rows);
} finally {
  await prisma.$disconnect();
}
