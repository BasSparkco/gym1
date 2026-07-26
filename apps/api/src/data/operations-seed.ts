/**
 * Record types for the operational data model plus the default seed used by
 * the e2e test reset (test/prisma-test-utils.ts). The JSON-file store this
 * module used to manage was replaced by Postgres/Prisma in July 2026; only
 * the shared types and seed data remain.
 */
import { addDays, localDateString } from '../common/date';

export type BranchRecord = {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  phone?: string;
  /** ISO 3166-1 alpha-2 country code (e.g. 'IL', 'PS'). Used to derive the
   *  dial code for normalising member phone numbers into E.164 format. */
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
  /** If set, the employee has left — treated as terminated */
  endDate?: string;
  isUser?: boolean;
  /** Gate IDs this employee can manually open (null/absent = no gate access) */
  gateIds?: string[];
};

export type GateRecord = {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  /** Which gender this gate serves; null means no restriction */
  genderRestriction: 'male' | 'female' | null;
  deviceUrl: string;
  deviceUsername: string;
  /** Plaintext password — hashed to MD5 on each BAS-IP login request */
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

// 'push' is only ever used by NotificationDeliveryInput (for announcement
// fan-out, via FcmNotificationProvider) — NotificationRecord/the Notification
// table below never gets a 'push' row, so no Prisma enum change is needed.
export type NotificationChannel = 'sms' | 'whatsapp' | 'email' | 'push';

export type NotificationEvent =
  | 'membershipExpiring'
  | 'membershipExpired'
  | 'paymentPending'
  | 'membershipActivated';

export type NotificationRecord = {
  id: string;
  tenantId: string;
  memberId: string;
  channel: NotificationChannel;
  event?: NotificationEvent;
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

// Seed dates are computed relative to "today" at module load so the e2e
// suite's current-status assertions (active memberships, expiry) never drift
// as real time passes the fixture dates.
const seedToday = localDateString();

export const defaultOperationsSeed: OperationsStoreData = {
  reportingDate: seedToday,
  gates: [],
  branches: [
    {
      id: 'Platinum Fitness',
      tenantId: 'tenant-spark-gym',
      name: 'Ramallah Main Branch',
      address: 'Al-Irsal St, Ramallah',
      phone: '+970-2-296-0000',
      countryCode: 'PS',
      status: 'active' as const,
    },
    {
      id: 'branch-nablus-north',
      tenantId: 'tenant-spark-gym',
      name: 'Nablus North Branch',
      address: 'Rafidia St, Nablus',
      phone: '+970-9-238-0000',
      countryCode: 'PS',
      status: 'active' as const,
    },
    {
      id: 'branch-other-gym-main',
      tenantId: 'tenant-other-gym',
      name: 'Other Gym Main Branch',
      status: 'active' as const,
    },
  ],
  employees: [
    {
      id: 'emp-001',
      tenantId: 'tenant-spark-gym',
      branchId: 'Platinum Fitness',
      employeeNumber: 'EMP-0001',
      fullName: 'Sami Haddad',
      status: 'active' as const,
    },
    {
      id: 'emp-002',
      tenantId: 'tenant-spark-gym',
      branchId: 'Platinum Fitness',
      employeeNumber: 'EMP-0002',
      fullName: 'Rasha Barakat',
      status: 'active' as const,
    },
    {
      id: 'emp-003',
      tenantId: 'tenant-spark-gym',
      branchId: 'branch-nablus-north',
      employeeNumber: 'EMP-0003',
      fullName: 'Khalid Mansour',
      status: 'active' as const,
    },
  ],
  members: [
    {
      id: 'member-001',
      tenantId: 'tenant-spark-gym',
      homeBranchId: 'Platinum Fitness',
      memberNumber: 'MEM-0001',
      fullName: 'Lina Ahmad',
      status: 'active',
    },
    {
      id: 'member-002',
      tenantId: 'tenant-spark-gym',
      homeBranchId: 'Platinum Fitness',
      memberNumber: 'MEM-0002',
      fullName: 'Omar Khalil',
      status: 'active',
    },
    {
      id: 'member-003',
      tenantId: 'tenant-spark-gym',
      homeBranchId: 'Platinum Fitness',
      memberNumber: 'MEM-0003',
      fullName: 'Maya Saleh',
      status: 'active',
    },
    {
      id: 'member-004',
      tenantId: 'tenant-spark-gym',
      homeBranchId: 'Platinum Fitness',
      memberNumber: 'MEM-0004',
      fullName: 'Tariq Nasser',
      status: 'inactive',
    },
    {
      id: 'member-005',
      tenantId: 'tenant-spark-gym',
      homeBranchId: 'branch-nablus-north',
      memberNumber: 'MEM-0005',
      fullName: 'Dana Faris',
      status: 'active',
    },
    {
      id: 'member-006',
      tenantId: 'tenant-other-gym',
      homeBranchId: 'branch-other-gym-main',
      memberNumber: 'MEM-0001',
      fullName: 'Ali Salem',
      status: 'active',
    },
  ],
  membershipPlans: [
    {
      id: 'plan-monthly-flex',
      tenantId: 'tenant-spark-gym',
      name: 'Monthly Flex',
      planType: 'duration' as const,
      durationDays: 30,
      price: 120,
      allowAllBranches: true,
      freezeAllowed: true,
      freezeMaxDays: 7,
    },
    {
      id: 'plan-ramallah-standard',
      tenantId: 'tenant-spark-gym',
      name: 'Ramallah Standard',
      planType: 'duration' as const,
      durationDays: 30,
      price: 95,
      allowAllBranches: false,
      freezeAllowed: false,
    },
    {
      id: 'plan-other-monthly',
      tenantId: 'tenant-other-gym',
      name: 'Other Monthly',
      planType: 'duration' as const,
      durationDays: 30,
      price: 150,
      allowAllBranches: false,
      freezeAllowed: false,
    },
  ],
  memberships: [
    {
      id: 'membership-001',
      memberId: 'member-001',
      planId: 'plan-monthly-flex',
      startDate: addDays(seedToday, -30),
      endDate: addDays(seedToday, 335),
      status: 'active',
      finalPrice: 120,
    },
    {
      id: 'membership-002',
      memberId: 'member-002',
      planId: 'plan-ramallah-standard',
      startDate: addDays(seedToday, -30),
      endDate: addDays(seedToday, 335),
      status: 'active',
      finalPrice: 95,
    },
    {
      id: 'membership-003',
      memberId: 'member-003',
      planId: 'plan-monthly-flex',
      startDate: addDays(seedToday, -30),
      endDate: addDays(seedToday, 335),
      status: 'active',
      finalPrice: 110,
    },
    {
      id: 'membership-004',
      memberId: 'member-004',
      planId: 'plan-ramallah-standard',
      startDate: addDays(seedToday, -30),
      endDate: addDays(seedToday, 335),
      status: 'active',
      finalPrice: 85,
    },
    {
      id: 'membership-005',
      memberId: 'member-005',
      planId: 'plan-monthly-flex',
      startDate: addDays(seedToday, -30),
      endDate: addDays(seedToday, 335),
      status: 'active',
      finalPrice: 140,
    },
    {
      id: 'membership-006',
      memberId: 'member-006',
      planId: 'plan-other-monthly',
      startDate: addDays(seedToday, -30),
      endDate: addDays(seedToday, 335),
      status: 'active',
      finalPrice: 150,
    },
    {
      id: 'membership-007',
      memberId: 'member-003',
      planId: 'plan-monthly-flex',
      startDate: addDays(seedToday, -95),
      endDate: addDays(seedToday, -65),
      status: 'expired',
      finalPrice: 90,
    },
  ],
  visits: [
    {
      id: 'visit-001',
      memberId: 'member-001',
      branchId: 'Platinum Fitness',
      checkInTime: '2026-06-05T08:05:00.000Z',
      checkOutTime: '2026-06-05T09:45:00.000Z',
      accessMethod: 'manual',
    },
    {
      id: 'visit-002',
      memberId: 'member-002',
      branchId: 'Platinum Fitness',
      checkInTime: '2026-06-05T09:15:00.000Z',
      checkOutTime: '2026-06-05T10:50:00.000Z',
      accessMethod: 'qr',
    },
    {
      id: 'visit-003',
      memberId: 'member-003',
      branchId: 'Platinum Fitness',
      checkInTime: '2026-06-05T18:20:00.000Z',
      checkOutTime: null,
      accessMethod: 'manual',
    },
    {
      id: 'visit-004',
      memberId: 'member-005',
      branchId: 'branch-nablus-north',
      checkInTime: '2026-06-05T10:00:00.000Z',
      checkOutTime: null,
      accessMethod: 'qr',
    },
    {
      id: 'visit-005',
      memberId: 'member-001',
      branchId: 'Platinum Fitness',
      checkInTime: '2026-06-04T17:10:00.000Z',
      checkOutTime: '2026-06-04T18:55:00.000Z',
      accessMethod: 'manual',
    },
    {
      id: 'visit-006',
      memberId: 'member-006',
      branchId: 'branch-other-gym-main',
      checkInTime: '2026-06-05T11:00:00.000Z',
      checkOutTime: null,
      accessMethod: 'qr',
    },
  ],
  payments: [
    {
      id: 'payment-001',
      tenantId: 'tenant-spark-gym',
      branchId: 'Platinum Fitness',
      memberId: 'member-001',
      membershipId: 'membership-001',
      amount: 120,
      paymentDate: '2026-06-05T08:30:00.000Z',
      status: 'paid',
      paymentMethod: 'card',
    },
    {
      id: 'payment-002',
      tenantId: 'tenant-spark-gym',
      branchId: 'Platinum Fitness',
      memberId: 'member-002',
      membershipId: 'membership-002',
      amount: 95,
      paymentDate: '2026-06-05T11:45:00.000Z',
      status: 'paid',
      paymentMethod: 'cash',
    },
    {
      id: 'payment-003',
      tenantId: 'tenant-spark-gym',
      branchId: 'Platinum Fitness',
      memberId: 'member-003',
      membershipId: 'membership-003',
      amount: 75,
      paymentDate: '2026-06-05T12:00:00.000Z',
      status: 'pending',
      paymentMethod: 'transfer',
    },
    {
      id: 'payment-004',
      tenantId: 'tenant-spark-gym',
      branchId: 'branch-nablus-north',
      memberId: 'member-005',
      membershipId: 'membership-005',
      amount: 140,
      paymentDate: '2026-06-05T13:00:00.000Z',
      status: 'paid',
      paymentMethod: 'card',
    },
    {
      id: 'payment-005',
      tenantId: 'tenant-other-gym',
      branchId: 'branch-other-gym-main',
      memberId: 'member-006',
      membershipId: 'membership-006',
      amount: 150,
      paymentDate: '2026-06-05T09:20:00.000Z',
      status: 'paid',
      paymentMethod: 'cash',
    },
    {
      id: 'payment-006',
      tenantId: 'tenant-spark-gym',
      branchId: 'Platinum Fitness',
      memberId: 'member-003',
      membershipId: 'membership-003',
      amount: 90,
      paymentDate: '2026-06-04T15:00:00.000Z',
      status: 'paid',
      paymentMethod: 'card',
    },
  ],
  freezes: [],
  notifications: [
    {
      id: 'notif-001',
      tenantId: 'tenant-spark-gym',
      memberId: 'member-002',
      channel: 'sms' as const,
      subject: 'Membership expiring soon',
      body: 'Your membership expires on 2026-06-08. Renew now to keep your access.',
      status: 'sent' as const,
      sentAt: '2026-06-04T09:00:00.000Z',
      createdAt: '2026-06-04T09:00:00.000Z',
    },
    {
      id: 'notif-002',
      tenantId: 'tenant-spark-gym',
      memberId: 'member-003',
      channel: 'whatsapp' as const,
      subject: 'Membership expired',
      body: 'Your membership has expired. Visit the front desk to renew.',
      status: 'sent' as const,
      sentAt: '2026-06-05T08:00:00.000Z',
      createdAt: '2026-06-05T08:00:00.000Z',
    },
    {
      id: 'notif-003',
      tenantId: 'tenant-spark-gym',
      memberId: 'member-001',
      channel: 'email' as const,
      subject: 'Welcome to Spark Gym',
      body: 'Thank you for joining Spark Gym. Your membership is now active.',
      status: 'sent' as const,
      sentAt: '2026-05-15T10:00:00.000Z',
      createdAt: '2026-05-15T10:00:00.000Z',
    },
    {
      id: 'notif-004',
      tenantId: 'tenant-spark-gym',
      memberId: 'member-005',
      channel: 'sms' as const,
      subject: 'Payment reminder',
      body: 'You have a pending payment. Please settle your balance at the front desk.',
      status: 'failed' as const,
      createdAt: '2026-06-05T07:30:00.000Z',
    },
    {
      id: 'notif-005',
      tenantId: 'tenant-other-gym',
      memberId: 'member-006',
      channel: 'sms' as const,
      subject: 'Membership expiring soon',
      body: 'Your membership expires on 2026-06-18.',
      status: 'sent' as const,
      sentAt: '2026-06-05T08:00:00.000Z',
      createdAt: '2026-06-05T08:00:00.000Z',
    },
  ],
};
