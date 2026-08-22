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
  'employeeQrCode',
  'memberQrCode',
] as const;

export type NotificationTemplateKey =
  (typeof NOTIFICATION_TEMPLATE_KEYS)[number];

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
    // The QR image itself is attached as WhatsApp media alongside this text
    // (see MembershipsService.activateMembership), so the body is just a
    // caption — no "download your QR code" link, which would be redundant
    // once the image is already in the chat. `qrUrl` stays available as a
    // variable in case a tenant customizes the caption to include a
    // fallback link.
    variables: ['planName', 'endDate', 'qrUrl', 'branchName'],
    translations: {
      en: {
        subject: 'Welcome to {{branchName}}',
        body:
          'Your {{planName}} membership is now active and runs through ' +
          '{{endDate}}.\n\nHere is your QR code — show it at the entrance ' +
          'to enter.',
      },
      ar: {
        subject: 'مرحباً بك في {{branchName}}',
        body:
          'اشتراكك في {{planName}} أصبح نشطاً الآن ويستمر حتى {{endDate}}.\n\n' +
          'هذا رمز QR الخاص بك — أظهره عند المدخل للدخول.',
      },
      he: {
        subject: 'ברוכים הבאים ל-{{branchName}}',
        body:
          'המנוי שלך ל-{{planName}} פעיל כעת ותקף עד {{endDate}}.\n\n' +
          'זהו קוד ה-QR שלך — הצג אותו בכניסה כדי להיכנס.',
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
  employeeQrCode: {
    // The QR image itself is attached as WhatsApp media alongside this text
    // (see EmployeeAttendanceService.sendQrViaWhatsApp), so the body is just
    // a caption — no "tap this link" / "save the image" instructions, which
    // would be redundant once the image is already in the chat. `qrUrl`
    // stays available as a variable in case a tenant customizes the caption
    // to include a fallback link.
    variables: ['employeeName', 'qrUrl'],
    translations: {
      en: {
        subject: 'Your staff access QR code',
        body:
          'Hi {{employeeName}}, your staff access QR code is ready! Show it ' +
          'at the entrance to enter.',
      },
      ar: {
        subject: 'رمز QR الخاص بدخول الموظفين',
        body:
          'مرحباً {{employeeName}}، رمز QR الخاص بدخولك جاهز الآن! أظهره عند ' +
          'المدخل للدخول.',
      },
      he: {
        subject: 'קוד ה-QR שלך לכניסת צוות',
        body:
          'שלום {{employeeName}}, קוד ה-QR שלך לכניסת צוות מוכן! הצג אותו ' +
          'בכניסה כדי להיכנס.',
      },
    },
  },
  memberQrCode: {
    // Same media-as-attachment shape as employeeQrCode above.
    variables: ['memberName', 'qrUrl'],
    translations: {
      en: {
        subject: 'Your gym QR code',
        body:
          'Hi {{memberName}}, your gym QR code is ready! Show it at the ' +
          'entrance to enter.',
      },
      ar: {
        subject: 'رمز QR الخاص بك',
        body:
          'مرحباً {{memberName}}، رمز QR الخاص بالنادي جاهز الآن! أظهره عند ' +
          'المدخل للدخول.',
      },
      he: {
        subject: 'קוד ה-QR שלך למכון',
        body:
          'שלום {{memberName}}, קוד ה-QR שלך למכון מוכן! הצג אותו בכניסה ' +
          'כדי להיכנס.',
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
