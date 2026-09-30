const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(
  path.resolve(
    __dirname,
    '../prisma/migrations/20260930090000_reconcile_schema_history/migration.sql',
  ),
  'utf8',
);

for (const requiredFragment of [
  'ADD COLUMN "isPublic"',
  'ADD COLUMN "data" BYTEA',
  'ADD COLUMN "actorEmail"',
  'ALTER COLUMN "userId" DROP NOT NULL',
  'ON DELETE SET NULL',
]) {
  assert.ok(migration.includes(requiredFragment), `Missing migration change: ${requiredFragment}`);
}

for (const destructivePattern of [
  /DROP\s+TABLE/i,
  /DROP\s+COLUMN/i,
  /TRUNCATE/i,
  /DELETE\s+FROM/i,
  /UPDATE\s+"?(User|Teacher|Student)"?/i,
]) {
  assert.doesNotMatch(migration, destructivePattern);
}

console.log('Schema-history reconciliation migration safety checks passed.');
