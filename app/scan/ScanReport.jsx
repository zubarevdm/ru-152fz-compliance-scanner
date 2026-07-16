'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fineRange } from '@/lib/fines';

const STATUS_LABEL = {
  violation: 'Нарушение',
  ok: 'Норма',
  manual: 'Ручная проверка',
};

function money(n) {
  return n.toLocaleString('ru-RU') + ' ₽';
}

export default function ScanReport() {
  const params = useSearchParams();
  const url = params.get('url') || '';
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    if (!url) {
      setState({ loading: false, error: 'Не указан адрес сайта.', data: null });
      return;
    }
    let cancelled = false;
    setState({ loading: true, error: null, data: null });
    fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then(async (r) => {
        const json = await r.json();
        if (cancelled) return;
        if (!r.ok) setState({ loading: false, error: json.error || 'Ошибка проверки', data: null });
        else setState({ loading: false, error: null, data: json });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, error: 'Сетевая ошибка. Повторите позже.', data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (state.loading) {
    return (
      <div className="container" style={{ padding: '70px 20px', textAlign: 'center' }}>
        <span className="spinner" /> &nbsp; Сканируем <b>{url}</b> по 152-ФЗ…
        <p className="muted mt">Загружаем сайт и прогоняем 7 детекторов нарушений.</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="container" style={{ padding: '60px 20px' }}>
        <div className="alert error">{state.error}</div>
        <a href="/" className="btn btn-ghost mt">← На главную</a>
      </div>
    );
  }

  const { results, summary, disclaimer, scannedAt } = state.data;
  const violations = results.filter((r) => r.status === 'violation');
  const others = results.filter((r) => r.status !== 'violation');

  const scoreClass = summary.violations >= 3 ? 'bad' : summary.violations >= 1 ? 'warn' : 'good';

  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      <div className="report-head">
        <p className="muted">Отчёт по сайту</p>
        <h1 style={{ margin: '4px 0 0', fontSize: 28 }}>{state.data.url}</h1>
        <p className="muted" style={{ fontSize: 13 }}>
          Проверено: {new Date(scannedAt).toLocaleString('ru-RU')}
        </p>
      </div>

      <div className="score-card">
        <div className="score-row">
          <div className={'score-big ' + scoreClass}>{summary.violations}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {summary.violations === 0
                ? 'Явных нарушений не найдено'
                : `Найдено ${summary.violations} нарушени${summary.violations === 1 ? 'е' : 'я'}`}
            </div>
            <div className="muted" style={{ fontSize: 14 }}>
              {summary.ok} в норме · {summary.manual} требуют ручной проверки · всего {summary.total} пунктов
            </div>
          </div>
          {summary.riskMax > 0 && (
            <div className="risk" style={{ marginLeft: 'auto' }}>
              Потенциальные штрафы:
              <br />
              <b>{money(summary.riskMin)} — {money(summary.riskMax)}</b>
            </div>
          )}
        </div>
      </div>

      {violations.length > 0 && (
        <>
          <h2 style={{ fontSize: 20, textAlign: 'left', margin: '0 0 12px' }}>
            ⚠ Нарушения — закройте в первую очередь
          </h2>
          {violations.map((r) => (
            <CheckCard key={r.id} r={r} />
          ))}
        </>
      )}

      <div className="cta-band">
        <h3>Закройте нарушения за вечер</h3>
        <p>
          Соберём пакет документов под ваш бизнес: политику, согласие, уведомление в РКН.
          В формате DOCX, готово к публикации и подаче.
        </p>
        <a href={'/documents?from=' + encodeURIComponent(state.data.url)} className="btn btn-lg">
          Собрать пакет документов → 7 900 ₽
        </a>
      </div>

      <h2 style={{ fontSize: 20, textAlign: 'left', margin: '24px 0 12px' }}>Остальные проверки</h2>
      {others.map((r) => (
        <CheckCard key={r.id} r={r} />
      ))}

      <div className="disclaimer">{disclaimer}</div>

      <a href="/" className="btn btn-ghost">← Проверить другой сайт</a>
    </div>
  );
}

function CheckCard({ r }) {
  return (
    <div className={'check ' + r.status}>
      <div className="check-top">
        <h3>{r.title}</h3>
        <span className={'badge ' + r.status}>{STATUS_LABEL[r.status]}</span>
      </div>
      <p className="finding">{r.finding}</p>
      {r.extra && <p className="reco">{r.extra}</p>}
      <p className="reco">💡 {r.recommendation}</p>
      {r.status === 'violation' && r.fine && (
        <p className="fine">
          Риск по {r.fine.article}: {fineRange(r.fine)} (для юрлица)
        </p>
      )}
      {r.law && <p className="law">{r.law}</p>}
    </div>
  );
}
