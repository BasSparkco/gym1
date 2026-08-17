import { PrismaService } from '../../prisma/prisma.service';

// A branch's WhatsApp "sessionId" is normally just its own id. But a
// non-main branch can opt to reuse its tenant's main branch's connected
// number instead (Branch.useMainBranchWhatsapp) — this resolves the id that
// should actually be sent to SparkCo for a given branch.
export async function resolveWhatsAppSessionBranchId(
  prisma: PrismaService,
  branchId: string,
): Promise<string> {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { tenantId: true, isMain: true, useMainBranchWhatsapp: true },
  });
  if (!branch || branch.isMain || !branch.useMainBranchWhatsapp) {
    return branchId;
  }

  const mainBranch = await prisma.branch.findFirst({
    where: { tenantId: branch.tenantId, isMain: true },
    select: { id: true },
  });
  return mainBranch?.id ?? branchId;
}
