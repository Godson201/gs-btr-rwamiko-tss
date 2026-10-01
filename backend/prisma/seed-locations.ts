import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// `__dirname` points to dist/prisma in the production image, while the CSV is
// copied to /app/prisma/seed-data. Resolving from the application root works
// for ts-node locally and for compiled JavaScript in Docker.
const CSV_PATH = join(process.cwd(), 'prisma', 'seed-data', 'rwanda-locations.csv');
const BATCH_SIZE = 1000;

function parseCsv(raw: string): { id: string; province: string; district: string; sector: string; cell: string; village: string }[] {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const [, ...rows] = lines; // drop header

  return rows.map((line) => {
    const [id, province, district, sector, cell, village] = line.split(',');
    return { id, province, district, sector, cell, village };
  });
}

async function main() {
  const raw = readFileSync(CSV_PATH, 'utf-8');
  const rows = parseCsv(raw);
  console.log(`Parsed ${rows.length} location rows from ${CSV_PATH}`);

  const existing = await prisma.location.count();
  if (existing >= rows.length) {
    console.log(`Rwanda locations already available (${existing} rows); import skipped.`);
    return;
  }

  let created = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const result = await prisma.location.createMany({ data: batch, skipDuplicates: true });
    created += result.count;
    console.log(`Inserted batch ${i / BATCH_SIZE + 1}/${Math.ceil(rows.length / BATCH_SIZE)} (${result.count} new rows)`);
  }

  const total = await prisma.location.count();
  console.log(`Done. ${created} locations created; ${total} total location rows available.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
