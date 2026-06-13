import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Language,
  NotificationSenderSettings,
  NotificationSettings,
  TenantSettingsRecord,
  getDefaultTenantSettings,
  readSettingsStore,
  writeSettingsStore,
} from '../../data/settings-store';

const VALID_LANGUAGES = new Set<Language>(['en', 'ar', 'he']);

export type UpdateSettingsInput = {
  defaultLanguage?: string;
  enabledLanguages?: string[];
  notificationSettings?: NotificationSettings;
  notificationSenders?: NotificationSenderSettings;
};

@Injectable()
export class SettingsService {
  getSettingsForTenant(tenantId: string): TenantSettingsRecord {
    const store = readSettingsStore();
    const found = store.tenants.find((record) => record.tenantId === tenantId);
    const defaults = getDefaultTenantSettings(tenantId);

    if (!found) {
      return defaults;
    }

    return {
      ...found,
      notificationSettings:
        found.notificationSettings ?? defaults.notificationSettings,
      notificationSenders:
        found.notificationSenders ?? defaults.notificationSenders,
    };
  }

  updateSettingsForTenant(
    tenantId: string,
    input: UpdateSettingsInput,
  ): TenantSettingsRecord {
    const current = this.getSettingsForTenant(tenantId);

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

    const next: TenantSettingsRecord = {
      tenantId,
      defaultLanguage,
      enabledLanguages: uniqueEnabled,
      notificationSettings,
      notificationSenders,
    };

    const store = readSettingsStore();
    const idx = store.tenants.findIndex(
      (record) => record.tenantId === tenantId,
    );

    if (idx === -1) {
      store.tenants.push(next);
    } else {
      store.tenants[idx] = next;
    }

    writeSettingsStore(store);

    return next;
  }

  private normalizeNotificationSenders(
    input: NotificationSenderSettings,
  ): NotificationSenderSettings {
    return {
      smsFrom: input.smsFrom?.trim() || undefined,
      whatsappFrom: input.whatsappFrom?.trim() || undefined,
      emailFrom: input.emailFrom?.trim().toLowerCase() || undefined,
      messagingProvider: input.messagingProvider ?? undefined,
      sentdmTemplateName: input.sentdmTemplateName?.trim() || undefined,
    };
  }
}
