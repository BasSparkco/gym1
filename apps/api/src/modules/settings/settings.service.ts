import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DateFormat,
  Language,
  LogoMode,
  NotificationSenderSettings,
  NotificationSettings,
  OwnerDataScope,
  TenantSettingsRecord,
  getDefaultTenantSettings,
} from '../../data/settings-seed';
import { PrismaService } from '../../prisma/prisma.service';
import { isValidCurrencyCode } from '../../common/currencies';

const VALID_LANGUAGES = new Set<Language>(['en', 'ar', 'he']);
const VALID_DATE_FORMATS = new Set<DateFormat>(['dd/mm/yyyy', 'mm/dd/yyyy']);
const VALID_OWNER_DATA_SCOPES = new Set<OwnerDataScope>([
  'all',
  'activeBranch',
]);
const VALID_LOGO_MODES = new Set<LogoMode>(['shared', 'perBranch']);

export type UpdateSettingsInput = {
  defaultLanguage?: string;
  enabledLanguages?: string[];
  notificationSettings?: NotificationSettings;
  notificationSenders?: NotificationSenderSettings;
  dateFormat?: string;
  checkOutTrackingEnabled?: boolean;
  ownerDataScope?: string;
  reportingCurrencyCode?: string;
  logoMode?: string;
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettingsForTenant(tenantId: string): Promise<TenantSettingsRecord> {
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
      reportingCurrencyCode:
        found.reportingCurrencyCode ?? defaults.reportingCurrencyCode,
      logoMode: found.logoMode ?? defaults.logoMode,
      logoUrl: found.logoUrl ?? defaults.logoUrl,
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

    const rawReportingCurrencyCode = (
      input.reportingCurrencyCode ?? current.reportingCurrencyCode
    )
      .trim()
      .toUpperCase();

    if (!isValidCurrencyCode(rawReportingCurrencyCode)) {
      throw new BadRequestException('Invalid reporting currency.');
    }

    const reportingCurrencyCode = rawReportingCurrencyCode;

    const rawLogoMode = input.logoMode ?? current.logoMode;
    const logoMode = VALID_LOGO_MODES.has(rawLogoMode as LogoMode)
      ? (rawLogoMode as LogoMode)
      : current.logoMode;

    const next: TenantSettingsRecord = {
      tenantId,
      defaultLanguage,
      enabledLanguages: uniqueEnabled,
      notificationSettings,
      notificationSenders,
      dateFormat,
      checkOutTrackingEnabled,
      ownerDataScope,
      reportingCurrencyCode,
      logoMode,
      logoUrl: current.logoUrl,
    };

    await this.prisma.tenantSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        defaultLanguage,
        enabledLanguages,
        notificationSettings: notificationSettings,
        notificationSenders: notificationSenders,
        dateFormat,
        checkOutTrackingEnabled,
        ownerDataScope,
        reportingCurrencyCode,
        logoMode,
      },
      update: {
        defaultLanguage,
        enabledLanguages,
        notificationSettings: notificationSettings,
        notificationSenders: notificationSenders,
        dateFormat,
        checkOutTrackingEnabled,
        ownerDataScope,
        reportingCurrencyCode,
        logoMode,
      },
    });

    return next;
  }

  async updateTenantLogo(
    tenantId: string,
    logoUrl: string | null,
  ): Promise<TenantSettingsRecord> {
    const current = await this.getSettingsForTenant(tenantId);

    await this.prisma.tenantSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        defaultLanguage: current.defaultLanguage,
        enabledLanguages: current.enabledLanguages,
        notificationSettings: current.notificationSettings,
        notificationSenders: current.notificationSenders,
        dateFormat: current.dateFormat,
        checkOutTrackingEnabled: current.checkOutTrackingEnabled,
        ownerDataScope: current.ownerDataScope,
        reportingCurrencyCode: current.reportingCurrencyCode,
        logoMode: current.logoMode,
        logoUrl,
      },
      update: { logoUrl },
    });

    return { ...current, logoUrl };
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
