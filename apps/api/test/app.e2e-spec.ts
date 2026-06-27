import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { existsSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

const testDataRoot = join(tmpdir(), `gym-e2e-${process.pid}`);

describe('API (e2e)', () => {
  let app: INestApplication;

  function getHttpServer() {
    return app.getHttpServer() as unknown as App;
  }

  beforeEach(async () => {
    // Redirect all store I/O to an isolated temp directory so tests never
    // touch the live .local/ data on the host machine.
    process.env.API_DATA_ROOT = testDataRoot;

    const localDir = join(testDataRoot, '.local');
    const dataDir = join(testDataRoot, 'data');

    if (existsSync(join(localDir, 'auth-store.json'))) {
      rmSync(join(localDir, 'auth-store.json'));
    }

    if (existsSync(join(localDir, 'operations-store.json'))) {
      rmSync(join(localDir, 'operations-store.json'));
    }

    if (existsSync(join(dataDir, 'operations-seed.json'))) {
      rmSync(join(dataDir, 'operations-seed.json'));
    }

    mkdirSync(localDir, { recursive: true });
    mkdirSync(dataDir, { recursive: true });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(() => {
    if (existsSync(testDataRoot)) {
      rmSync(testDataRoot, { recursive: true, force: true });
    }
    delete process.env.API_DATA_ROOT;
  });

  it('/api (GET)', () => {
    return request(getHttpServer()).get('/api').expect(200).expect({
      name: 'Spark Gym ERP API',
      status: 'ok',
      version: '0.1.0',
      prefix: '/api',
    });
  });

  it('signs in and resolves the current session', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const signInBody = signInResponse.body as {
      user: {
        email: string;
        username: string;
        name: string;
        role: string;
      };
    };

    expect(signInBody.user).toMatchObject({
      email: 'frontdesk@sparkgym.local',
      username: 'frontdesk',
      name: 'Front Desk User',
      role: 'front-desk',
    });

    const sessionCookies = signInResponse.get('Set-Cookie');

    expect(sessionCookies).toEqual(
      expect.arrayContaining([expect.stringContaining('spark_gym_session=')]),
    );

    const currentSessionResponse = await request(getHttpServer())
      .get('/api/auth/current-session')
      .set('Cookie', sessionCookies)
      .expect(200);

    const currentSessionBody = currentSessionResponse.body as {
      user: {
        email: string;
        tenant: {
          id: string;
          name: string;
        };
        branch: {
          id: string;
          name: string;
        };
      };
    };

    expect(currentSessionBody.user).toMatchObject({
      email: 'frontdesk@sparkgym.local',
      tenant: {
        id: 'tenant-spark-gym',
        name: 'Spark Gym',
      },
      branch: {
        id: 'Platinum Fitness',
        name: 'Ramallah Main Branch',
      },
    });
  });

  it('returns the dashboard summary for the authenticated tenant scope', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const dashboardSummaryResponse = await request(getHttpServer())
      .get('/api/reports/dashboard-summary')
      .set('Cookie', sessionCookies)
      .expect(200);

    const dashboardSummaryBody = dashboardSummaryResponse.body as {
      cards: Array<{
        label: string;
        value: string;
      }>;
      quickActions: string[];
      scope: {
        tenantId: string;
        branchId: string;
        role: string;
      };
    };

    expect(dashboardSummaryBody.scope).toMatchObject({
      tenantId: 'tenant-spark-gym',
      branchId: 'Platinum Fitness',
      role: 'front-desk',
    });
    expect(dashboardSummaryBody.cards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Active memberships',
          value: '5',
        }),
        expect.objectContaining({
          label: "Today's check-ins",
          value: '0',
        }),
        expect.objectContaining({
          label: 'Payments today',
          value: '$0',
        }),
      ]),
    );
    expect(dashboardSummaryBody.quickActions).toEqual([
      'Create member',
      'Record payment',
      'Check in member',
    ]);
  });

  it('persists module-owned operational records and updates the dashboard summary', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const createMemberResponse = await request(getHttpServer())
      .post('/api/members')
      .set('Cookie', sessionCookies)
      .send({
        fullName: 'Rami Haddad',
      })
      .expect(201);

    const createdMemberBody = createMemberResponse.body as {
      member: {
        id: string;
        fullName: string;
        homeBranchId: string;
      };
    };

    expect(createdMemberBody.member).toMatchObject({
      fullName: 'Rami Haddad',
      homeBranchId: 'Platinum Fitness',
    });

    const createMembershipResponse = await request(getHttpServer())
      .post('/api/memberships')
      .set('Cookie', sessionCookies)
      .send({
        memberId: createdMemberBody.member.id,
        planId: 'plan-monthly-flex',
        startDate: '2026-06-05',
        endDate: '2026-06-12',
        status: 'active',
        finalPrice: 130,
      })
      .expect(201);

    const createdMembershipBody = createMembershipResponse.body as {
      membership: {
        id: string;
        memberId: string;
      };
    };

    expect(createdMembershipBody.membership.memberId).toBe(
      createdMemberBody.member.id,
    );

    const now = new Date().toISOString();

    await request(getHttpServer())
      .post('/api/visits')
      .set('Cookie', sessionCookies)
      .send({
        memberId: createdMemberBody.member.id,
        checkInTime: now,
        accessMethod: 'manual',
      })
      .expect(201);

    await request(getHttpServer())
      .post('/api/payments')
      .set('Cookie', sessionCookies)
      .send({
        memberId: createdMemberBody.member.id,
        membershipId: createdMembershipBody.membership.id,
        amount: 130,
        paymentDate: now,
        status: 'paid',
        paymentMethod: 'cash',
      })
      .expect(201);

    const membersResponse = await request(getHttpServer())
      .get('/api/members')
      .set('Cookie', sessionCookies)
      .expect(200);

    const membersBody = membersResponse.body as {
      members: Array<{
        id: string;
      }>;
    };

    expect(membersBody.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdMemberBody.member.id,
        }),
      ]),
    );

    const dashboardSummaryResponse = await request(getHttpServer())
      .get('/api/reports/dashboard-summary')
      .set('Cookie', sessionCookies)
      .expect(200);

    const dashboardSummaryBody = dashboardSummaryResponse.body as {
      cards: Array<{
        label: string;
        value: string;
      }>;
    };

    expect(dashboardSummaryBody.cards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Active memberships',
          value: '6',
        }),
        expect.objectContaining({
          label: "Today's check-ins",
          value: '1',
        }),
        expect.objectContaining({
          label: 'Payments today',
          value: '$130',
        }),
      ]),
    );
  });

  it('assigns member numbers and supports member retrieval and updates', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const createMemberResponse = await request(getHttpServer())
      .post('/api/members')
      .set('Cookie', sessionCookies)
      .send({
        fullName: 'Nour Mansour',
      })
      .expect(201);

    const createdMemberBody = createMemberResponse.body as {
      member: {
        id: string;
        fullName: string;
        memberNumber: string;
        status: string;
      };
    };

    expect(createdMemberBody.member).toMatchObject({
      fullName: 'Nour Mansour',
      status: 'active',
    });
    expect(createdMemberBody.member.memberNumber).toMatch(/^MEM-\d{4}$/);

    const memberResponse = await request(getHttpServer())
      .get(`/api/members/${createdMemberBody.member.id}`)
      .set('Cookie', sessionCookies)
      .expect(200);

    const memberBody = memberResponse.body as {
      member: {
        id: string;
        fullName: string;
        memberNumber: string;
        status: string;
      };
    };

    expect(memberBody.member).toMatchObject({
      id: createdMemberBody.member.id,
      fullName: 'Nour Mansour',
      memberNumber: createdMemberBody.member.memberNumber,
      status: 'active',
    });

    const updateMemberResponse = await request(getHttpServer())
      .patch(`/api/members/${createdMemberBody.member.id}`)
      .set('Cookie', sessionCookies)
      .send({
        fullName: 'Nour A. Mansour',
        status: 'inactive',
      })
      .expect(200);

    const updatedMemberBody = updateMemberResponse.body as {
      member: {
        id: string;
        fullName: string;
        memberNumber: string;
        status: string;
      };
    };

    expect(updatedMemberBody.member).toMatchObject({
      id: createdMemberBody.member.id,
      fullName: 'Nour A. Mansour',
      memberNumber: createdMemberBody.member.memberNumber,
      status: 'inactive',
    });
  });

  it('lists, creates, retrieves, and updates branches', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'owner@sparkgym.local',
        password: 'owner123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const listResponse = await request(getHttpServer())
      .get('/api/branches')
      .set('Cookie', sessionCookies)
      .expect(200);

    const listBody = listResponse.body as {
      branches: Array<{ id: string; name: string; status: string }>;
    };
    expect(listBody.branches.length).toBeGreaterThanOrEqual(2);
    expect(listBody.branches.every((b) => b.status === 'active')).toBe(true);

    const createResponse = await request(getHttpServer())
      .post('/api/branches')
      .set('Cookie', sessionCookies)
      .send({
        name: 'Hebron South Branch',
        address: 'King David St, Hebron',
        phone: '+970-2-222-0000',
      })
      .expect(201);

    const createBody = createResponse.body as {
      branch: { id: string; name: string; status: string; address: string };
    };
    expect(createBody.branch).toMatchObject({
      name: 'Hebron South Branch',
      address: 'King David St, Hebron',
      status: 'active',
    });

    const getResponse = await request(getHttpServer())
      .get(`/api/branches/${createBody.branch.id}`)
      .set('Cookie', sessionCookies)
      .expect(200);

    const getBody = getResponse.body as {
      branch: { id: string; name: string };
    };
    expect(getBody.branch.id).toBe(createBody.branch.id);

    const updateResponse = await request(getHttpServer())
      .patch(`/api/branches/${createBody.branch.id}`)
      .set('Cookie', sessionCookies)
      .send({ status: 'inactive' })
      .expect(200);

    const updateBody = updateResponse.body as {
      branch: { id: string; status: string };
    };
    expect(updateBody.branch.status).toBe('inactive');

    await request(getHttpServer())
      .get(`/api/branches/non-existent-branch`)
      .set('Cookie', sessionCookies)
      .expect(404);
  });

  it('lists, creates, and retrieves staff users and roles', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'owner@sparkgym.local',
        password: 'owner123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const rolesResponse = await request(getHttpServer())
      .get('/api/roles')
      .set('Cookie', sessionCookies)
      .expect(200);

    const rolesBody = rolesResponse.body as {
      roles: Array<{ id: string; label: string }>;
    };
    expect(rolesBody.roles.map((r) => r.id)).toEqual(
      expect.arrayContaining(['owner', 'manager', 'front-desk']),
    );

    const listUsersResponse = await request(getHttpServer())
      .get('/api/users')
      .set('Cookie', sessionCookies)
      .expect(200);

    const listUsersBody = listUsersResponse.body as {
      users: Array<{ email: string }>;
    };
    expect(listUsersBody.users.length).toBeGreaterThanOrEqual(2);

    const createUserResponse = await request(getHttpServer())
      .post('/api/users')
      .set('Cookie', sessionCookies)
      .send({
        email: 'manager@sparkgym.local',
        name: 'Branch Manager',
        role: 'manager',
        password: 'manager123',
        branchId: 'Platinum Fitness',
        branchName: 'Ramallah Main Branch',
      })
      .expect(201);

    const createUserBody = createUserResponse.body as {
      user: { id: string; email: string; name: string; role: string };
    };

    expect(createUserBody.user).toMatchObject({
      email: 'manager@sparkgym.local',
      name: 'Branch Manager',
      role: 'manager',
    });

    const getUserResponse = await request(getHttpServer())
      .get(`/api/users/${createUserBody.user.id}`)
      .set('Cookie', sessionCookies)
      .expect(200);

    const getUserBody = getUserResponse.body as {
      user: { id: string; name: string };
    };
    expect(getUserBody.user.id).toBe(createUserBody.user.id);

    const newManagerSignIn = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({ identifier: 'manager@sparkgym.local', password: 'manager123' })
      .expect(200);

    const newManagerBody = newManagerSignIn.body as { user: { role: string } };
    expect(newManagerBody.user.role).toBe('manager');
  });

  it('rejects branch creation with missing name', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'owner@sparkgym.local',
        password: 'owner123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    await request(getHttpServer())
      .post('/api/branches')
      .set('Cookie', sessionCookies)
      .send({ address: 'Some street' })
      .expect(400);
  });

  it('rejects duplicate user email on create', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'owner@sparkgym.local',
        password: 'owner123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    await request(getHttpServer())
      .post('/api/users')
      .set('Cookie', sessionCookies)
      .send({
        email: 'owner@sparkgym.local',
        name: 'Duplicate Owner',
        role: 'owner',
        password: 'owner123',
        branchId: 'Platinum Fitness',
        branchName: 'Ramallah Main Branch',
      })
      .expect(400);
  });

  it('rejects invalid credentials', () => {
    return request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'wrong-password',
      })
      .expect(401);
  });

  it('sells a membership and lists it under the member', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const createMemberResponse = await request(getHttpServer())
      .post('/api/members')
      .set('Cookie', sessionCookies)
      .send({ fullName: 'Sami Khalil' })
      .expect(201);

    const memberId = (createMemberResponse.body as { member: { id: string } })
      .member.id;

    const createMembershipResponse = await request(getHttpServer())
      .post('/api/memberships')
      .set('Cookie', sessionCookies)
      .send({
        memberId,
        planId: 'plan-monthly-flex',
        startDate: '2026-06-05',
        status: 'active',
      })
      .expect(201);

    const membershipBody = createMembershipResponse.body as {
      membership: {
        id: string;
        memberId: string;
        status: string;
        endDate: string;
        finalPrice: number;
      };
    };

    expect(membershipBody.membership.memberId).toBe(memberId);
    expect(membershipBody.membership.status).toBe('active');
    expect(membershipBody.membership.endDate).toBe('2026-07-05');
    expect(membershipBody.membership.finalPrice).toBe(120);

    const memberMembershipsResponse = await request(getHttpServer())
      .get(`/api/memberships/member/${memberId}`)
      .set('Cookie', sessionCookies)
      .expect(200);

    const membershipsBody = memberMembershipsResponse.body as {
      memberships: Array<{
        id: string;
        status: string;
        plan: { name: string } | null;
      }>;
    };

    expect(membershipsBody.memberships).toHaveLength(1);
    expect(membershipsBody.memberships[0].status).toBe('active');
    expect(membershipsBody.memberships[0].plan?.name).toBe('Monthly Flex');
  });

  it('rejects a second active membership for the same member', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const createMemberResponse = await request(getHttpServer())
      .post('/api/members')
      .set('Cookie', sessionCookies)
      .send({ fullName: 'Hana Yousef' })
      .expect(201);

    const memberId = (createMemberResponse.body as { member: { id: string } })
      .member.id;

    await request(getHttpServer())
      .post('/api/memberships')
      .set('Cookie', sessionCookies)
      .send({
        memberId,
        planId: 'plan-monthly-flex',
        startDate: '2026-06-05',
        status: 'active',
      })
      .expect(201);

    await request(getHttpServer())
      .post('/api/memberships')
      .set('Cookie', sessionCookies)
      .send({
        memberId,
        planId: 'plan-ramallah-standard',
        startDate: '2026-06-05',
        status: 'active',
      })
      .expect(400);
  });

  it('records a payment and lists it under the member', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const createMemberResponse = await request(getHttpServer())
      .post('/api/members')
      .set('Cookie', sessionCookies)
      .send({ fullName: 'Riad Mansour' })
      .expect(201);

    const memberId = (createMemberResponse.body as { member: { id: string } })
      .member.id;

    const createMembershipResponse = await request(getHttpServer())
      .post('/api/memberships')
      .set('Cookie', sessionCookies)
      .send({
        memberId,
        planId: 'plan-monthly-flex',
        startDate: '2026-06-05',
      })
      .expect(201);

    const membershipId = (
      createMembershipResponse.body as { membership: { id: string } }
    ).membership.id;

    const createPaymentResponse = await request(getHttpServer())
      .post('/api/payments')
      .set('Cookie', sessionCookies)
      .send({
        memberId,
        membershipId,
        amount: 120,
        paymentDate: '2026-06-05T10:00:00.000Z',
        status: 'paid',
        paymentMethod: 'card',
      })
      .expect(201);

    const paymentBody = createPaymentResponse.body as {
      payment: { id: string; memberId: string; amount: number; status: string };
    };

    expect(paymentBody.payment.memberId).toBe(memberId);
    expect(paymentBody.payment.amount).toBe(120);
    expect(paymentBody.payment.status).toBe('paid');

    const memberPaymentsResponse = await request(getHttpServer())
      .get(`/api/payments/member/${memberId}`)
      .set('Cookie', sessionCookies)
      .expect(200);

    const paymentsBody = memberPaymentsResponse.body as {
      payments: Array<{ id: string; amount: number; memberId: string }>;
    };

    expect(paymentsBody.payments).toHaveLength(1);
    expect(paymentsBody.payments[0].memberId).toBe(memberId);
    expect(paymentsBody.payments[0].amount).toBe(120);
  });

  it('grants access and records a visit for a valid active member', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const checkInResponse = await request(getHttpServer())
      .post('/api/visits/check-in')
      .set('Cookie', sessionCookies)
      .send({ memberIdentifier: 'MEM-0001', accessMethod: 'manual' })
      .expect(200);

    const checkInBody = checkInResponse.body as {
      granted: boolean;
      member?: { fullName: string; memberNumber: string };
      membership?: { status: string; plan: { name: string } | null };
      visit?: { id: string; accessMethod: string };
    };

    expect(checkInBody.granted).toBe(true);
    expect(checkInBody.member?.fullName).toBe('Lina Ahmad');
    expect(checkInBody.member?.memberNumber).toBe('MEM-0001');
    expect(checkInBody.membership?.status).toBe('active');
    expect(checkInBody.visit?.accessMethod).toBe('manual');

    const visitsResponse = await request(getHttpServer())
      .get('/api/visits')
      .set('Cookie', sessionCookies)
      .expect(200);

    const visitsBody = visitsResponse.body as { visits: Array<{ id: string }> };
    expect(visitsBody.visits.length).toBeGreaterThan(0);
  });

  it('denies access for a member not found', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const checkInResponse = await request(getHttpServer())
      .post('/api/visits/check-in')
      .set('Cookie', sessionCookies)
      .send({ memberIdentifier: 'MEM-9999', accessMethod: 'manual' })
      .expect(200);

    const checkInBody = checkInResponse.body as {
      granted: boolean;
      reason: string;
    };
    expect(checkInBody.granted).toBe(false);
    expect(checkInBody.reason).toMatch(/not found/i);
  });

  it('denies access for a member with no active membership', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const createMemberResponse = await request(getHttpServer())
      .post('/api/members')
      .set('Cookie', sessionCookies)
      .send({ fullName: 'No Membership Member' })
      .expect(201);

    const memberId = (
      createMemberResponse.body as { member: { memberNumber: string } }
    ).member.memberNumber;

    const checkInResponse = await request(getHttpServer())
      .post('/api/visits/check-in')
      .set('Cookie', sessionCookies)
      .send({ memberIdentifier: memberId, accessMethod: 'manual' })
      .expect(200);

    const checkInBody = checkInResponse.body as {
      granted: boolean;
      reason: string;
    };
    expect(checkInBody.granted).toBe(false);
    expect(checkInBody.reason).toMatch(/membership/i);
  });

  it('lists notifications scoped to the authenticated tenant', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const notificationsResponse = await request(getHttpServer())
      .get('/api/notifications')
      .set('Cookie', sessionCookies)
      .expect(200);

    const notificationsBody = notificationsResponse.body as {
      notifications: Array<{
        id: string;
        tenantId: string;
        channel: string;
        status: string;
      }>;
    };

    expect(notificationsBody.notifications.length).toBeGreaterThan(0);
    expect(
      notificationsBody.notifications.every(
        (n) => n.tenantId === 'tenant-spark-gym',
      ),
    ).toBe(true);
    expect(
      notificationsBody.notifications.find(
        (n) => n.tenantId === 'tenant-other-gym',
      ),
    ).toBeUndefined();
  });

  it('raises a pending membershipActivated notification when a membership is sold', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const createMemberResponse = await request(getHttpServer())
      .post('/api/members')
      .set('Cookie', sessionCookies)
      .send({ fullName: 'Notification Test Member', phone: '+970-59-000-0000' })
      .expect(201);

    const memberId = (createMemberResponse.body as { member: { id: string } })
      .member.id;

    const createMembershipResponse = await request(getHttpServer())
      .post('/api/memberships')
      .set('Cookie', sessionCookies)
      .send({
        memberId,
        planId: 'plan-ramallah-standard',
        startDate: '2026-06-01',
      })
      .expect(201);

    const membershipId = (
      createMembershipResponse.body as { membership: { id: string } }
    ).membership.id;

    const notificationsResponse = await request(getHttpServer())
      .get('/api/notifications')
      .set('Cookie', sessionCookies)
      .expect(200);

    const notifications = (
      notificationsResponse.body as {
        notifications: Array<{
          memberId: string;
          event?: string;
          relatedId?: string;
          status: string;
        }>;
      }
    ).notifications;

    const raised = notifications.find(
      (n) =>
        n.memberId === memberId &&
        n.event === 'membershipActivated' &&
        n.relatedId === membershipId,
    );

    expect(raised).toBeDefined();
    // Notifications are dispatched immediately on creation, so status is 'sent' by the time we read it
    expect(raised?.status).toBe('sent');
  });

  it('auto-dispatches a notification on creation and rejects re-dispatch', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({ identifier: 'owner@sparkgym.local', password: 'owner123' })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const createMemberResponse = await request(getHttpServer())
      .post('/api/members')
      .set('Cookie', sessionCookies)
      .send({
        fullName: 'Dispatch Test Member',
        phone: '+970-59-111-1111',
        email: 'dispatch-test-member@example.com',
      })
      .expect(201);

    const memberId = (createMemberResponse.body as { member: { id: string } })
      .member.id;

    const createMembershipResponse = await request(getHttpServer())
      .post('/api/memberships')
      .set('Cookie', sessionCookies)
      .send({
        memberId,
        planId: 'plan-ramallah-standard',
        startDate: '2026-06-01',
      })
      .expect(201);

    const membershipId = (
      createMembershipResponse.body as { membership: { id: string } }
    ).membership.id;

    const notificationsResponse = await request(getHttpServer())
      .get('/api/notifications')
      .set('Cookie', sessionCookies)
      .expect(200);

    // Notification should already be dispatched (status: 'sent') since dispatch happens on creation
    const sent = (
      notificationsResponse.body as {
        notifications: Array<{
          id: string;
          relatedId?: string;
          status: string;
          sentAt?: string;
        }>;
      }
    ).notifications.find(
      (n) => n.relatedId === membershipId && n.status === 'sent',
    );

    expect(sent).toBeDefined();
    expect(sent?.sentAt).toBeDefined();

    // Re-dispatching an already-sent notification is rejected
    await request(getHttpServer())
      .post(`/api/notifications/${sent?.id}/dispatch`)
      .set('Cookie', sessionCookies)
      .expect(400);
  });

  it('scans for membership expiry and raises notifications, restricted to owner/manager', async () => {
    const frontdeskSignIn = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    await request(getHttpServer())
      .post('/api/notifications/scan')
      .set('Cookie', frontdeskSignIn.get('Set-Cookie'))
      .expect(403);

    const ownerSignIn = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({ identifier: 'owner@sparkgym.local', password: 'owner123' })
      .expect(200);

    const sessionCookies = ownerSignIn.get('Set-Cookie');

    const scanResponse = await request(getHttpServer())
      .post('/api/notifications/scan')
      .set('Cookie', sessionCookies)
      .expect(201);

    expect((scanResponse.body as { created: number }).created).toBeGreaterThan(
      0,
    );

    // Re-running the scan should not raise duplicate notifications for the same membership/event
    const rescanResponse = await request(getHttpServer())
      .post('/api/notifications/scan')
      .set('Cookie', sessionCookies)
      .expect(201);

    expect((rescanResponse.body as { created: number }).created).toBe(0);
  });

  it('returns active memberships report scoped to tenant', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const reportResponse = await request(getHttpServer())
      .get('/api/reports/active-memberships')
      .set('Cookie', sessionCookies)
      .expect(200);

    const reportBody = reportResponse.body as {
      rows: Array<{
        membershipId: string;
        memberName: string | null;
        planName: string | null;
        status: string;
      }>;
      total: number;
      asOfDate: string;
    };

    expect(reportBody.total).toBeGreaterThan(0);
    expect(reportBody.rows.every((r) => r.status === 'active')).toBe(true);
    expect(reportBody.asOfDate).toBeTruthy();
  });

  it('returns payments report and totals for tenant branch scope', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const reportResponse = await request(getHttpServer())
      .get('/api/reports/payments')
      .set('Cookie', sessionCookies)
      .expect(200);

    const reportBody = reportResponse.body as {
      rows: Array<{ paymentId: string; amount: number }>;
      total: number;
      totalPaid: number;
      dateFrom: string;
      dateTo: string;
    };

    expect(typeof reportBody.total).toBe('number');
    expect(typeof reportBody.totalPaid).toBe('number');
    expect(reportBody.dateFrom).toBeTruthy();
  });

  it('rejects payment with zero or negative amount', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    await request(getHttpServer())
      .post('/api/payments')
      .set('Cookie', sessionCookies)
      .send({
        memberId: 'member-001',
        membershipId: 'membership-001',
        amount: 0,
        paymentDate: '2026-06-05T10:00:00.000Z',
      })
      .expect(400);
  });

  it('renews a membership and marks the previous one as expired', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const createMemberResponse = await request(getHttpServer())
      .post('/api/members')
      .set('Cookie', sessionCookies)
      .send({ fullName: 'Renew Test Member' })
      .expect(201);

    const memberId = (createMemberResponse.body as { member: { id: string } })
      .member.id;

    const createMembershipResponse = await request(getHttpServer())
      .post('/api/memberships')
      .set('Cookie', sessionCookies)
      .send({ memberId, planId: 'plan-monthly-flex', startDate: '2026-06-01' })
      .expect(201);

    const membershipId = (
      createMembershipResponse.body as { membership: { id: string } }
    ).membership.id;

    const renewResponse = await request(getHttpServer())
      .post(`/api/memberships/${membershipId}/renew`)
      .set('Cookie', sessionCookies)
      .send({})
      .expect(201);

    const renewBody = renewResponse.body as {
      membership: {
        id: string;
        status: string;
        startDate: string;
        previousMembershipId: string;
      };
    };

    expect(renewBody.membership.status).toBe('active');
    expect(renewBody.membership.previousMembershipId).toBe(membershipId);
    expect(renewBody.membership.startDate).toBe('2026-07-02');

    const oldMembershipResponse = await request(getHttpServer())
      .get(`/api/memberships/${membershipId}`)
      .set('Cookie', sessionCookies)
      .expect(200);

    const oldMembership = oldMembershipResponse.body as {
      membership: { status: string };
    };
    expect(oldMembership.membership.status).toBe('expired');
  });

  it('freezes an eligible membership and extends the end date', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const createMemberResponse = await request(getHttpServer())
      .post('/api/members')
      .set('Cookie', sessionCookies)
      .send({ fullName: 'Freeze Test Member' })
      .expect(201);

    const memberId = (createMemberResponse.body as { member: { id: string } })
      .member.id;

    const createMembershipResponse = await request(getHttpServer())
      .post('/api/memberships')
      .set('Cookie', sessionCookies)
      .send({ memberId, planId: 'plan-monthly-flex', startDate: '2026-06-01' })
      .expect(201);

    const membershipId = (
      createMembershipResponse.body as {
        membership: { id: string; endDate: string };
      }
    ).membership.id;

    const freezeResponse = await request(getHttpServer())
      .post(`/api/memberships/${membershipId}/freeze`)
      .set('Cookie', sessionCookies)
      .send({ startDate: '2026-06-10', endDate: '2026-06-14' })
      .expect(201);

    const freezeBody = freezeResponse.body as {
      freeze: {
        id: string;
        membershipId: string;
        startDate: string;
        endDate: string;
      };
      membership: { id: string; status: string; endDate: string };
    };

    expect(freezeBody.freeze.membershipId).toBe(membershipId);
    expect(freezeBody.membership.status).toBe('frozen');
    expect(freezeBody.membership.endDate).toBe('2026-07-05');

    const freezesResponse = await request(getHttpServer())
      .get(`/api/memberships/${membershipId}/freezes`)
      .set('Cookie', sessionCookies)
      .expect(200);

    const freezesBody = freezesResponse.body as {
      freezes: Array<{ id: string; membershipId: string }>;
    };
    expect(freezesBody.freezes).toHaveLength(1);
    expect(freezesBody.freezes[0].membershipId).toBe(membershipId);
  });

  it('rejects freeze on a membership plan that does not allow freezes', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const createMemberResponse = await request(getHttpServer())
      .post('/api/members')
      .set('Cookie', sessionCookies)
      .send({ fullName: 'No Freeze Plan Member' })
      .expect(201);

    const memberId = (createMemberResponse.body as { member: { id: string } })
      .member.id;

    const createMembershipResponse = await request(getHttpServer())
      .post('/api/memberships')
      .set('Cookie', sessionCookies)
      .send({
        memberId,
        planId: 'plan-ramallah-standard',
        startDate: '2026-06-01',
      })
      .expect(201);

    const membershipId = (
      createMembershipResponse.body as { membership: { id: string } }
    ).membership.id;

    await request(getHttpServer())
      .post(`/api/memberships/${membershipId}/freeze`)
      .set('Cookie', sessionCookies)
      .send({ startDate: '2026-06-10', endDate: '2026-06-14' })
      .expect(400);
  });

  it('rejects front-desk users from owner/manager-only endpoints', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    // PATCH /settings is owner-only
    await request(getHttpServer())
      .patch('/api/settings')
      .set('Cookie', sessionCookies)
      .send({ defaultLanguage: 'ar' })
      .expect(403);

    // POST /branches is owner+manager only
    await request(getHttpServer())
      .post('/api/branches')
      .set('Cookie', sessionCookies)
      .send({ name: 'Unauthorized Branch' })
      .expect(403);

    // POST /memberships/plans is owner+manager only
    await request(getHttpServer())
      .post('/api/memberships/plans')
      .set('Cookie', sessionCookies)
      .send({
        name: 'Unauthorized Plan',
        planType: 'duration',
        durationDays: 30,
      })
      .expect(403);

    // GET /users is owner+manager only
    await request(getHttpServer())
      .get('/api/users')
      .set('Cookie', sessionCookies)
      .expect(403);
  });

  it('allows owner to call owner/manager-only endpoints', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({ identifier: 'owner@sparkgym.local', password: 'owner123' })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    // PATCH /settings succeeds for owner
    await request(getHttpServer())
      .patch('/api/settings')
      .set('Cookie', sessionCookies)
      .send({ defaultLanguage: 'en' })
      .expect(200);

    // GET /users succeeds for owner
    await request(getHttpServer())
      .get('/api/users')
      .set('Cookie', sessionCookies)
      .expect(200);
  });

  it('unfreezes a frozen membership and sets it back to active', async () => {
    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        identifier: 'frontdesk@sparkgym.local',
        password: 'frontdesk123',
      })
      .expect(200);

    const sessionCookies = signInResponse.get('Set-Cookie');

    const createMemberResponse = await request(getHttpServer())
      .post('/api/members')
      .set('Cookie', sessionCookies)
      .send({ fullName: 'Freeze Unfreeze Member' })
      .expect(201);

    const memberId = (createMemberResponse.body as { member: { id: string } })
      .member.id;

    const createMembershipResponse = await request(getHttpServer())
      .post('/api/memberships')
      .set('Cookie', sessionCookies)
      .send({ memberId, planId: 'plan-monthly-flex', startDate: '2026-06-01' })
      .expect(201);

    const membershipId = (
      createMembershipResponse.body as { membership: { id: string } }
    ).membership.id;

    // Freeze the membership first
    await request(getHttpServer())
      .post(`/api/memberships/${membershipId}/freeze`)
      .set('Cookie', sessionCookies)
      .send({ startDate: '2026-06-05', endDate: '2026-06-10' })
      .expect(201);

    // Verify it is frozen
    const frozenResponse = await request(getHttpServer())
      .get(`/api/memberships/${membershipId}`)
      .set('Cookie', sessionCookies)
      .expect(200);

    expect(
      (frozenResponse.body as { membership: { status: string } }).membership
        .status,
    ).toBe('frozen');

    // Unfreeze
    const unfreezeResponse = await request(getHttpServer())
      .post(`/api/memberships/${membershipId}/unfreeze`)
      .set('Cookie', sessionCookies)
      .expect(201);

    expect(
      (unfreezeResponse.body as { membership: { status: string } }).membership
        .status,
    ).toBe('active');

    // Attempting to unfreeze again should fail
    await request(getHttpServer())
      .post(`/api/memberships/${membershipId}/unfreeze`)
      .set('Cookie', sessionCookies)
      .expect(400);
  });

  it('BAS-IP access: grants entry for a member with an assigned RFID tag and active membership', async () => {
    process.env.DEVICE_TOKEN = 'test-device-token';

    const signInResponse = await request(getHttpServer())
      .post('/api/auth/sign-in')
      .send({ identifier: 'owner@sparkgym.local', password: 'owner123' })
      .expect(200);
    const sessionCookies = signInResponse.get('Set-Cookie');

    // Create a member and assign an RFID tag
    const memberResponse = await request(getHttpServer())
      .post('/api/members')
      .set('Cookie', sessionCookies)
      .send({ fullName: 'RFID Tester', rfidTag: 'AABBCCDD' })
      .expect(201);
    const memberId = (memberResponse.body as { member: { id: string } }).member.id;

    // Sell an active membership
    const plansResponse = await request(getHttpServer())
      .get('/api/memberships/plans')
      .set('Cookie', sessionCookies)
      .expect(200);
    const planId = (plansResponse.body as { plans: { id: string }[] }).plans[0].id;

    const today = new Date().toISOString().slice(0, 10);
    await request(getHttpServer())
      .post('/api/memberships')
      .set('Cookie', sessionCookies)
      .send({ memberId, planId, startDate: today })
      .expect(201);

    // BAS-IP device POSTs with real payload format → granted
    const grantedResponse = await request(getHttpServer())
      .post('/api/access/bas-ip?branchId=Platinum Fitness&token=test-device-token')
      .send({ identifier_number: 'AABBCCDD', identifier_type: 'card' })
      .expect(200);

    expect(grantedResponse.body).toMatchObject({
      handled: true,
      access: { granted: true, lock_number: 1 },
    });
  });

  it('BAS-IP access: denies entry for an unknown card', async () => {
    process.env.DEVICE_TOKEN = 'test-device-token';

    const deniedResponse = await request(getHttpServer())
      .post('/api/access/bas-ip?branchId=Platinum Fitness&token=test-device-token')
      .send({ identifier_number: 'UNKNOWN00', identifier_type: 'card' })
      .expect(200);

    expect(deniedResponse.body).toMatchObject({
      handled: true,
      access: { granted: false },
    });
  });

  it('BAS-IP access: rejects requests with an invalid token', async () => {
    process.env.DEVICE_TOKEN = 'test-device-token';

    await request(getHttpServer())
      .post('/api/access/bas-ip?branchId=Platinum Fitness&token=wrong-token')
      .send({ identifier_number: 'AABBCCDD', identifier_type: 'card' })
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
