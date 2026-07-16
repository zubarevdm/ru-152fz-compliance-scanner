import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { runDetectors } from '@/lib/detectors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Stub эндпоинта мониторинга (Tier 2 — подписка).
// Идея: крон (n8n / Vercel Cron) раз в месяц дёргает этот эндпоинт по списку
// подписчиков, сравнивает с прошлым сканом и шлёт алерт при появлении новых
// нарушений или изменении закона.
//
// На MVP — синхронный рескан одного URL, чтобы поток был сквозным.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }
  const url = body.url;
  if (!url) return NextResponse.json({ error: 'Не указан url' }, { status: 400 });

  try {
    const res = await fetch(/^https?:\/\//.test(url) ? url : 'https://' + url, {
      headers: { 'User-Agent': 'RKN-Compliance-Monitor/0.1' },
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const { summary } = runDetectors({ url, html, $, bodyText });

    // TODO: сравнить summary с предыдущим (из БД) и при росте violations
    // отправить email/телеграм-алерт подписчику.
    return NextResponse.json({
      url,
      checkedAt: new Date().toISOString(),
      summary,
      changed: null, // заполняется при сравнении с историей
    });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка рескана: ' + e.message }, { status: 422 });
  }
}
