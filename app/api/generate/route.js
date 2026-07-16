import { NextResponse } from 'next/server';
import { TEMPLATES } from '@/lib/templates';
import { buildDocx } from '@/lib/docx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/generate?doc=policy  body: { ...данные оператора }
// Возвращает один DOCX-файл указанного типа.
export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const docKey = searchParams.get('doc');

  const tplDef = TEMPLATES[docKey];
  if (!tplDef) {
    return NextResponse.json(
      { error: 'Неизвестный тип документа. Доступны: ' + Object.keys(TEMPLATES).join(', ') },
      { status: 400 }
    );
  }

  let data;
  try {
    data = await req.json();
  } catch {
    data = {};
  }

  // На проде здесь проверяется факт оплаты (заказ оплачен -> отдаём файл).
  // На MVP генерация открыта для демонстрации.

  try {
    const tpl = tplDef.build(data);
    const buffer = await buildDocx(tpl);
    const filename = encodeURIComponent(tpl.filename);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Не удалось сгенерировать документ: ' + e.message },
      { status: 500 }
    );
  }
}
