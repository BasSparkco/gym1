/**
 * One-time bootstrap for the hidden platform-admin login (the operator's own
 * account for onboarding new tenants at /platform-admin — see
 * PlatformAdminModule). There's no self-serve signup by design; run this once
 * per operator account you want to exist.
 *
 * Run with (build first, same as the other one-off scripts in this folder):
 *   pnpm --filter api exec nest build
 *   node --env-file=.env apps/api/dist/scripts/create-platform-admin.js "Your Name" you@example.com 'a-strong-password'
 */

import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { hashPassword } from '../common/password';

async function main() {
  const [name, email, password] = process.argv.slice(2);

  if (!name || !email?.includes('@') || !password || password.length < 6) {
    throw new Error(
      'Usage: create-platform-admin.js "Full Name" you@example.com <password (min 6 chars)>',
    );
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.platformAdmin.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new Error(`A platform admin with email ${normalizedEmail} already exists.`);
    }

    await prisma.platformAdmin.create({
      data: {
        id: randomUUID(),
        email: normalizedEmail,
        name: name.trim(),
        passwordHash: hashPassword(password),
      },
    });

    console.log(`Created platform admin ${normalizedEmail}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
