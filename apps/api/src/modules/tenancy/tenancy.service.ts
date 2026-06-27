import { Injectable, InternalServerErrorException } from '@nestjs/common';

const SPARKCO_API_KEY = process.env.SPARKCO_API_KEY;
const SPARKCO_BASE_URL = process.env.SPARKCO_API_URL ?? 'https://api.sparkco.vip/api/v1';

async function sparkcoFetch(path: string, method = 'GET') {
  if (!SPARKCO_API_KEY) {
    throw new InternalServerErrorException('SparkCo is not configured (set SPARKCO_API_KEY).');
  }
  const res = await fetch(`${SPARKCO_BASE_URL}${path}`, {
    method,
    headers: { 'X-API-Key': SPARKCO_API_KEY },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new InternalServerErrorException(`SparkCo error ${res.status}: ${text}`);
  }
  return res.json();
}

@Injectable()
export class TenancyService {
  // Branch-scoped WhatsApp (sessionId = branchId)
  connectBranchWhatsApp(branchId: string) {
    return sparkcoFetch(`/me/providers/whatsapp?sessionId=${encodeURIComponent(branchId)}`, 'PUT');
  }

  getBranchWhatsAppQr(branchId: string) {
    return sparkcoFetch(`/me/providers/whatsapp/qr?sessionId=${encodeURIComponent(branchId)}`);
  }

  verifyBranchWhatsApp(branchId: string) {
    return sparkcoFetch(`/me/providers/whatsapp/verify?sessionId=${encodeURIComponent(branchId)}`, 'POST');
  }

  disconnectBranchWhatsApp(branchId: string) {
    return sparkcoFetch(`/me/providers/whatsapp?sessionId=${encodeURIComponent(branchId)}`, 'DELETE');
  }
}
