/**
 * Jest globalSetup for the e2e suite: points DATABASE_URL at a dedicated test
 * database (separate from local dev's `gym` database) and applies migrations
 * once before the suite runs. Also points REDIS_URL at an isolated DB index
 * on the same Redis instance used for local dev (no second Redis container
 * needed — same one-instance-many-databases approach as Postgres's
 * `gym`/`gym_test` split), and points the MinIO env vars at the same MinIO
 * instance used for local dev, but with a distinct test bucket
 * (member-photos-test) so uploaded test fixtures never mix with dev photos.
 * Runs in Jest's main process before test-file workers are spawned, so
 * setting process.env here is inherited by them.
 */

import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

module.exports = async function globalSetup() {
  const databaseUrl =
    process.env.TEST_DATABASE_URL ??
    'postgresql://gym:gym_dev_password@127.0.0.1:5434/gym_test?schema=public';

  process.env.DATABASE_URL = databaseUrl;

  process.env.REDIS_URL =
    process.env.TEST_REDIS_URL ?? 'redis://127.0.0.1:6381/1';

  process.env.MINIO_ENDPOINT = process.env.TEST_MINIO_ENDPOINT ?? '127.0.0.1';
  process.env.MINIO_PORT = process.env.TEST_MINIO_PORT ?? '9102';
  process.env.MINIO_USE_SSL = 'false';
  process.env.MINIO_ROOT_USER =
    process.env.TEST_MINIO_ROOT_USER ?? 'gym_dev_minio_user';
  process.env.MINIO_ROOT_PASSWORD =
    process.env.TEST_MINIO_ROOT_PASSWORD ?? 'gym_dev_minio_password';
  process.env.MINIO_BUCKET =
    process.env.TEST_MINIO_BUCKET ?? 'member-photos-test';

  execFileSync('node_modules/.bin/prisma', ['migrate', 'deploy'], {
    cwd: join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
};
