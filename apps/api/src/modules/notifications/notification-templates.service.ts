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

// Recipients otherwise have no way to tell which branch/organization a
// message came from — WhatsApp never surfaces `subject` (SparkcoNotificationProvider
// only forwards it for email), so this is prepended to `body`, the one part
// of every rendered message every channel actually shows. Not part of the
// owner-editable template text itself (see templatesLanguageNote on the
// templates page) so it can't be accidentally dropped when a template is
// customized.
const FROM_LABEL: Record<Language, string> = {
  en: 'From',
  ar: 'من',
  he: 'מאת',
};

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
        const defaultText = fallback.translations[lang];

        return {
          templateKey,
          lang,
          subject: override?.subject ?? defaultText.subject,
          body: override?.body ?? defaultText.body,
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
        DEFAULT_NOTIFICATION_TEMPLATES[
          row.templateKey as NotificationTemplateKey
        ].variables,
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
   * (templateKey, lang) override, else the in-code default for that
   * language — every language has real in-code text, so there's no need to
   * fall back across languages.
   *
   * `branchName` is prepended to the body as a localized "From: <branch>"
   * line — not a template variable, since it must survive even in a
   * template an owner has customized (see FROM_LABEL above).
   */
  async getRenderedTemplate(
    tenantId: string,
    templateKey: NotificationTemplateKey,
    lang: Language,
    variables: Record<string, string>,
    branchName: string,
  ): Promise<RenderedNotification> {
    const row = await this.prisma.notificationTemplate.findUnique({
      where: { tenantId_templateKey_lang: { tenantId, templateKey, lang } },
    });

    const base =
      row ?? DEFAULT_NOTIFICATION_TEMPLATES[templateKey].translations[lang];
    const renderedBody = renderNotificationTemplate(base.body, variables);

    return {
      subject: renderNotificationTemplate(base.subject, variables),
      body: `${FROM_LABEL[lang]}: ${branchName}\n\n${renderedBody}`,
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
