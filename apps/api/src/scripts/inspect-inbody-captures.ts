/**
 * Admin tool for looking at what the InBody 270 actually sent during a
 * capture trial (see inbody.md and enable-inbody-capture.ts). Metadata
 * lives in Postgres; raw bodies live in MinIO under
 * inbody-captures/<tenantId>/<id>.bin.
 *
 * Usage (build-then-run pattern, see backfill-member-debt.ts):
 *   pnpm --filter api exec nest build
 *   node --env-file=.env apps/api/dist/scripts/inspect-inbody-captures.js list <tenantId>
 *   node --env-file=.env apps/api/dist/scripts/inspect-inbody-captures.js fetch <requestId> <outFile>
 */

import { writeFile } from 'node:fs/promises';
import { PrismaPg } from '@prisma/adapter-pg';
import { Client as MinioClient } from 'minio';
import { PrismaClient } from '../generated/prisma/client';

function minioClient(): { client: MinioClient; bucket: string } {
  const client = new MinioClient({
    endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ROOT_USER!,
    secretKey: process.env.MINIO_ROOT_PASSWORD!,
  });
  return { client, bucket: process.env.MINIO_BUCKET ?? 'member-photos' };
}

async function list(prisma: PrismaClient, tenantId: string) {
  const requests = await prisma.inbodyCaptureRequest.findMany({
    where: { tenantId },
    orderBy: { receivedAt: 'desc' },
    take: 200,
  });
  if (requests.length === 0) {
    console.log('No captured requests for this tenant yet.');
    return;
  }
  for (const r of requests) {
    const flag = r.storageError ? ` [STORAGE ERROR: ${r.storageError}]` : '';
    console.log(
      `${r.receivedAt.toISOString()}  ${r.method.padEnd(6)} ${r.bodyLength}b  ${r.contentType ?? '(no content-type)'}  id=${r.id}${flag}`,
    );
  }
  console.log(`\n${requests.length} request(s). Use "fetch <requestId> <outFile>" to pull a raw body, or query InbodyCaptureRequest.headers/query directly in Postgres for full metadata.`);
}

async function fetchBody(prisma: PrismaClient, requestId: string, outFile: string) {
  const row = await prisma.inbodyCaptureRequest.findUnique({ where: { id: requestId } });
  if (!row) {
    console.error(`No captured request with id ${requestId}.`);
    process.exit(1);
  }
  if (!row.objectKey) {
    console.error(`Request ${requestId} has no stored body (empty body, or storage failed: ${row.storageError ?? 'n/a'}).`);
    process.exit(1);
  }

  const { client, bucket } = minioClient();
  const stream = await client.getObject(bucket, row.objectKey);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  await writeFile(outFile, Buffer.concat(chunks));
  console.log(`Wrote ${row.bodyLength} bytes to ${outFile}`);
  console.log(`Headers: ${JSON.stringify(row.headers, null, 2)}`);
  console.log(`Query: ${JSON.stringify(row.query, null, 2)}`);
}

async function main() {
  const [mode, ...rest] = process.argv.slice(2);
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    if (mode === 'list' && rest[0]) {
      await list(prisma, rest[0]);
    } else if (mode === 'fetch' && rest[0] && rest[1]) {
      await fetchBody(prisma, rest[0], rest[1]);
    } else {
      console.error('Usage:');
      console.error('  node dist/scripts/inspect-inbody-captures.js list <tenantId>');
      console.error('  node dist/scripts/inspect-inbody-captures.js fetch <requestId> <outFile>');
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
