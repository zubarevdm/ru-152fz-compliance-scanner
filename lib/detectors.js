// Движок детекторов 152-ФЗ.
// Каждый детектор принимает контекст страницы и возвращает результат проверки.
// Статусы: 'violation' (нарушение), 'ok' (норма), 'manual' (требует ручной проверки).
//
// Принцип: мы НЕ гарантируем полноту и юридическую точность. Машинно мы видим
// только то, что опубликовано на сайте. Поэтому всё спорное помечаем 'manual'.

import { FINES } from './fines.js';

// Зарубежные сервисы аналитики/рекламы/рассылок — передают ПД за рубеж.
// host-фрагмент -> человекочитаемое имя.
const FOREIGN_SERVICES = {
  'google-analytics.com': 'Google Analytics',
  'googletagmanager.com': 'Google Tag Manager',
  'analytics.google.com': 'Google Analytics 4',
  'connect.facebook.net': 'Facebook Pixel',
  'facebook.com/tr': 'Facebook Pixel',
  'static.hotjar.com': 'Hotjar',
  'mc.us': 'Mailchimp',
  'list-manage.com': 'Mailchimp',
  'cdn.jsdelivr.net': 'jsDelivr CDN (зарубежный)',
  'unpkg.com': 'unpkg CDN (зарубежный)',
  'cdnjs.cloudflare.com': 'Cloudflare CDN (зарубежный)',
  'youtube.com/embed': 'YouTube (встраивание)',
  'maps.googleapis.com': 'Google Maps',
  'fonts.googleapis.com': 'Google Fonts',
  'doubleclick.net': 'Google DoubleClick',
  'amplitude.com': 'Amplitude',
  'segment.com': 'Segment',
  'intercom.io': 'Intercom',
  'stripe.com': 'Stripe',
};

// Российские/допустимые аналоги — показываем, что у клиента уже ок.
const RU_SERVICES = {
  'mc.yandex.ru': 'Яндекс.Метрика',
  'mc.yandex.com': 'Яндекс.Метрика',
  'top-fwz1.mail.ru': 'VK Pixel / Top@Mail.ru',
  'vk.com/rtrg': 'VK Реклама',
};

