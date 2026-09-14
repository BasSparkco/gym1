import { All, Controller, Logger, Param, Req, Res } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { MinioService } from '../../minio/minio.service';

const MAX_REQUEST_BYTES = 10 * 1024 * 1024; // 10 MiB
const MAX_TENANT_TOTAL_BYTES = 100 * 1024 * 1024; // 100 MiB
const REDACTED_HEADERS = new Set(['authorization', 'cookie', 'proxy-authorization']);

/**
 * Diagnostic-only receiver for the InBody 270's "administrator server" push
 * (device Setup screen, editable URL). We don't know the device's request
 * format yet, so this captures everything unchanged instead of parsing it —
 * see inbody.md for the full plan. Never enabled for a tenant unless that
 * tenant has actually bought the InBody add-on and we've generated their
 * secret (see scripts/enable-inbody-capture.ts) — this is deliberately not
 * a TenantSettings toggle a tenant can flip for themselves.
 *
 * Raw body capture happens in main.ts, before Nest's default body parser
 * touches this path (same technique as bas-ip-link.controller.ts), so
 * malformed JSON/XML/binary/empty bodies all arrive here unchanged as
 * req.rawCaptureBody.
 */
@Controller('inbody-capture')
export class InbodyCaptureController {
  private readonly logger = new Logger(InbodyCaptureController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  @All(':secret')
  async capture(
    @Param('secret') secret: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const capture = await this.prisma.inbodyCapture.findUnique({ where: { secret } });
    if (!capture || !capture.enabled) {
      // Same response whether the secret is wrong or just disabled — don't
      // let this route distinguish the two for an unauthenticated caller.
      res.status(404).send('Not found');
      return;
    }

    const body: Buffer = (req as Request & { rawCaptureBody?: Buffer }).rawCaptureBody ?? Buffer.alloc(0);
    if (body.length > MAX_REQUEST_BYTES) {
      res.status(413).send('Payload too large');
      return;
    }

    let objectKey: string | null = null;
    let storageError: string | null = null;

    if (body.length > 0) {
      if (capture.totalBytes + body.length > MAX_TENANT_TOTAL_BYTES) {
        storageError = 'Tenant capture quota exceeded (100 MiB)';
      } else {
        objectKey = `inbody-captures/${capture.tenantId}/${randomUUID()}.bin`;
        try {
          await this.minio.client.putObject(this.minio.getBucket(), objectKey, body, body.length, {
            'Content-Type': 'application/octet-stream',
          });
        } catch (err) {
          objectKey = null;
          storageError = (err as Error).message;
        }
      }
    }

    try {
      await this.prisma.$transaction([
        this.prisma.inbodyCaptureRequest.create({
          data: {
            tenantId: capture.tenantId,
            method: req.method,
            path: '/api/inbody-capture/[secret]',
            query: req.query as object,
            headers: this.redactHeaders(req.headers as Record<string, string | string[] | undefined>),
            contentType: req.headers['content-type'] ?? null,
            bodyLength: body.length,
            objectKey,
            storageError,
          },
        }),
        ...(objectKey
          ? [
              this.prisma.inbodyCapture.update({
                where: { tenantId: capture.tenantId },
                data: { totalBytes: { increment: body.length } },
              }),
            ]
          : []),
      ]);
    } catch (err) {
      this.logger.error(`Failed to persist capture metadata: ${(err as Error).message}`);
      res.status(500).send('Storage failed');
      return;
    }

    if (storageError) {
      this.logger.error(`inbody-capture storage failed for tenant ${capture.tenantId}: ${storageError}`);
      res.status(500).send('Storage failed');
      return;
    }

    if (req.method === 'HEAD') {
      res.status(200).end();
      return;
    }
    res.status(200).type('text/plain').send('OK');
  }

  private redactHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string | string[]> {
    const redacted: Record<string, string | string[]> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (value === undefined) continue;
      redacted[key] = REDACTED_HEADERS.has(key.toLowerCase()) ? '[redacted]' : value;
    }
    return redacted;
  }
}
