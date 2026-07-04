import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DateFormat,
  Language,
  NotificationSenderSettings,
  NotificationSettings,
  OwnerDataScope,
  TenantSettingsRecord,
  getDefaultTenantSettings,
} from '../../data/settings-store';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const VALID_LANGUAGES = new Set<Language>(['en', 'ar', 'he']);
const VALID_DATE_FORMATS = new Set<DateFormat>(['dd/mm/yyyy', 'mm/dd/yyyy']);
const VALID_OWNER_DATA_SCOPES = new Set<OwnerDataScope>(['all', 'activeBranch']);

export type UpdateSettingsInput = {
  defaultLanguage?: string;
  enabledLanguages?: string[];
  notificationSettings?: NotificationSettings;
  notificationSenders?: NotificationSenderSettings;
  dateFormat?: string;
  checkOutTrackingEnabled?: boolean;
  ownerDataScope?: string;
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettingsForTenant(
    tenantId: string,
  ): Promise<TenantSettingsRecord> {
    const found = await this.prisma.tenantSettings.findUnique({
      where: { tenantId },
    });
    const defaults = getDefaultTenantSettings(tenantId);

    if (!found) {
      return defaults;
    }

    return {
      tenantId: found.tenantId,
      defaultLanguage: found.defaultLanguage as Language,
      enabledLanguages: found.enabledLanguages as Language[],
      notificationSettings:
        (found.notificationSettings as unknown as NotificationSettings) ??
        defaults.notificationSettings,
      notificationSenders:
        (found.notificationSenders as unknown as NotificationSenderSettings) ??
        defaults.notificationSenders,
      dateFormat: (found.dateFormat as DateFormat) ?? defaults.dateFormat,
      checkOutTrackingEnabled:
        found.checkOutTrackingEnabled ?? defaults.checkOutTrackingEnabled,
      ownerDataScope:
        (found.ownerDataScope as OwnerDataScope) ?? defaults.ownerDataScope,
    };
  }

  async updateSettingsForTenant(
    tenantId: string,
    input: UpdateSettingsInput,
  ): Promise<TenantSettingsRecord> {
    const current = await this.getSettingsForTenant(tenantId);

    const defaultLanguage = (input.defaultLanguage ??
      current.defaultLanguage) as Language;
    const enabledLanguages = (input.enabledLanguages ??
      current.enabledLanguages) as Language[];

    if (!VALID_LANGUAGES.has(defaultLanguage)) {
      throw new BadRequestException('Invalid default language.');
    }

    const uniqueEnabled = [...new Set(enabledLanguages)].filter((lang) =>
      VALID_LANGUAGES.has(lang),
    );

    if (uniqueEnabled.length === 0) {
      throw new BadRequestException('At least one language must be enabled.');
    }

    if (!uniqueEnabled.includes(defaultLanguage)) {
      throw new BadRequestException(
        'The default language must be in the enabled languages list.',
      );
    }

    const notificationSettings =
      input.notificationSettings ?? current.notificationSettings;

    const notificationSenders = input.notificationSenders
      ? this.normalizeNotificationSenders(input.notificationSenders)
      : current.notificationSenders;

    const rawDateFormat = input.dateFormat ?? current.dateFormat;
    const dateFormat = VALID_DATE_FORMATS.has(rawDateFormat as DateFormat)
      ? (rawDateFormat as DateFormat)
      : current.dateFormat;

    const checkOutTrackingEnabled =
      input.checkOutTrackingEnabled ?? current.checkOutTrackingEnabled;

    const rawOwnerDataScope = input.ownerDataScope ?? current.ownerDataScope;
    const ownerDataScope = VALID_OWNER_DATA_SCOPES.has(
      rawOwnerDataScope as OwnerDataScope,
    )
      ? (rawOwnerDataScope as OwnerDataScope)
      : current.ownerDataScope;

    const next: TenantSettingsRecord = {
      tenantId,
      defaultLanguage,
      enabledLanguages: uniqueEnabled,
      notificationSettings,
      notificationSenders,
      dateFormat,
      checkOutTrackingEnabled,
      ownerDataScope,
    };

    await this.prisma.tenantSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        defaultLanguage,
        enabledLanguages,
        notificationSettings: notificationSettings as Prisma.InputJsonValue,
        notificationSenders: notificationSenders as Prisma.InputJsonValue,
        dateFormat,
        checkOutTrackingEnabled,
        ownerDataScope,
      },
      update: {
        defaultLanguage,
        enabledLanguages,
        notificationSettings: notificationSettings as Prisma.InputJsonValue,
        notificationSenders: notificationSenders as Prisma.InputJsonValue,
        dateFormat,
        checkOutTrackingEnabled,
        ownerDataScope,
      },
    });

    return next;
  }

  private normalizeNotificationSenders(
    input: NotificationSenderSettings,
  ): NotificationSenderSettings {
    return {
      smsFrom: input.smsFrom?.trim() || undefined,
      emailFrom: input.emailFrom?.trim().toLowerCase() || undefined,
    };
  }
}
