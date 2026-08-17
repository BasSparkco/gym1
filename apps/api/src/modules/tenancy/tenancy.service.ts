import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveWhatsAppSessionBranchId } from './whatsapp-session';

const SPARKCO_API_KEY = process.env.SPARKCO_API_KEY;
const SPARKCO_BASE_URL = process.env.SPARKCO_API_URL ?? 'https://api.sparkco.vip/api/v1';

// SparkCo wraps every response as { success, data } | { success: false, error }
// (see COMMUNICATION_SERVICE_MANUAL.md) — callers here want the unwrapped
// payload (e.g. { qr } / { ok, status }), not the envelope.
type SparkcoEnvelope = { success: boolean; data?: unknown; error?: string };

async function sparkcoFetch(path: string, method = 'GET') {
  if (!SPARKCO_API_KEY) {
    throw new InternalServerErrorException('SparkCo is not configured (set SPARKCO_API_KEY).');
  }
  const res = await fetch(`${SPARKCO_BASE_URL}${path}`, {
    method,
    headers: { 'X-API-Key': SPARKCO_API_KEY },
  });
  const payload = (await res.json().catch(() => null)) as SparkcoEnvelope | null;
  if (!res.ok || !payload?.success) {
    throw new InternalServerErrorException(
      `SparkCo error ${res.status}: ${payload?.error ?? res.statusText}`,
    );
  }
  return payload.data;
}

@Injectable()
export class TenancyService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireBranch(branchId: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException('Branch not found.');
    }
    return branch;
  }

  // Branch-scoped WhatsApp (sessionId = branchId) — connect/disconnect only
  // ever act on the branch's own session. A branch sharing its main
  // branch's number manages the connection from the main branch instead.
  async connectBranchWhatsApp(branchId: string) {
    const branch = await this.requireBranch(branchId);
    if (branch.useMainBranchWhatsapp) {
      throw new BadRequestException(
        "This branch uses the main branch's WhatsApp number — connect from the main branch instead.",
      );
    }
    return sparkcoFetch(`/me/providers/whatsapp?sessionId=${encodeURIComponent(branchId)}`, 'PUT');
  }

  async getBranchWhatsAppQr(branchId: string) {
    const sessionId = await resolveWhatsAppSessionBranchId(this.prisma, branchId);
    return sparkcoFetch(`/me/providers/whatsapp/qr?sessionId=${encodeURIComponent(sessionId)}`);
  }

  async verifyBranchWhatsApp(branchId: string) {
    const sessionId = await resolveWhatsAppSessionBranchId(this.prisma, branchId);
    return sparkcoFetch(`/me/providers/whatsapp/verify?sessionId=${encodeURIComponent(sessionId)}`, 'POST');
  }

  async disconnectBranchWhatsApp(branchId: string) {
    const branch = await this.requireBranch(branchId);
    if (branch.useMainBranchWhatsapp) {
      throw new BadRequestException(
        "This branch uses the main branch's WhatsApp number — disconnect from the main branch instead.",
      );
    }
    return sparkcoFetch(`/me/providers/whatsapp?sessionId=${encodeURIComponent(branchId)}`, 'DELETE');
  }

  // Toggles whether a non-main branch sends/receives WhatsApp through its
  // tenant's main branch session instead of its own.
  async setUseMainBranchWhatsapp(branchId: string, use: boolean) {
    const branch = await this.requireBranch(branchId);
    if (branch.isMain) {
      throw new BadRequestException('The main branch cannot use another branch\'s WhatsApp number.');
    }

    if (use) {
      const mainBranch = await this.prisma.branch.findFirst({
        where: { tenantId: branch.tenantId, isMain: true },
      });
      if (!mainBranch) {
        throw new BadRequestException('This organization has no main branch configured.');
      }
      // Best-effort: this branch's own session (if any) stops being
      // reachable via Connect/Disconnect once shared mode is on, so don't
      // leave it dangling half-connected in SparkCo.
      try {
        await sparkcoFetch(`/me/providers/whatsapp?sessionId=${encodeURIComponent(branchId)}`, 'DELETE');
      } catch {
        // No existing session — nothing to clean up.
      }
    }

    return this.prisma.branch.update({
      where: { id: branchId },
      data: { useMainBranchWhatsapp: use },
    });
  }
}
