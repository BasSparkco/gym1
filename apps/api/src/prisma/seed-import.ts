/**
 * Inserts parsed seed data into Prisma in FK order. Originally shared with
 * the one-time JSON-store -> Postgres cutover script (removed after the
 * July 2026 migration burned in); now used only by the e2e test reset helper
 * (test/prisma-test-utils.ts).
 */

import { Prisma, PrismaClient } from '../generated/prisma/client';

export type BranchRecord = {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  phone?: string;
  countryCode?: string;
  status: 'active' | 'inactive';
};

export type EmployeeRecord = {
  id: string;
  tenantId: string;
  branchId: string;
  employeeNumber: string;
  fullName: string;
  status: 'active' | 'inactive';
  idNumber?: string;
  phone?: string;
  sex?: 'male' | 'female';
  dateOfBirth?: string;
  job?: string;
  salary?: number;
  workType?: 'fullTime' | 'partTime' | 'trainee';
  startDate?: string;
  endDate?: string;
  isUser?: boolean;
  gateIds?: string[];
};

export type GateRecord = {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  genderRestriction: 'male' | 'female' | null;
  deviceUrl: string;
  deviceUsername: string;
  devicePassword: string;
  lockNumber: number;
  enabled: boolean;
};

export type MemberRecord = {
  id: string;
  tenantId: string;
  homeBranchId: string;
  memberNumber: string;
  fullName: string;
  status?: 'active' | 'inactive';
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  sex?: 'male' | 'female';
  idNumber?: string;
  address?: string;
  joinDate?: string;
  height?: number;
  weight?: number;
  registeredEmployeeId?: string;
  pictureUrl?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  rfidTag?: string;
};

export type MembershipPlanRecord = {
  id: string;
  tenantId: string;
  name: string;
  planType: 'duration' | 'session';
  durationDays?: number;
  sessionCount?: number;
  price: number;
  allowAllBranches: boolean;
  freezeAllowed: boolean;
  freezeMaxDays?: number;
};

export type MembershipRecord = {
  id: string;
  memberId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'frozen' | 'expired' | 'cancelled';
  finalPrice: number;
  previousMembershipId?: string;
};

export type FreezeRecord = {
  id: string;
  membershipId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
};

export type VisitRecord = {
  id: string;
  memberId: string;
  branchId: string;
  checkInTime: string;
  checkOutTime: string | null;
  accessMethod: 'manual' | 'qr' | 'rfid';
  gateId?: string;
};

export type PaymentRecord = {
  id: string;
  tenantId: string;
  branchId: string;
  memberId: string;
  membershipId: string;
  amount: number;
  paymentDate: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'transfer';
};

export type NotificationRecord = {
  id: string;
  tenantId: string;
  memberId: string;
  channel: 'sms' | 'whatsapp' | 'email';
  event?: string;
  relatedId?: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  failedReason?: string;
  createdAt: string;
};

export type OperationsStoreData = {
  reportingDate: string;
  branches: BranchRecord[];
  employees: EmployeeRecord[];
  gates: GateRecord[];
  members: MemberRecord[];
  membershipPlans: MembershipPlanRecord[];
  memberships: MembershipRecord[];
  freezes: FreezeRecord[];
  visits: VisitRecord[];
  payments: PaymentRecord[];
  notifications: NotificationRecord[];
};

export type TenantSettingsRecord = {
  tenantId: string;
  defaultLanguage: string;
  enabledLanguages: string[];
  notificationSettings: unknown;
  notificationSenders: unknown;
  dateFormat: string;
  checkOutTrackingEnabled: boolean;
};

export type SettingsStoreData = {
  tenants: TenantSettingsRecord[];
};

export type StoredUser = {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'front-desk';
  tenant: { id: string; name: string };
  branch: { id: string; name: string };
  passwordHash: string;
};

export type AuthStoreData = {
  users: StoredUser[];
};

function toDate(value: string | undefined | null): Date | undefined {
  return value ? new Date(value) : undefined;
}

const ROLE_MAP: Record<StoredUser['role'], 'owner' | 'manager' | 'frontDesk'> =
  {
    owner: 'owner',
    manager: 'manager',
    'front-desk': 'frontDesk',
  };

