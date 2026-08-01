/**
 * One-time demo-data seed for a freshly wiped database (dev or prod — both
 * were truncated to empty on 2026-07-10 at the user's request). Everything
 * is in Arabic (member/employee/program names, notification text) since the
 * next demo audience is an Arabic speaker. Covers every table including the
 * newer Training Programs / Classes / Coaches models, which the old
 * pre-Postgres JSON seed never had.
 *
 * Run with: node --env-file=.env dist/scripts/seed-demo-data.js
 * (build first: pnpm run build)
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { addDays, localDateString } from '../common/date';

const today = localDateString();

function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const existingTenants = await prisma.tenant.count();
    if (existingTenants > 0) {
      throw new Error(
        `Database is not empty (${existingTenants} tenant(s) already exist) — refusing to seed on top of existing data.`,
      );
    }

    await prisma.tenant.create({
      data: { id: 'tenant-spark-gym', name: 'نادي سبارك الرياضي' },
    });

    await prisma.branch.createMany({
      data: [
        {
          id: 'Platinum Fitness',
          tenantId: 'tenant-spark-gym',
          name: 'Platinum Fitness',
          address: 'شارع صلاح الدين، القدس',
          phone: '+972-2-624-0000',
          countryCode: 'IL',
          operatingCurrencyCode: 'ILS',
          status: 'active',
        },
        {
          id: 'branch-nazareth',
          tenantId: 'tenant-spark-gym',
          name: 'فرع الناصرة',
          address: 'شارع بولس السادس، الناصرة',
          phone: '+972-4-657-0000',
          countryCode: 'IL',
          operatingCurrencyCode: 'ILS',
          status: 'active',
        },
      ],
    });

    await prisma.employee.createMany({
      data: [
        {
          id: 'emp-001',
          tenantId: 'tenant-spark-gym',
          branchId: 'Platinum Fitness',
          employeeNumber: 'EMP-0001',
          fullName: 'سامي حداد',
          status: 'active',
          idNumber: '900123456',
          phone: '+972501112222',
          sex: 'male',
          dateOfBirth: new Date('1988-04-12'),
          job: 'مدرب كروسفت وتدريب قوة',
          salary: 7500,
          workType: 'fullTime',
          startDate: new Date('2023-02-01'),
        },
        {
          id: 'emp-002',
          tenantId: 'tenant-spark-gym',
          branchId: 'Platinum Fitness',
          employeeNumber: 'EMP-0002',
          fullName: 'رشا بركات',
          status: 'active',
          idNumber: '900234567',
          phone: '+972502223333',
          sex: 'female',
          dateOfBirth: new Date('1995-09-20'),
          job: 'موظفة استقبال',
          salary: 5200,
          workType: 'fullTime',
          startDate: new Date('2024-01-10'),
        },
        {
          id: 'emp-003',
          tenantId: 'tenant-spark-gym',
          branchId: 'branch-nazareth',
          employeeNumber: 'EMP-0003',
          fullName: 'خالد منصور',
          status: 'active',
          idNumber: '900345678',
          phone: '+972503334444',
          sex: 'male',
          dateOfBirth: new Date('1985-11-03'),
          job: 'مدير الفرع',
          salary: 9000,
          workType: 'fullTime',
          startDate: new Date('2022-06-15'),
        },
        {
          id: 'emp-004',
          tenantId: 'tenant-spark-gym',
          branchId: 'Platinum Fitness',
          employeeNumber: 'EMP-0004',
          fullName: 'نور أبو علي',
          status: 'active',
          idNumber: '900456789',
          phone: '+972504445555',
          sex: 'female',
          dateOfBirth: new Date('1980-01-25'),
          job: 'المديرة العامة',
          salary: 15000,
          workType: 'fullTime',
          startDate: new Date('2021-01-01'),
        },
        {
          id: 'emp-005',
          tenantId: 'tenant-spark-gym',
          branchId: 'branch-nazareth',
          employeeNumber: 'EMP-0005',
          fullName: 'وسيم صالح',
          status: 'active',
          idNumber: '900567890',
          phone: '+972505556666',
          sex: 'male',
          dateOfBirth: new Date('1990-07-08'),
          job: 'مدرب يوغا وبيلاتس',
          salary: 6800,
          workType: 'partTime',
          startDate: new Date('2023-09-01'),
        },
      ],
    });

    await prisma.coachProfile.createMany({
      data: [
        {
          employeeId: 'emp-001',
          specializations: ['كروس فيت', 'تدريب القوة', 'الرفع الأولمبي'],
          certifications: ['CF-L1', 'مدرب لياقة معتمد'],
        },
        {
          employeeId: 'emp-005',
          specializations: ['يوغا', 'بيلاتس'],
          certifications: ['RYT-200'],
        },
      ],
    });

    await prisma.gate.createMany({
      data: [
        {
          id: 'gate-platinum-main',
          tenantId: 'tenant-spark-gym',
          branchId: 'Platinum Fitness',
          name: 'البوابة الرئيسية - القدس',
          genderRestriction: null,
          deviceUrl: 'http://192.168.1.101',
          deviceUsername: 'admin',
          devicePassword: 'changeme',
          lockNumber: 1,
          enabled: true,
        },
        {
          id: 'gate-nazareth-main',
          tenantId: 'tenant-spark-gym',
          branchId: 'branch-nazareth',
          name: 'بوابة الناصرة',
          genderRestriction: null,
          deviceUrl: 'http://192.168.2.101',
          deviceUsername: 'admin',
          devicePassword: 'changeme',
          lockNumber: 1,
          enabled: true,
        },
      ],
    });

    await prisma.employeeGate.createMany({
      data: [
        { employeeId: 'emp-002', gateId: 'gate-platinum-main' },
        { employeeId: 'emp-003', gateId: 'gate-nazareth-main' },
        { employeeId: 'emp-004', gateId: 'gate-platinum-main' },
      ],
    });

    // Users — one account per employee (owner/manager/front-desk), same
    // login credentials as the previous demo seed. Password hashes below are
    // scrypt:<salt>:<hash>, matching AuthService.hashPassword's format.
    await prisma.user.createMany({
      data: [
        {
          id: 'user-owner-001',
          tenantId: 'tenant-spark-gym',
          email: 'owner@sparkgym.local',
          name: 'نور أبو علي',
          role: 'owner',
          passwordHash:
            'scrypt:7dd174123a6767616d8bbbd028f4c5f1:04fef104953bb3c1df97d712e62e9f00ea9a5bdfc74de175d84ab87b427d941c6f367d26e445851f6a7c1172450b9a770da0470d6e06a478f52c711f10aa314f',
          branchId: 'Platinum Fitness',
          branchName: 'Platinum Fitness',
          employeeId: 'emp-004',
        },
        {
          id: 'user-manager-001',
          tenantId: 'tenant-spark-gym',
          email: 'manager@sparkgym.local',
          name: 'خالد منصور',
          role: 'manager',
          passwordHash:
            'scrypt:c54a5cab688db9f22ac6bbbbd5e30c06:d8c6ace5d7af1111ba7bfb1e04d9f4c16a6a1fef3232f1be6ca0f6134d83c9702e371d23eea135d8f5b16e92788789c25a8324b571aafcd15ca2375156ef7e13',
          branchId: 'branch-nazareth',
          branchName: 'فرع الناصرة',
          employeeId: 'emp-003',
        },
        {
          id: 'user-frontdesk-001',
          tenantId: 'tenant-spark-gym',
          email: 'frontdesk@sparkgym.local',
          name: 'رشا بركات',
          role: 'frontDesk',
          passwordHash:
            'scrypt:006e979410fbccb0600f59871608d011:192ceb1ce366f13d6a46c0ae49243f53e53bbf49b0d60eb6fef528967d7c23fc0b6d2fe0c8d4a07781c5e59751136d09f95c57272b8426ee7131e9b914422543',
          branchId: 'Platinum Fitness',
          branchName: 'Platinum Fitness',
          employeeId: 'emp-002',
        },
      ],
    });

    await prisma.employee.updateMany({
      where: { id: { in: ['emp-002', 'emp-003', 'emp-004'] } },
      data: { isUser: true },
    });

    await prisma.membershipPlan.createMany({
      data: [
        {
          id: 'plan-monthly-flex',
          tenantId: 'tenant-spark-gym',
          name: 'الاشتراك الشهري المرن',
          planType: 'duration',
          durationDays: 30,
          price: 150,
          allowAllBranches: true,
          freezeAllowed: true,
          freezeMaxDays: 7,
          allowAllPrograms: true,
        },
        {
          id: 'plan-jerusalem-standard',
          tenantId: 'tenant-spark-gym',
          name: 'اشتراك القدس القياسي',
          planType: 'duration',
          durationDays: 30,
          price: 120,
          allowAllBranches: false,
          freezeAllowed: false,
          allowAllPrograms: true,
        },
        {
          id: 'plan-premium-annual',
          tenantId: 'tenant-spark-gym',
          name: 'الاشتراك السنوي المميز',
          planType: 'duration',
          durationDays: 365,
          price: 1400,
          allowAllBranches: true,
          freezeAllowed: true,
          freezeMaxDays: 14,
          allowAllPrograms: false,
        },
        {
          id: 'plan-session-pack-10',
          tenantId: 'tenant-spark-gym',
          name: 'باقة 10 حصص',
          planType: 'session',
          sessionCount: 10,
          price: 250,
          allowAllBranches: true,
          freezeAllowed: false,
          allowAllPrograms: true,
        },
      ],
    });

    await prisma.trainingProgram.createMany({
      data: [
        {
          id: 'program-crossfit',
          tenantId: 'tenant-spark-gym',
          branchId: null,
          name: 'كروس فيت',
          description: 'تمارين وظيفية عالية الكثافة لبناء القوة واللياقة العامة.',
          color: '#e4572e',
          icon: '🏋️',
          active: true,
          maxMembers: 12,
          defaultCoachId: 'emp-001',
        },
        {
          id: 'program-yoga',
          tenantId: 'tenant-spark-gym',
          branchId: null,
          name: 'يوغا',
          description: 'جلسات يوغا لتحسين المرونة والتوازن وتقليل التوتر.',
          color: '#4c9a8e',
          icon: '🧘',
          active: true,
          maxMembers: 15,
          defaultCoachId: 'emp-005',
        },
        {
          id: 'program-pilates',
          tenantId: 'tenant-spark-gym',
          branchId: null,
          name: 'بيلاتس',
          description: 'تقوية عضلات الجذع وتحسين الوضعية.',
          color: '#7d5ba6',
          icon: '🤸',
          active: true,
          maxMembers: 12,
          defaultCoachId: 'emp-005',
        },
        {
          id: 'program-boxing',
          tenantId: 'tenant-spark-gym',
          branchId: 'Platinum Fitness',
          name: 'الملاكمة',
          description: 'تدريب ملاكمة لتحسين اللياقة القلبية والتنسيق.',
          color: '#2b2d42',
          icon: '🥊',
          active: true,
          maxMembers: 10,
          defaultCoachId: 'emp-001',
        },
        {
          id: 'program-personal-training',
          tenantId: 'tenant-spark-gym',
          branchId: null,
          name: 'تدريب شخصي',
          description: 'جلسات فردية مخصصة حسب أهداف كل متدرب — عضوية مميزة فقط.',
          color: '#d4af37',
          icon: '⭐',
          active: true,
          maxMembers: 4,
          defaultCoachId: 'emp-001',
        },
        {
          id: 'program-olympic-lifting',
          tenantId: 'tenant-spark-gym',
          branchId: null,
          name: 'الرفع الأولمبي',
          description: 'تدريب متخصص في حركتي الخطف والنتر — عضوية مميزة فقط.',
          color: '#9a031e',
          icon: '🏆',
          active: true,
          maxMembers: 6,
          defaultCoachId: 'emp-001',
        },
      ],
    });

    // Premium Annual is the only plan restricted to specific programs
    // (allowAllPrograms: false above) — entitle it to the two premium ones.
    await prisma.membershipPlanProgram.createMany({
      data: [
        { planId: 'plan-premium-annual', programId: 'program-personal-training' },
        { planId: 'plan-premium-annual', programId: 'program-olympic-lifting' },
      ],
    });

    await prisma.member.createMany({
      data: [
        {
          id: 'member-001',
          tenantId: 'tenant-spark-gym',
          homeBranchId: 'Platinum Fitness',
          memberNumber: 'MEM-0001',
          fullName: 'لينا أحمد',
          status: 'active',
          phone: '+972521112222',
          email: 'lina.ahmad@example.com',
          dateOfBirth: new Date('1997-03-14'),
          sex: 'female',
          idNumber: '910111222',
          address: 'شارع يافا، القدس',
          joinDate: new Date(addDays(today, -60)),
          height: 165,
          weight: 60,
          registeredEmployeeId: 'emp-002',
        },
        {
          id: 'member-002',
          tenantId: 'tenant-spark-gym',
          homeBranchId: 'Platinum Fitness',
          memberNumber: 'MEM-0002',
          fullName: 'عمر خليل',
          status: 'active',
          phone: '+972522223333',
          email: 'omar.khalil@example.com',
          dateOfBirth: new Date('1993-08-22'),
          sex: 'male',
          idNumber: '910222333',
          address: 'شارع الزهراء، القدس',
          joinDate: new Date(addDays(today, -45)),
          height: 178,
          weight: 82,
          registeredEmployeeId: 'emp-002',
        },
        {
          id: 'member-003',
          tenantId: 'tenant-spark-gym',
          homeBranchId: 'Platinum Fitness',
          memberNumber: 'MEM-0003',
          fullName: 'مايا صالح',
          status: 'active',
          phone: '+972523334444',
          email: 'maya.saleh@example.com',
          dateOfBirth: new Date('2000-01-05'),
          sex: 'female',
          idNumber: '910333444',
          joinDate: new Date(addDays(today, -20)),
          registeredEmployeeId: 'emp-004',
        },
        {
          id: 'member-004',
          tenantId: 'tenant-spark-gym',
          homeBranchId: 'Platinum Fitness',
          memberNumber: 'MEM-0004',
          fullName: 'طارق ناصر',
          status: 'inactive',
          phone: '+972524445555',
          dateOfBirth: new Date('1989-12-01'),
          sex: 'male',
          idNumber: '910444555',
          joinDate: new Date(addDays(today, -200)),
          registeredEmployeeId: 'emp-002',
        },
        {
          id: 'member-005',
          tenantId: 'tenant-spark-gym',
          homeBranchId: 'branch-nazareth',
          memberNumber: 'MEM-0005',
          fullName: 'دانة فارس',
          status: 'active',
          phone: '+972525556666',
          email: 'dana.faris@example.com',
          dateOfBirth: new Date('1996-06-18'),
          sex: 'female',
          idNumber: '910555666',
          joinDate: new Date(addDays(today, -15)),
          registeredEmployeeId: 'emp-003',
        },
        {
          id: 'member-006',
          tenantId: 'tenant-spark-gym',
          homeBranchId: 'branch-nazareth',
          memberNumber: 'MEM-0006',
          fullName: 'علي سالم',
          status: 'active',
          phone: '+972526667777',
          email: 'ali.salem@example.com',
          dateOfBirth: new Date('1991-10-30'),
          sex: 'male',
          idNumber: '910666777',
          joinDate: new Date(addDays(today, -10)),
          registeredEmployeeId: 'emp-003',
        },
        {
          id: 'member-007',
          tenantId: 'tenant-spark-gym',
          homeBranchId: 'branch-nazareth',
          memberNumber: 'MEM-0007',
          fullName: 'سارة يوسف',
          status: 'active',
          phone: '+972527778888',
          email: 'sara.yousef@example.com',
          dateOfBirth: new Date('1994-02-11'),
          sex: 'female',
          idNumber: '910777888',
          joinDate: new Date(addDays(today, -90)),
          registeredEmployeeId: 'emp-003',
        },
        {
          id: 'member-008',
          tenantId: 'tenant-spark-gym',
          homeBranchId: 'Platinum Fitness',
          memberNumber: 'MEM-0008',
          fullName: 'زياد عمرو',
          status: 'active',
          phone: '+972528889999',
          email: 'ziad.amr@example.com',
          dateOfBirth: new Date('1987-05-27'),
          sex: 'male',
          idNumber: '910888999',
          joinDate: new Date(addDays(today, -120)),
          registeredEmployeeId: 'emp-004',
        },
      ],
    });

    await prisma.membership.createMany({
      data: [
        {
          id: 'membership-001',
          memberId: 'member-001',
          planId: 'plan-monthly-flex',
          startDate: new Date(addDays(today, -10)),
          endDate: new Date(addDays(today, 20)),
          status: 'active',
          finalPrice: 150,
        },
        {
          id: 'membership-002',
          memberId: 'member-002',
          planId: 'plan-jerusalem-standard',
          startDate: new Date(addDays(today, -5)),
          endDate: new Date(addDays(today, 25)),
          status: 'active',
          finalPrice: 120,
        },
        {
          id: 'membership-003',
          memberId: 'member-003',
          planId: 'plan-monthly-flex',
          startDate: new Date(addDays(today, -18)),
          endDate: new Date(addDays(today, 12)),
          status: 'active',
          finalPrice: 150,
        },
        {
          id: 'membership-004',
          memberId: 'member-004',
          planId: 'plan-jerusalem-standard',
          startDate: new Date(addDays(today, -95)),
          endDate: new Date(addDays(today, -65)),
          status: 'expired',
          finalPrice: 110,
        },
        {
          id: 'membership-005',
          memberId: 'member-005',
          planId: 'plan-session-pack-10',
          startDate: new Date(addDays(today, -15)),
          endDate: new Date(addDays(today, 75)),
          status: 'active',
          finalPrice: 250,
        },
        {
          id: 'membership-006',
          memberId: 'member-006',
          planId: 'plan-monthly-flex',
          startDate: new Date(addDays(today, -8)),
          endDate: new Date(addDays(today, 22)),
          status: 'active',
          finalPrice: 150,
        },
        {
          id: 'membership-007',
          memberId: 'member-007',
          planId: 'plan-premium-annual',
          startDate: new Date(addDays(today, -30)),
          endDate: new Date(addDays(today, 335)),
          status: 'active',
          finalPrice: 1400,
        },
        {
          id: 'membership-008',
          memberId: 'member-008',
          planId: 'plan-monthly-flex',
          startDate: new Date(addDays(today, -12)),
          endDate: new Date(addDays(today, 18)),
          status: 'frozen',
          finalPrice: 150,
        },
      ],
    });

    await prisma.freeze.create({
      data: {
        id: 'freeze-001',
        membershipId: 'membership-008',
        startDate: new Date(addDays(today, -2)),
        endDate: new Date(addDays(today, 5)),
      },
    });

    // Class sessions — scheduled in the future relative to "today" so the
    // hourly no-show sweep (ClassBookingsService.sweepNoShows) doesn't flip
    // the demo bookings below to noShow before anyone sees them.
    await prisma.classSession.createMany({
      data: [
        {
          id: 'session-crossfit-1',
          tenantId: 'tenant-spark-gym',
          branchId: 'Platinum Fitness',
          programId: 'program-crossfit',
          coachId: 'emp-001',
          room: 'صالة الأثقال',
          date: new Date(addDays(today, 1)),
          startTime: combineDateAndTime(addDays(today, 1), '07:00'),
          endTime: combineDateAndTime(addDays(today, 1), '08:00'),
          capacity: 12,
          status: 'scheduled',
          recurrenceId: 'rec-crossfit-morning',
        },
        {
          id: 'session-crossfit-2',
          tenantId: 'tenant-spark-gym',
          branchId: 'Platinum Fitness',
          programId: 'program-crossfit',
          coachId: 'emp-001',
          room: 'صالة الأثقال',
          date: new Date(addDays(today, 8)),
          startTime: combineDateAndTime(addDays(today, 8), '07:00'),
          endTime: combineDateAndTime(addDays(today, 8), '08:00'),
          capacity: 12,
          status: 'scheduled',
          recurrenceId: 'rec-crossfit-morning',
        },
        {
          id: 'session-yoga-1',
          tenantId: 'tenant-spark-gym',
          branchId: 'Platinum Fitness',
          programId: 'program-yoga',
          coachId: 'emp-005',
          room: 'استوديو اليوغا',
          date: new Date(addDays(today, 1)),
          startTime: combineDateAndTime(addDays(today, 1), '18:00'),
          endTime: combineDateAndTime(addDays(today, 1), '19:00'),
          capacity: 15,
          status: 'scheduled',
        },
        {
          id: 'session-boxing-1',
          tenantId: 'tenant-spark-gym',
          branchId: 'Platinum Fitness',
          programId: 'program-boxing',
          coachId: 'emp-001',
          room: 'صالة الملاكمة',
          date: new Date(addDays(today, 2)),
          startTime: combineDateAndTime(addDays(today, 2), '17:00'),
          endTime: combineDateAndTime(addDays(today, 2), '18:00'),
          capacity: 10,
          status: 'scheduled',
        },
        {
          id: 'session-pilates-1',
          tenantId: 'tenant-spark-gym',
          branchId: 'branch-nazareth',
          programId: 'program-pilates',
          coachId: 'emp-005',
          room: 'الاستوديو أ',
          date: new Date(addDays(today, 2)),
          startTime: combineDateAndTime(addDays(today, 2), '09:00'),
          endTime: combineDateAndTime(addDays(today, 2), '10:00'),
          capacity: 12,
          status: 'scheduled',
        },
        {
          id: 'session-personal-1',
          tenantId: 'tenant-spark-gym',
          branchId: 'Platinum Fitness',
          programId: 'program-personal-training',
          coachId: 'emp-001',
          room: 'غرفة التدريب الخاص',
          date: new Date(addDays(today, 3)),
          startTime: combineDateAndTime(addDays(today, 3), '16:00'),
          endTime: combineDateAndTime(addDays(today, 3), '17:00'),
          capacity: 4,
          status: 'scheduled',
        },
        {
          id: 'session-olympic-1',
          tenantId: 'tenant-spark-gym',
          branchId: 'Platinum Fitness',
          programId: 'program-olympic-lifting',
          coachId: 'emp-001',
          room: 'صالة الأثقال',
          date: new Date(addDays(today, 4)),
          startTime: combineDateAndTime(addDays(today, 4), '07:00'),
          endTime: combineDateAndTime(addDays(today, 4), '08:00'),
          capacity: 6,
          status: 'scheduled',
        },
      ],
    });

    await prisma.classBooking.createMany({
      data: [
        {
          id: 'booking-001',
          classSessionId: 'session-crossfit-1',
          memberId: 'member-001',
          membershipId: 'membership-001',
          status: 'booked',
        },
        {
          id: 'booking-002',
          classSessionId: 'session-yoga-1',
          memberId: 'member-002',
          membershipId: 'membership-002',
          status: 'booked',
        },
        {
          id: 'booking-003',
          classSessionId: 'session-boxing-1',
          memberId: 'member-003',
          membershipId: 'membership-003',
          status: 'booked',
        },
        {
          id: 'booking-004',
          classSessionId: 'session-pilates-1',
          memberId: 'member-005',
          membershipId: 'membership-005',
          status: 'booked',
        },
        // Only the Premium Annual holder (member-007) is entitled to the
        // restricted programs — demonstrates the plan/program entitlement.
        {
          id: 'booking-005',
          classSessionId: 'session-personal-1',
          memberId: 'member-007',
          membershipId: 'membership-007',
          status: 'booked',
        },
        {
          id: 'booking-006',
          classSessionId: 'session-olympic-1',
          memberId: 'member-007',
          membershipId: 'membership-007',
          status: 'booked',
        },
      ],
    });

    await prisma.visit.createMany({
      data: [
        {
          id: 'visit-001',
          memberId: 'member-001',
          branchId: 'Platinum Fitness',
          checkInTime: combineDateAndTime(addDays(today, -1), '08:05'),
          checkOutTime: combineDateAndTime(addDays(today, -1), '09:45'),
          accessMethod: 'manual',
          gateId: 'gate-platinum-main',
        },
        {
          id: 'visit-002',
          memberId: 'member-002',
          branchId: 'Platinum Fitness',
          checkInTime: combineDateAndTime(today, '09:15'),
          checkOutTime: null,
          accessMethod: 'qr',
          gateId: 'gate-platinum-main',
        },
        {
          id: 'visit-003',
          memberId: 'member-005',
          branchId: 'branch-nazareth',
          checkInTime: combineDateAndTime(addDays(today, -1), '17:30'),
          checkOutTime: combineDateAndTime(addDays(today, -1), '19:00'),
          accessMethod: 'qr',
          gateId: 'gate-nazareth-main',
        },
        {
          id: 'visit-004',
          memberId: 'member-006',
          branchId: 'branch-nazareth',
          checkInTime: combineDateAndTime(today, '07:50'),
          checkOutTime: null,
          accessMethod: 'manual',
          gateId: 'gate-nazareth-main',
        },
      ],
    });

    await prisma.payment.createMany({
      data: [
        {
          id: 'payment-001',
          tenantId: 'tenant-spark-gym',
          branchId: 'Platinum Fitness',
          memberId: 'member-001',
          membershipId: 'membership-001',
          amount: 150,
          paymentDate: combineDateAndTime(addDays(today, -10), '08:30'),
          status: 'paid',
          paymentMethod: 'card',
        },
        {
          id: 'payment-002',
          tenantId: 'tenant-spark-gym',
          branchId: 'Platinum Fitness',
          memberId: 'member-002',
          membershipId: 'membership-002',
          amount: 120,
          paymentDate: combineDateAndTime(addDays(today, -5), '11:45'),
          status: 'paid',
          paymentMethod: 'cash',
        },
        {
          id: 'payment-003',
          tenantId: 'tenant-spark-gym',
          branchId: 'Platinum Fitness',
          memberId: 'member-003',
          membershipId: 'membership-003',
          amount: 150,
          paymentDate: combineDateAndTime(addDays(today, -18), '12:00'),
          status: 'pending',
          paymentMethod: 'transfer',
        },
        {
          id: 'payment-004',
          tenantId: 'tenant-spark-gym',
          branchId: 'branch-nazareth',
          memberId: 'member-005',
          membershipId: 'membership-005',
          amount: 250,
          paymentDate: combineDateAndTime(addDays(today, -15), '13:00'),
          status: 'paid',
          paymentMethod: 'card',
        },
        {
          id: 'payment-005',
          tenantId: 'tenant-spark-gym',
          branchId: 'branch-nazareth',
          memberId: 'member-007',
          membershipId: 'membership-007',
          amount: 1400,
          paymentDate: combineDateAndTime(addDays(today, -30), '10:00'),
          status: 'paid',
          paymentMethod: 'card',
        },
        {
          id: 'payment-006',
          tenantId: 'tenant-spark-gym',
          branchId: 'Platinum Fitness',
          memberId: 'member-008',
          membershipId: 'membership-008',
          amount: 150,
          paymentDate: combineDateAndTime(addDays(today, -12), '09:00'),
          status: 'paid',
          paymentMethod: 'cash',
        },
      ],
    });

    await prisma.notification.createMany({
      data: [
        {
          id: 'notif-001',
          tenantId: 'tenant-spark-gym',
          memberId: 'member-002',
          channel: 'whatsapp',
          event: 'membershipExpiring',
          subject: 'اشتراكك على وشك الانتهاء',
          body: 'ينتهي اشتراكك قريبًا. جدّد الآن للحفاظ على وصولك إلى النادي.',
          status: 'sent',
          sentAt: combineDateAndTime(addDays(today, -1), '09:00'),
          createdAt: combineDateAndTime(addDays(today, -1), '09:00'),
        },
        {
          id: 'notif-002',
          tenantId: 'tenant-spark-gym',
          memberId: 'member-004',
          channel: 'whatsapp',
          event: 'membershipExpired',
          subject: 'انتهى اشتراكك',
          body: 'لقد انتهى اشتراكك. تفضل بزيارة مكتب الاستقبال للتجديد.',
          status: 'sent',
          sentAt: combineDateAndTime(addDays(today, -60), '08:00'),
          createdAt: combineDateAndTime(addDays(today, -60), '08:00'),
        },
        {
          id: 'notif-003',
          tenantId: 'tenant-spark-gym',
          memberId: 'member-001',
          channel: 'email',
          event: 'membershipActivated',
          subject: 'مرحبًا بك في نادي سبارك الرياضي',
          body: 'شكرًا لانضمامك إلينا. اشتراكك الآن مفعّل ويمكنك البدء بالتمرين.',
          status: 'sent',
          sentAt: combineDateAndTime(addDays(today, -10), '10:00'),
          createdAt: combineDateAndTime(addDays(today, -10), '10:00'),
        },
        {
          id: 'notif-004',
          tenantId: 'tenant-spark-gym',
          memberId: 'member-003',
          channel: 'sms',
          event: 'paymentPending',
          subject: 'تذكير بالدفع',
          body: 'لديك دفعة معلّقة. يرجى تسوية رصيدك عند مكتب الاستقبال.',
          status: 'failed',
          failedReason: 'لا يوجد رقم هاتف مسجل',
          createdAt: combineDateAndTime(today, '07:30'),
        },
      ],
    });

    await prisma.tenantSettings.create({
      data: {
        tenantId: 'tenant-spark-gym',
        defaultLanguage: 'ar',
        enabledLanguages: ['ar', 'en', 'he'],
        notificationSettings: {
          membershipExpiring: {
            enabled: true,
            channels: { sms: false, whatsapp: true, email: false },
            daysBefore: 3,
          },
          membershipExpired: {
            enabled: true,
            channels: { sms: false, whatsapp: true, email: false },
          },
          paymentPending: {
            enabled: true,
            channels: { sms: false, whatsapp: true, email: false },
          },
          membershipActivated: {
            enabled: true,
            channels: { sms: false, whatsapp: true, email: true },
          },
        },
        notificationSenders: {},
        dateFormat: 'dd/mm/yyyy',
        checkOutTrackingEnabled: true,
        ownerDataScope: 'all',
        reportingCurrencyCode: 'ILS',
      },
    });

    console.log('Seed complete:');
    console.log('  1 tenant, 2 branches, 5 employees (2 coaches), 2 gates');
    console.log('  3 accounts: owner@sparkgym.local / owner123');
    console.log('               manager@sparkgym.local / manager123');
    console.log('               frontdesk@sparkgym.local / frontdesk123');
    console.log('  4 membership plans, 8 members, 8 memberships, 1 freeze');
    console.log('  6 training programs, 7 class sessions, 6 bookings');
    console.log('  4 visits, 6 payments, 4 notifications, tenant settings (ar default)');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
