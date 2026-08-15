/**
 * In-code default subject/body per notification template, in every language
 * the app supports (en/ar/he). These are the fallback used whenever a
 * tenant has no `NotificationTemplate` row for a given (templateKey, lang)
 * — new tenants and tenants that never touch the owner-editable templates
 * page keep getting exactly this text.
 *
 * `templateKey` is deliberately more granular than `NotificationEvent`:
 * `membershipActivated` (initial sale) and `membershipRenewed` (renewal)
 * both fire under the `membershipActivated` event (one Settings toggle) but
 * need independently editable wording.
 */

import type { Language } from './settings-seed';

export const NOTIFICATION_TEMPLATE_KEYS = [
  'membershipExpiring',
  'membershipExpired',
  'paymentPending',
  'membershipActivated',
  'membershipRenewed',
  'birthday',
] as const;

export type NotificationTemplateKey = (typeof NOTIFICATION_TEMPLATE_KEYS)[number];

export type NotificationTemplateText = {
  subject: string;
  body: string;
};

export type NotificationTemplateDefault = {
  /** Placeholder names usable in subject/body as `{{name}}`, shown to the
   * owner as hints on the edit page. Same across every language. */
  variables: string[];
  translations: Record<Language, NotificationTemplateText>;
};

export const DEFAULT_NOTIFICATION_TEMPLATES: Record<
  NotificationTemplateKey,
  NotificationTemplateDefault
> = {
  membershipExpiring: {
    variables: ['endDate'],
    translations: {
      en: {
        subject: 'Membership expiring soon',
        body: 'Your membership expires on {{endDate}}. Renew now to keep your access.',
      },
      ar: {
        subject: 'اشتراكك على وشك الانتهاء',
        body: 'ينتهي اشتراكك بتاريخ {{endDate}}. جدد الآن للحفاظ على دخولك.',
      },
      he: {
        subject: 'המנוי שלך עומד לפוג',
        body: 'המנוי שלך יפוג בתאריך {{endDate}}. חדש עכשיו כדי לשמור על הכניסה שלך.',
      },
    },
  },
  membershipExpired: {
    variables: [],
    translations: {
      en: {
        subject: 'Membership expired',
        body: 'Your membership has expired. Visit the front desk to renew.',
      },
      ar: {
        subject: 'انتهى الاشتراك',
        body: 'لقد انتهت صلاحية اشتراكك. يرجى زيارة مكتب الاستقبال للتجديد.',
      },
      he: {
        subject: 'המנוי פג תוקף',
        body: 'המנוי שלך פג תוקף. בקר בדלפק הקבלה כדי לחדש.',
      },
    },
  },
  paymentPending: {
    variables: ['amount', 'paymentDate'],
    translations: {
      en: {
        subject: 'Payment reminder',
        body: 'You have a pending payment of {{amount}} due on {{paymentDate}}. Please settle your balance at the front desk.',
      },
      ar: {
        subject: 'تذكير بالدفع',
        body: 'لديك دفعة مستحقة بقيمة {{amount}} تاريخ استحقاقها {{paymentDate}}. يرجى تسوية رصيدك في مكتب الاستقبال.',
      },
      he: {
        subject: 'תזכורת לתשלום',
        body: 'יש לך תשלום ממתין בסך {{amount}} שמועד פירעונו {{paymentDate}}. אנא הסדר את היתרה שלך בדלפק הקבלה.',
      },
    },
  },
  membershipActivated: {
    variables: ['planName', 'endDate', 'qrUrl', 'branchName'],
    translations: {
      en: {
        subject: 'Welcome to {{branchName}}',
        body:
          'Your {{planName}} membership is now active and runs through {{endDate}}.\n\n' +
          'Download your QR code (show it at the entrance to enter):\n{{qrUrl}}',
      },
      ar: {
        subject: 'مرحباً بك في {{branchName}}',
        body:
          'اشتراكك في {{planName}} أصبح نشطاً الآن ويستمر حتى {{endDate}}.\n\n' +
          'حمّل رمز QR الخاص بك (أظهره عند المدخل للدخول):\n{{qrUrl}}',
      },
      he: {
        subject: 'ברוכים הבאים ל-{{branchName}}',
        body:
          'המנוי שלך ל-{{planName}} פעיל כעת ותקף עד {{endDate}}.\n\n' +
          'הורד את קוד ה-QR שלך (הצג אותו בכניסה כדי להיכנס):\n{{qrUrl}}',
      },
    },
  },
  membershipRenewed: {
    variables: ['planName', 'endDate'],
    translations: {
      en: {
        subject: 'Membership renewed',
        body: 'Your {{planName}} membership has been renewed and now runs through {{endDate}}.',
      },
      ar: {
        subject: 'تم تجديد الاشتراك',
        body: 'تم تجديد اشتراكك في {{planName}} ويستمر الآن حتى {{endDate}}.',
      },
      he: {
        subject: 'המנוי חודש',
        body: 'המנוי שלך ל-{{planName}} חודש ותקף כעת עד {{endDate}}.',
      },
    },
  },
  birthday: {
    variables: ['memberName'],
    translations: {
      en: {
        subject: 'Happy Birthday!',
        body: 'Happy Birthday, {{memberName}}! Wishing you a great year ahead from all of us at the gym.',
      },
      ar: {
        subject: 'عيد ميلاد سعيد!',
        body: 'عيد ميلاد سعيد يا {{memberName}}! نتمنى لك عاماً رائعاً من جميع أفراد النادي.',
      },
      he: {
        subject: 'יום הולדת שמח!',
        body: 'יום הולדת שמח, {{memberName}}! מאחלים לך שנה נהדרת מכל צוות המכון.',
      },
    },
  },
};

export function isNotificationTemplateKey(
  value: string,
): value is NotificationTemplateKey {
  return (NOTIFICATION_TEMPLATE_KEYS as readonly string[]).includes(value);
}

export function renderNotificationTemplate(
  text: string,
  variables: Record<string, string>,
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in variables ? variables[key] : match,
  );
}
