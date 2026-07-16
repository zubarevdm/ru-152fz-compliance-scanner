import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { runDetectors } from '@/lib/detectors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeUrl(input) {
  let url = (input || '').trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  try {
    const u = new URL(url);
    // защита от сканирования внутренней сети
    if (/^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.)/.test(u.hostname)) {
      return null;
    }
    return u.toString();
  } catch {
    return null;
  }
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const url = normalizeUrl(body.url);
  if (!url) {
    return NextResponse.json(
      { error: 'Укажите корректный адрес сайта, например example.ru' },
      { status: 400 }
    );
  }

  // Загрузка страницы. На MVP — обычный fetch (быстро, без headless-браузера).
  // TODO: заменить на Playwright для сайтов с тяжёлым JS-рендерингом.
  let html;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; RKN-Compliance-Scanner/0.1; +https://example.ru/bot)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Сайт ответил кодом ${res.status}. Проверьте адрес.` },
        { status: 422 }
      );
    }
    html = await res.text();
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e.name === 'AbortError'
            ? 'Сайт не ответил за 12 секунд.'
            : 'Не удалось загрузить сайт. Проверьте адрес и доступность.',
      },
      { status: 422 }
    );
  }

  const $ = cheerio.load(html);
  $('script:not([src])').each(() => {}); // прогрев
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

  const ctx = { url, html, $, bodyText };
  const { results, summary } = runDetectors(ctx);

  return NextResponse.json({
    url,
    scannedAt: new Date().toISOString(),
    results,
    summary,
    disclaimer:
      'Результат носит информационный характер и не является юридической консультацией. Проверка выполнена автоматически по публичной части сайта и может содержать неточности.',
  });
}
