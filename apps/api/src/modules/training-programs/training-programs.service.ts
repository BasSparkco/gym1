import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { TrainingProgram } from '../../generated/prisma/client';

export type CreateTrainingProgramInput = {
  name?: string;
  branchId?: string | null;
  description?: string;
  color?: string;
  icon?: string;
  active?: boolean;
  maxMembers?: number;
  defaultCoachId?: string | null;
};

export type UpdateTrainingProgramInput = {
  name?: string;
  branchId?: string | null;
  description?: string;
  color?: string;
  icon?: string;
  active?: boolean;
  maxMembers?: number;
  defaultCoachId?: string | null;
};

@Injectable()
export class TrainingProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProgramsForTenant(tenantId: string, branchId?: string) {
    const programs = await this.prisma.trainingProgram.findMany({
      where: {
        tenantId,
        // A branch-scoped request should see that branch's programs plus
        // every tenant-global (branchId = null) program.
        ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
      },
    });
    return programs.map((p) => this.serialize(p));
  }

  async getProgramForTenant(tenantId: string, programId: string) {
    const program = await this.prisma.trainingProgram.findFirst({
      where: { id: programId, tenantId },
    });

    if (!program) {
      throw new NotFoundException('Training program not found.');
    }

    return this.serialize(program);
  }

  async createProgram(tenantId: string, input: CreateTrainingProgramInput) {
    const name = input.name?.trim();

    if (!name) {
      throw new BadRequestException('Training program name is required.');
    }

    if (input.branchId) {
      await this.assertBranchInTenant(tenantId, input.branchId);
    }

    if (input.defaultCoachId) {
      await this.assertEmployeeInTenant(tenantId, input.defaultCoachId);
    }

    const program = await this.prisma.trainingProgram.create({
      data: {
        id: `program-${randomUUID()}`,
        tenantId,
        name,
        branchId: input.branchId ?? null,
        description: input.description,
        color: input.color,
        icon: input.icon,
        active: input.active ?? true,
        maxMembers: input.maxMembers,
        defaultCoachId: input.defaultCoachId ?? null,
      },
    });

    return this.serialize(program);
  }

  async updateProgram(
    tenantId: string,
    programId: string,
    input: UpdateTrainingProgramInput,
  ) {
    const current = await this.prisma.trainingProgram.findFirst({
      where: { id: programId, tenantId },
    });

    if (!current) {
      throw new NotFoundException('Training program not found.');
    }

    const name = input.name === undefined ? current.name : input.name.trim();

    if (!name) {
      throw new BadRequestException('Training program name is required.');
    }

    if (input.branchId) {
      await this.assertBranchInTenant(tenantId, input.branchId);
    }

    if (input.defaultCoachId) {
      await this.assertEmployeeInTenant(tenantId, input.defaultCoachId);
    }

    const program = await this.prisma.trainingProgram.update({
      where: { id: programId },
      data: {
        name,
        ...(input.branchId !== undefined && { branchId: input.branchId }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.color !== undefined && { color: input.color }),
        ...(input.icon !== undefined && { icon: input.icon }),
        ...(input.active !== undefined && { active: input.active }),
        ...(input.maxMembers !== undefined && {
          maxMembers: input.maxMembers,
        }),
        ...(input.defaultCoachId !== undefined && {
          defaultCoachId: input.defaultCoachId,
        }),
      },
    });

    return this.serialize(program);
  }

  /** Programs a given membership plan may book: all of them when the plan
   * allows everything, otherwise only the ones explicitly entitled. */
  async listEntitledProgramIds(planId: string): Promise<string[] | 'all'> {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
      select: { allowAllPrograms: true },
    });

    if (!plan || plan.allowAllPrograms) {
      return 'all';
    }

    const links = await this.prisma.membershipPlanProgram.findMany({
      where: { planId },
      select: { programId: true },
    });
    return links.map((l) => l.programId);
  }

  async setEntitledPrograms(
    tenantId: string,
    planId: string,
    programIds: string[],
  ) {
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id: planId, tenantId },
    });

    if (!plan) {
      throw new NotFoundException('Membership plan not found.');
    }

    const programs = await this.prisma.trainingProgram.findMany({
      where: { id: { in: programIds }, tenantId },
      select: { id: true },
    });

    if (programs.length !== new Set(programIds).size) {
      throw new BadRequestException(
        'One or more training programs are invalid for this tenant.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.membershipPlanProgram.deleteMany({ where: { planId } }),
      this.prisma.membershipPlanProgram.createMany({
        data: programIds.map((programId) => ({ planId, programId })),
      }),
    ]);

    return this.listEntitledProgramIds(planId);
  }

  private async assertBranchInTenant(tenantId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
    });
    if (!branch) {
      throw new BadRequestException('Branch is invalid for this tenant.');
    }
  }

  private async assertEmployeeInTenant(tenantId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });
    if (!employee) {
      throw new BadRequestException('Coach is invalid for this tenant.');
    }
  }

  private serialize(program: TrainingProgram) {
    return { ...program };
  }
}