function findHosts(ctx) {
  const hosts = new Set();
  ctx.$('script[src], img[src], iframe[src], link[href]').each((_, el) => {
    const src = ctx.$(el).attr('src') || ctx.$(el).attr('href') || '';
    if (src.startsWith('http') || src.startsWith('//')) {
      hosts.add(src.replace(/^\/\//, 'https://'));
    }
  });
  // также ищем хосты в инлайн-скриптах (часто GA/Метрика инициализируются там)
  const inline = ctx.$('script:not([src])').text();
  return { hosts: [...hosts], inline };
}

const detectors = [
  // 1. Опубликована ли политика обработки ПД
  function policyPublished(ctx) {
    const base = {
      id: 'policy',
      title: 'Политика обработки персональных данных',
      law: '152-ФЗ ст. 18.1 ч.2',
      fine: FINES.policy_missing,
    };
    const linkRe = /политик[аи]\s+(обработки\s+)?(персональн|конфиденциальн)|privacy|personal-data|policy/i;
    let found = false;
    ctx.$('a').each((_, el) => {
      const text = ctx.$(el).text();
      const href = ctx.$(el).attr('href') || '';
      if (linkRe.test(text) || /privacy|policy|personal|politika|konfiden/i.test(href)) {
        found = true;
      }
    });
    if (found) {
      return {
        ...base,
        status: 'ok',
        finding: 'На сайте найдена ссылка на политику обработки ПД.',
        recommendation: 'Проверьте вручную, что документ актуален и соответствует требованиям 2025 года.',
      };
    }
    return {
      ...base,
      status: 'violation',
      finding: 'Ссылка на политику обработки персональных данных не обнаружена.',
      recommendation: 'Опубликуйте политику и поставьте ссылку в подвал сайта и рядом со всеми формами.',
    };
  },

  // 2. Формы сбора данных и согласие
  function consentForms(ctx) {
    const base = {
      id: 'consent',
      title: 'Согласие на обработку ПД у форм',
      law: '152-ФЗ ст. 9',
      fine: FINES.consent_missing,
    };
    const forms = ctx.$('form');
    const inputs = ctx.$('input[type=email], input[type=tel], input[name*=phone], input[name*=mail], input[name*=name], textarea');
    const hasForms = forms.length > 0 || inputs.length > 0;
    if (!hasForms) {
      return {
        ...base,
        status: 'manual',
        finding: 'Формы сбора данных на главной странице не обнаружены.',
        recommendation: 'Если формы есть на других страницах (контакты, заявка) — проверьте их отдельно.',
      };
    }
    // ищем чекбокс/текст согласия рядом
    const text = ctx.bodyText.toLowerCase();
    const hasConsentText = /согласие.{0,40}обработ|обработ.{0,40}персональн|даю согласие|согласен на обработк/.test(text);
    const hasCheckbox = ctx.$('input[type=checkbox]').length > 0;
    if (hasConsentText && hasCheckbox) {
      return {
        ...base,
        status: 'ok',
        finding: `Найдены формы сбора данных (${forms.length || '—'}) и признаки согласия на обработку.`,
        recommendation: 'Убедитесь, что согласие отдельное (галочка не предустановлена) и ссылается на политику.',
      };
    }
    return {
      ...base,
      status: 'violation',
      finding: `Найдены формы сбора данных, но отдельного согласия на обработку ПД не обнаружено.`,
      recommendation: 'Добавьте к каждой форме непредустановленную галочку «Согласен на обработку ПД» со ссылкой на политику.',
    };
  },

  // 3. Зарубежные сервисы (трансграничная передача)
  function foreignServices(ctx) {
    const base = {
      id: 'foreign',
      title: 'Зарубежные счётчики и сервисы',
      law: '152-ФЗ ст. 12 (трансграничная передача)',
      fine: FINES.purpose_mismatch,
    };
    const { hosts, inline } = findHosts(ctx);
    const haystack = hosts.join(' ') + ' ' + inline;
    const foreignFound = [];
    for (const [frag, name] of Object.entries(FOREIGN_SERVICES)) {
      if (haystack.includes(frag)) foreignFound.push(name);
    }
    const ruFound = [];
    for (const [frag, name] of Object.entries(RU_SERVICES)) {
      if (haystack.includes(frag)) ruFound.push(name);
    }
    if (foreignFound.length > 0) {
      return {
        ...base,
        status: 'violation',
        finding: `Обнаружены зарубежные сервисы: ${[...new Set(foreignFound)].join(', ')}.`,
        recommendation: 'Замените на российские аналоги (Яндекс.Метрика, VK Pixel) или оформите трансграничную передачу и уведомите РКН.',
        extra: ruFound.length ? `Уже используются российские: ${ruFound.join(', ')}.` : null,
      };
    }
    return {
      ...base,
      status: 'ok',
      finding: ruFound.length
        ? `Зарубежных счётчиков не обнаружено. Используются: ${ruFound.join(', ')}.`
        : 'Зарубежных счётчиков и пикселей не обнаружено.',
      recommendation: 'Периодически проверяйте сторонние скрипты — они меняются при обновлении сайта.',
    };
  },

  // 4. Cookie-уведомление
  function cookieNotice(ctx) {
    const base = {
      id: 'cookie',
      title: 'Уведомление об использовании cookie',
      law: '152-ФЗ ст. 6, 10.1',
      fine: FINES.consent_missing,
    };
    const text = ctx.bodyText.toLowerCase();
    const hasCookieText = /cookie|куки|файлы?\s+cookie/.test(text) &&
      /использ|собира|соглас|продолжая/.test(text);
    if (hasCookieText) {
      return {
        ...base,
        status: 'ok',
        finding: 'Найдено уведомление об использовании cookie.',
        recommendation: 'Проверьте, что баннер не ставит аналитические cookie до согласия пользователя.',
      };
    }
    return {
      ...base,
      status: 'violation',
      finding: 'Уведомление об использовании cookie не обнаружено.',
      recommendation: 'Добавьте cookie-баннер с информированием и ссылкой на политику обработки ПД.',
    };
  },

  // 5. Ссылка на политику/согласие рядом с формами
  function consentLink(ctx) {
    const base = {
      id: 'consent_link',
      title: 'Ссылка на согласие/политику у форм',
      law: '152-ФЗ ст. 9 ч.4',
      fine: FINES.consent_missing,
    };
    const formsHtml = ctx.$('form').html() || '';
    const nearForm = /политик|соглас|персональн|privacy|policy/i.test(formsHtml);
    if (ctx.$('form').length === 0) {
      return {
        ...base,
        status: 'manual',
        finding: 'Формы для оценки не найдены на главной странице.',
        recommendation: 'Проверьте страницы с формами заявок/контактов отдельно.',
      };
    }
    if (nearForm) {
      return {
        ...base,
        status: 'ok',
        finding: 'Рядом с формой есть упоминание политики/согласия.',
        recommendation: 'Убедитесь, что ссылка ведёт на действующий документ.',
      };
    }
    return {
      ...base,
      status: 'violation',
      finding: 'Рядом с формой не найдено ссылки на политику или текста согласия.',
      recommendation: 'Добавьте под каждой формой ссылку на политику и текст согласия на обработку ПД.',
    };
  },

  // 6. Уведомление в реестре операторов РКН (автоматически не проверяемо)
  function rknRegistry(ctx) {
    return {
      id: 'rkn_registry',
      title: 'Уведомление в реестре операторов РКН',
      law: '152-ФЗ ст. 22',
      fine: FINES.notification_missing,
      status: 'manual',
      finding: 'Подачу уведомления в РКН нельзя проверить автоматически по сайту.',
      recommendation: 'Сверьтесь в реестре операторов на pd.rkn.gov.ru. С 30.05.2025 уведомлять обязаны почти все операторы.',
    };
  },

  // 7. Локализация данных в РФ (эвристика по зарубежным CDN/хостингу)
  function dataLocalization(ctx) {
    const base = {
      id: 'localization',
      title: 'Локализация данных на серверах в РФ',
      law: '152-ФЗ ст. 18 ч.5',
      fine: FINES.localization,
    };
    const { hosts } = findHosts(ctx);
    const foreignInfra = hosts.filter((h) =>
      /cloudflare|amazonaws|googleusercontent|herokuapp|vercel\.app|netlify|wixsite|firebaseapp/i.test(h)
    );
    if (foreignInfra.length > 0) {
      return {
        ...base,
        status: 'manual',
        finding: 'Обнаружены признаки зарубежной инфраструктуры (CDN/хостинг). Требует проверки.',
        recommendation: 'Убедитесь, что первичный сбор и хранение ПД граждан РФ ведётся на серверах в России.',
      };
    }
    return {
      ...base,
      status: 'manual',
      finding: 'Местоположение серверов хранения ПД по сайту определить нельзя.',
      recommendation: 'Проверьте, что БД с ПД физически размещена в РФ (хостинг/облако с серверами в России).',
    };
  },
];

export function runDetectors(ctx) {
  const results = detectors.map((d) => {
    try {
      return d(ctx);
    } catch (e) {
      return {
        id: 'error',
        title: 'Ошибка проверки',
        status: 'manual',
        finding: 'Не удалось выполнить проверку: ' + e.message,
        recommendation: 'Повторите проверку позже.',
      };
    }
  });

  const violations = results.filter((r) => r.status === 'violation');
  const ok = results.filter((r) => r.status === 'ok');
  const manual = results.filter((r) => r.status === 'manual');

  // Потенциальная сумма рисков по нарушениям (нижние границы для юрлица)
  let riskMin = 0;
  let riskMax = 0;
  for (const v of violations) {
    if (v.fine?.forLegal) {
      riskMin += v.fine.forLegal[0];
      riskMax += v.fine.forLegal[1];
    }
  }

  return {
    results,
    summary: {
      total: results.length,
      violations: violations.length,
      ok: ok.length,
      manual: manual.length,
      riskMin,
      riskMax,
    },
  };
}