/**
 * Inserts the given JSON-store-shaped data into Prisma in FK-dependency
 * order. Derives Tenant rows from the union of every tenantId referenced
 * across the three stores (no formal tenant table exists in the JSON world).
 * Uses `skipDuplicates: true` throughout, so this is safe to call against a
 * database that already has some of these rows.
 */
export async function importJsonDataIntoPrisma(
  prisma: PrismaClient,
  operations: OperationsStoreData,
  settings: SettingsStoreData,
  auth: AuthStoreData,
) {
  const tenantIds = new Set<string>();
  for (const b of operations.branches) tenantIds.add(b.tenantId);
  for (const e of operations.employees) tenantIds.add(e.tenantId);
  for (const g of operations.gates) tenantIds.add(g.tenantId);
  for (const m of operations.members) tenantIds.add(m.tenantId);
  for (const p of operations.membershipPlans) tenantIds.add(p.tenantId);
  for (const p of operations.payments) tenantIds.add(p.tenantId);
  for (const n of operations.notifications) tenantIds.add(n.tenantId);
  for (const t of settings.tenants) tenantIds.add(t.tenantId);
  for (const u of auth.users) tenantIds.add(u.tenant.id);

  const tenantNameById = new Map<string, string>();
  for (const u of auth.users) {
    if (!tenantNameById.has(u.tenant.id)) {
      tenantNameById.set(u.tenant.id, u.tenant.name);
    }
  }

  const tenants = [...tenantIds].map((id) => ({
    id,
    name: tenantNameById.get(id) ?? id,
  }));

  await prisma.tenant.createMany({ data: tenants, skipDuplicates: true });

  await prisma.branch.createMany({
    data: operations.branches.map((b) => ({
      id: b.id,
      tenantId: b.tenantId,
      name: b.name,
      address: b.address,
      phone: b.phone,
      countryCode: b.countryCode,
      status: b.status,
    })),
    skipDuplicates: true,
  });

  await prisma.employee.createMany({
    data: operations.employees.map((e) => ({
      id: e.id,
      tenantId: e.tenantId,
      branchId: e.branchId,
      employeeNumber: e.employeeNumber,
      fullName: e.fullName,
      status: e.status,
      idNumber: e.idNumber,
      phone: e.phone,
      sex: e.sex,
      dateOfBirth: toDate(e.dateOfBirth),
      job: e.job,
      salary: e.salary,
      workType: e.workType,
      startDate: toDate(e.startDate),
      endDate: toDate(e.endDate),
      isUser: e.isUser ?? false,
    })),
    skipDuplicates: true,
  });

  await prisma.gate.createMany({
    data: operations.gates.map((g) => ({
      id: g.id,
      tenantId: g.tenantId,
      branchId: g.branchId,
      name: g.name,
      genderRestriction: g.genderRestriction ?? null,
      deviceUrl: g.deviceUrl,
      deviceUsername: g.deviceUsername,
      devicePassword: g.devicePassword,
      lockNumber: g.lockNumber,
      enabled: g.enabled,
    })),
    skipDuplicates: true,
  });

  const employeeGateRows = operations.employees.flatMap((e) =>
    (e.gateIds ?? []).map((gateId) => ({ employeeId: e.id, gateId })),
  );
  if (employeeGateRows.length > 0) {
    await prisma.employeeGate.createMany({
      data: employeeGateRows,
      skipDuplicates: true,
    });
  }

  await prisma.member.createMany({
    data: operations.members.map((m) => ({
      id: m.id,
      tenantId: m.tenantId,
      homeBranchId: m.homeBranchId,
      memberNumber: m.memberNumber,
      fullName: m.fullName,
      status: m.status,
      phone: m.phone,
      email: m.email,
      dateOfBirth: toDate(m.dateOfBirth),
      sex: m.sex,
      idNumber: m.idNumber,
      address: m.address,
      joinDate: toDate(m.joinDate),
      height: m.height,
      weight: m.weight,
      registeredEmployeeId: m.registeredEmployeeId,
      pictureUrl: m.pictureUrl,
      emergencyContactName: m.emergencyContactName,
      emergencyContactPhone: m.emergencyContactPhone,
      medicalNotes: m.medicalNotes,
      rfidTag: m.rfidTag,
    })),
    skipDuplicates: true,
  });

  await prisma.membershipPlan.createMany({
    data: operations.membershipPlans.map((p) => ({
      id: p.id,
      tenantId: p.tenantId,
      name: p.name,
      planType: p.planType,
      durationDays: p.durationDays,
      sessionCount: p.sessionCount,
      price: p.price,
      allowAllBranches: p.allowAllBranches,
      freezeAllowed: p.freezeAllowed,
      freezeMaxDays: p.freezeMaxDays,
    })),
    skipDuplicates: true,
  });

  // A single multi-row INSERT is checked for FK validity at end-of-statement
  // in Postgres, so self-referencing previousMembershipId is safe here even
  // though the referenced row may be later in the same batch.
  await prisma.membership.createMany({
    data: operations.memberships.map((m) => ({
      id: m.id,
      memberId: m.memberId,
      planId: m.planId,
      startDate: toDate(m.startDate)!,
      endDate: toDate(m.endDate)!,
      status: m.status,
      finalPrice: m.finalPrice,
      previousMembershipId: m.previousMembershipId,
    })),
    skipDuplicates: true,
  });

  await prisma.freeze.createMany({
    data: operations.freezes.map((f) => ({
      id: f.id,
      membershipId: f.membershipId,
      startDate: toDate(f.startDate)!,
      endDate: toDate(f.endDate)!,
      createdAt: toDate(f.createdAt),
    })),
    skipDuplicates: true,
  });

  await prisma.visit.createMany({
    data: operations.visits.map((v) => ({
      id: v.id,
      memberId: v.memberId,
      branchId: v.branchId,
      checkInTime: toDate(v.checkInTime)!,
      checkOutTime: toDate(v.checkOutTime ?? undefined) ?? null,
      accessMethod: v.accessMethod,
      gateId: v.gateId,
    })),
    skipDuplicates: true,
  });

  await prisma.payment.createMany({
    data: operations.payments.map((p) => ({
      id: p.id,
      tenantId: p.tenantId,
      branchId: p.branchId,
      memberId: p.memberId,
      membershipId: p.membershipId,
      amount: p.amount,
      paymentDate: toDate(p.paymentDate)!,
      status: p.status,
      paymentMethod: p.paymentMethod,
    })),
    skipDuplicates: true,
  });

  await prisma.notification.createMany({
    data: operations.notifications.map((n) => ({
      id: n.id,
      tenantId: n.tenantId,
      memberId: n.memberId,
      channel: n.channel,
      event: n.event as
        | 'membershipExpiring'
        | 'membershipExpired'
        | 'paymentPending'
        | 'membershipActivated'
        | undefined,
      relatedId: n.relatedId,
      subject: n.subject,
      body: n.body,
      status: n.status,
      sentAt: toDate(n.sentAt),
      failedReason: n.failedReason,
      createdAt: toDate(n.createdAt)!,
    })),
    skipDuplicates: true,
  });

  await prisma.tenantSettings.createMany({
    data: settings.tenants.map((t) => ({
      tenantId: t.tenantId,
      defaultLanguage: t.defaultLanguage,
      enabledLanguages: t.enabledLanguages,
      notificationSettings: t.notificationSettings as Prisma.InputJsonValue,
      notificationSenders: (t.notificationSenders ??
        {}) as Prisma.InputJsonValue,
      dateFormat: t.dateFormat,
      checkOutTrackingEnabled: t.checkOutTrackingEnabled,
    })),
    skipDuplicates: true,
  });

  await prisma.user.createMany({
    data: auth.users.map((u) => ({
      id: u.id,
      tenantId: u.tenant.id,
      email: u.email,
      name: u.name,
      role: ROLE_MAP[u.role],
      passwordHash: u.passwordHash,
      branchId: u.branch.id,
      branchName: u.branch.name,
    })),
    skipDuplicates: true,
  });

  // Sessions intentionally not migrated — 12h-lived, low value to carry over.
}
