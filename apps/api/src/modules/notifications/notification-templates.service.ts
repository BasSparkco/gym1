import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Language } from '../../data/settings-seed';
import {
  DEFAULT_NOTIFICATION_TEMPLATES,
  NOTIFICATION_TEMPLATE_KEYS,
  NotificationTemplateKey,
  isNotificationTemplateKey,
  renderNotificationTemplate,
} from '../../data/notification-templates-seed';

const LANGUAGES: Language[] = ['en', 'ar', 'he'];

export type NotificationTemplateView = {
  templateKey: NotificationTemplateKey;
  lang: Language;
  subject: string;
  body: string;
  variables: string[];
  isCustomized: boolean;
};

export type RenderedNotification = {
  subject: string;
  body: string;
};

@Injectable()
export class NotificationTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async listTemplatesForTenant(
    tenantId: string,
  ): Promise<NotificationTemplateView[]> {
    const rows = await this.prisma.notificationTemplate.findMany({
      where: { tenantId },
    });
    const overrides = new Map(
      rows.map((row) => [`${row.templateKey}:${row.lang}`, row]),
    );

    return NOTIFICATION_TEMPLATE_KEYS.flatMap((templateKey) => {
      const fallback = DEFAULT_NOTIFICATION_TEMPLATES[templateKey];

      return LANGUAGES.map((lang) => {
        const override = overrides.get(`${templateKey}:${lang}`);

        return {
          templateKey,
          lang,
          subject: override?.subject ?? (lang === 'en' ? fallback.subject : ''),
          body: override?.body ?? (lang === 'en' ? fallback.body : ''),
          variables: fallback.variables,
          isCustomized: Boolean(override),
        };
      });
    });
  }

  async upsertTemplate(
    tenantId: string,
    templateKey: string,
    lang: string,
    subject: string,
    body: string,
  ): Promise<NotificationTemplateView> {
    this.validateKeyAndLang(templateKey, lang);

    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();

    if (!trimmedSubject || !trimmedBody) {
      throw new BadRequestException('Subject and body are required.');
    }

    const row = await this.prisma.notificationTemplate.upsert({
      where: {
        tenantId_templateKey_lang: { tenantId, templateKey, lang },
      },
      create: {
        id: `ntpl-${randomUUID()}`,
        tenantId,
        templateKey,
        lang,
        subject: trimmedSubject,
        body: trimmedBody,
      },
      update: { subject: trimmedSubject, body: trimmedBody },
    });

    return {
      templateKey: row.templateKey as NotificationTemplateKey,
      lang: row.lang as Language,
      subject: row.subject,
      body: row.body,
      variables:
        DEFAULT_NOTIFICATION_TEMPLATES[row.templateKey as NotificationTemplateKey]
          .variables,
      isCustomized: true,
    };
  }

  async resetTemplate(
    tenantId: string,
    templateKey: string,
    lang: string,
  ): Promise<void> {
    this.validateKeyAndLang(templateKey, lang);

    await this.prisma.notificationTemplate.deleteMany({
      where: { tenantId, templateKey, lang },
    });
  }

  /**
   * Resolves and renders the subject/body actually sent: an exact
   * (templateKey, lang) override, else the tenant's `en` override, else the
   * in-code English default — a translation gap never blocks sending.
   */
  async getRenderedTemplate(
    tenantId: string,
    templateKey: NotificationTemplateKey,
    lang: Language,
    variables: Record<string, string>,
  ): Promise<RenderedNotification> {
    const exact = await this.prisma.notificationTemplate.findUnique({
      where: { tenantId_templateKey_lang: { tenantId, templateKey, lang } },
    });

    const fallbackRow =
      exact ??
      (lang !== 'en'
        ? await this.prisma.notificationTemplate.findUnique({
            where: {
              tenantId_templateKey_lang: {
                tenantId,
                templateKey,
                lang: 'en',
              },
            },
          })
        : null);

    const base = fallbackRow ?? DEFAULT_NOTIFICATION_TEMPLATES[templateKey];

    return {
      subject: renderNotificationTemplate(base.subject, variables),
      body: renderNotificationTemplate(base.body, variables),
    };
  }

  private validateKeyAndLang(templateKey: string, lang: string): void {
    if (!isNotificationTemplateKey(templateKey)) {
      throw new BadRequestException(`Unknown template key: ${templateKey}`);
    }

    if (!LANGUAGES.includes(lang as Language)) {
      throw new BadRequestException(`Unsupported language: ${lang}`);
    }
  }
}
