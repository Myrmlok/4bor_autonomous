// Runs once on startup if the DB is empty.
// Creates 3 demo users + 2 demo invite tokens.
import { db } from '@workspace/db';
import { users, inviteTokens } from '@workspace/db/schema';
import { hashPassword } from './hash.js';
import { logger } from './logger.js';

export async function seedIfEmpty() {
  try {
    const existing = await db.select().from(users).limit(1);
    if (existing.length > 0) return;

    logger.info('Empty DB detected — seeding demo accounts');

    const adminHash   = await hashPassword('admin123');
    const demoHash    = await hashPassword('123');

    const [admin, dealer, collector] = await db
      .insert(users)
      .values([
        { login: 'admin',            email: 'admin@4bor.ru',   passwordHash: adminHash, role: 'admin'     },
        { login: 'dealer_ivanov',    email: 'ivanov@4bor.ru',  passwordHash: demoHash,  role: 'dealer'    },
        { login: 'collector_petrov', email: 'petrov@4bor.ru',  passwordHash: demoHash,  role: 'collector' },
      ])
      .returning();

    await db.insert(inviteTokens).values([
      { token: 'dealer-invite-demo2025',    role: 'dealer',    label: 'Дилер (демо)',    createdById: admin!.id },
      { token: 'collector-invite-demo2025', role: 'collector', label: 'Коллекционер (демо)', createdById: admin!.id },
    ]);

    logger.info({ adminId: admin!.id, dealerId: dealer!.id, collectorId: collector!.id }, 'Seed complete');
  } catch (err) {
    logger.error({ err }, 'Seed failed (may already exist)');
  }
}
