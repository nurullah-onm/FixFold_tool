import bcrypt from 'bcrypt';
import prisma from '../src/config/prisma.js';

const username = process.env.SEED_ADMIN_USER || 'admin';
const password = process.env.SEED_ADMIN_PASS || 'admin1234';
const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';

async function main () {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    if (existing.role !== 'ADMIN' || existing.email !== email) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: 'ADMIN',
          email
        }
      });
      // eslint-disable-next-line no-console
      console.log(`Updated existing user "${username}" to ADMIN role and email ${email}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Seed skipped: user "${username}" already exists with ADMIN role`);
    }
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { username, email, passwordHash, role: 'ADMIN' }
  });
  // eslint-disable-next-line no-console
  console.log(`Seeded admin user: ${username} / ${password} (${user.email})`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
