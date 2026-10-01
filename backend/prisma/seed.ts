import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedRbac } from './rbac-seed';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@gsbtrrwamiko.rw').trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const resetAdminPassword =
    process.env.SEED_ADMIN_RESET_PASSWORD?.trim().toLowerCase() === 'true';

  console.log(
    `Seed admin target: ${adminEmail}; password recovery: ${resetAdminPassword ? 'enabled' : 'disabled'}`,
  );

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'SUPER_ADMIN',
        portalAccess: ['SUPER_ADMIN'],
        admin: { create: { position: 'System Administrator', permissions: [] } },
      },
    });
    console.log(`Seeded admin user: ${adminEmail}`);
  } else if (resetAdminPassword) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        password: hashedPassword,
        isActive: true,
        role: 'SUPER_ADMIN',
        portalAccess: ['SUPER_ADMIN'],
      },
    });
    console.log(`Reset seeded admin password: ${adminEmail}`);
  } else {
    console.log('Admin user already exists; password unchanged.');
  }

  const startYear = new Date().getFullYear();
  const legacyYearName = startYear.toString();
  const currentYearName = `${startYear}-${startYear + 1}`;
  const academicYear = await prisma.$transaction(async (tx) => {
    const current = await tx.academicYear.findUnique({ where: { name: currentYearName } });
    const legacy = current
      ? null
      : await tx.academicYear.findUnique({ where: { name: legacyYearName } });
    const data = {
      name: currentYearName,
      startDate: new Date(`${startYear}-09-01`),
      endDate: new Date(`${startYear + 1}-08-31`),
      isCurrent: true,
    };

    const year = current
      ? await tx.academicYear.update({ where: { id: current.id }, data })
      : legacy
        ? await tx.academicYear.update({ where: { id: legacy.id }, data })
        : await tx.academicYear.create({ data });

    await tx.academicYear.updateMany({
      where: { id: { not: year.id }, isCurrent: true },
      data: { isCurrent: false },
    });
    return year;
  });
  console.log(`Ensured academic year: ${academicYear.name}`);

  const departments = [
    { name: 'Professional Accounting', code: 'ACC' },
    { name: 'Computer Systems and Architecture', code: 'CSA' },
    { name: 'Building Construction', code: 'BCN' },
    { name: 'Software Development', code: 'SOD' },
    { name: 'Network and Internet Technology', code: 'NIT' },
    { name: 'Electrical Technology', code: 'ELT' },
    { name: 'Electronic and Telecommunication Technology', code: 'ETT' },
  ];

  for (const department of departments) {
    await prisma.department.upsert({
      where: { code: department.code },
      update: {},
      create: department,
    });
  }
  console.log(`Ensured ${departments.length} TVET departments.`);

  await seedRbac(prisma);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
