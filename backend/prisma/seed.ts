import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@gsbtrrwamiko.rw';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

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
  } else {
    console.log('Admin user already exists, skipping.');
  }

  const currentYearName = new Date().getFullYear().toString();
  const academicYear = await prisma.academicYear.upsert({
    where: { name: currentYearName },
    update: {},
    create: {
      name: currentYearName,
      startDate: new Date(`${currentYearName}-01-01`),
      endDate: new Date(`${currentYearName}-12-31`),
      isCurrent: true,
    },
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
