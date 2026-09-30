const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..');
const migrationPath = path.join(
  backendRoot,
  'prisma',
  'migrations',
  '20260930080000_add_school_rbac_foundation',
  'migration.sql',
);
const schemaPath = path.join(backendRoot, 'prisma', 'schema.prisma');

const migration = fs.readFileSync(migrationPath, 'utf8');
const schema = fs.readFileSync(schemaPath, 'utf8');

for (const table of [
  'SchoolRole',
  'Permission',
  'SchoolRolePermission',
  'UserSchoolRole',
  'UserSchoolRoleDepartment',
]) {
  assert.match(migration, new RegExp(`CREATE TABLE "${table}"`));
}

for (const destructivePattern of [
  /DROP\s+(TABLE|COLUMN|TYPE)/i,
  /TRUNCATE/i,
  /DELETE\s+FROM/i,
  /UPDATE\s+"?(User|Teacher|Admin)"?/i,
]) {
  assert.doesNotMatch(migration, destructivePattern);
}

// Compatibility fields must remain until a later, separately approved phase.
assert.match(schema, /role\s+Role\s+@default\(STUDENT\)/);
assert.match(schema, /portalAccess\s+Role\[\]\s+@default\(\[\]\)/);
assert.match(schema, /staffTitle\s+StaffTitle\?/);

console.log('RBAC migration safety checks passed.');
