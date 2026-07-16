'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

const DATA_OPTIONS = [
  ['fio', 'ФИО'],
  ['email', 'Email'],
  ['phone', 'Телефон'],
  ['address', 'Почтовый адрес'],
  ['cookie', 'Cookie / аналитика'],
  ['payment', 'Платёжные данные'],
  ['passport', 'Паспортные данные'],
];

const PURPOSE_OPTIONS = [
  ['feedback', 'Обратная связь'],
  ['contract', 'Договоры'],
  ['delivery', 'Доставка / услуги'],
  ['newsletter', 'Рассылки'],
  ['analytics', 'Веб-аналитика'],
];

const DOCS = [
  ['policy', 'Политика обработки ПД'],
  ['consent', 'Согласие на обработку ПД'],
  ['rkn', 'Данные для уведомления в РКН'],
  ['order', 'Приказ об ответственном'],
];

export default function Wizard() {
  const params = useSearchParams();
  const fromUrl = params.get('from') || '';
  const isMonitoring = params.get('plan') === 'monitoring';

  const [d, setD] = useState({
    orgType: 'ООО',
    orgName: '',
    director: '',
    inn: '',
    ogrn: '',
    city: '',
    address: '',
    email: '',
    phone: '',
    website: fromUrl,
    responsible: '',
    dataCollected: ['fio', 'phone', 'email'],
    purposes: ['feedback'],
    thirdPartiesRaw: '',
  });
  const [paid, setPaid] = useState(false);
  const [paying, setPaying] = useState(false);

  function set(k, v) {
    setD((prev) => ({ ...prev, [k]: v }));
  }
  function toggle(k, val) {
    setD((prev) => {
      const arr = prev[k];
      return { ...prev, [k]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });
  }

  // Заглушка оплаты. На проде здесь редирект на ЮKassa/CloudPayments и
  // подтверждение по вебхуку перед выдачей файлов.
  function pay() {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setPaid(true);
    }, 1200);
  }

  function download(docKey) {
    const payload = {
      ...d,
      thirdParties: d.thirdPartiesRaw
        ? d.thirdPartiesRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };
    fetch('/api/generate?doc=' + docKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => {
        if (!r.ok) throw new Error('Ошибка генерации');
        const dispo = r.headers.get('Content-Disposition') || '';
        const m = dispo.match(/filename\*=UTF-8''([^;]+)/);
        const name = m ? decodeURIComponent(m[1]) : docKey + '.docx';
        return r.blob().then((blob) => ({ blob, name }));
      })
      .then(({ blob, name }) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((e) => alert(e.message));
  }

  const required = d.orgName || d.director;

  return (
    <div className="container" style={{ maxWidth: 720, paddingTop: 36, paddingBottom: 40 }}>
      <h1 style={{ fontSize: 28 }}>
        {isMonitoring ? 'Подписка «Мониторинг»' : 'Пакет документов по 152-ФЗ'}
      </h1>
      <p className="muted">
        Ответьте на несколько вопросов о бизнесе — соберём комплект под вас.
        {fromUrl && <> Сайт подставлен из проверки: <b>{fromUrl}</b>.</>}
      </p>

      <div style={{ marginTop: 24 }}>
        <div className="field">
          <label>Форма организации</label>
          <div className="row-gap">
            {['ООО', 'ИП', 'Самозанятый'].map((t) => (
              <label key={t} className="check-item" style={{ flex: '0 0 auto' }}>
                <input type="radio" name="orgType" checked={d.orgType === t} onChange={() => set('orgType', t)} />
                {t}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label>{d.orgType === 'ИП' ? 'ФИО индивидуального предпринимателя' : 'Полное наименование организации'}</label>
          <input type="text" value={d.orgName} onChange={(e) => set('orgName', e.target.value)}
            placeholder={d.orgType === 'ИП' ? 'Иванов Иван Иванович' : 'Общество с ограниченной ответственностью «Ромашка»'} />
        </div>

        <div className="field">
          <label>ФИО руководителя {d.orgType === 'ИП' ? '(если отличается)' : ''}</label>
          <input type="text" value={d.director} onChange={(e) => set('director', e.target.value)} placeholder="Иванов Иван Иванович" />
        </div>

        <div className="row-gap">
          <div className="field" style={{ flex: 1 }}>
            <label>ИНН</label>
            <input type="text" value={d.inn} onChange={(e) => set('inn', e.target.value)} placeholder="7700000000" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>ОГРН{d.orgType === 'ИП' ? 'ИП' : ''}</label>
            <input type="text" value={d.ogrn} onChange={(e) => set('ogrn', e.target.value)} placeholder="1234567890123" />
          </div>
        </div>

        <div className="row-gap">
          <div className="field" style={{ flex: 1 }}>
            <label>Город</label>
            <input type="text" value={d.city} onChange={(e) => set('city', e.target.value)} placeholder="Москва" />
          </div>
          <div className="field" style={{ flex: 2 }}>
            <label>Юридический адрес</label>
            <input type="text" value={d.address} onChange={(e) => set('address', e.target.value)} placeholder="г. Москва, ул. ..." />
          </div>
        </div>

        <div className="row-gap">
          <div className="field" style={{ flex: 1 }}>
            <label>Email для связи</label>
            <input type="email" value={d.email} onChange={(e) => set('email', e.target.value)} placeholder="info@site.ru" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Телефон</label>
            <input type="text" value={d.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+7 ..." />
          </div>
        </div>

        <div className="field">
          <label>Адрес сайта</label>
          <input type="text" value={d.website} onChange={(e) => set('website', e.target.value)} placeholder="site.ru" />
        </div>

        <div className="field">
          <label>Какие данные вы собираете?</label>
          <div className="checks-grid">
            {DATA_OPTIONS.map(([k, label]) => (
              <label key={k} className="check-item">
                <input type="checkbox" checked={d.dataCollected.includes(k)} onChange={() => toggle('dataCollected', k)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Цели обработки</label>
          <div className="checks-grid">
            {PURPOSE_OPTIONS.map(([k, label]) => (
              <label key={k} className="check-item">
                <input type="checkbox" checked={d.purposes.includes(k)} onChange={() => toggle('purposes', k)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Сторонние сервисы (через запятую)</label>
          <input type="text" value={d.thirdPartiesRaw} onChange={(e) => set('thirdPartiesRaw', e.target.value)}
            placeholder="Яндекс.Метрика, хостинг Timeweb, CRM Битрикс24" />
          <div className="hint">Нужно для уведомления в РКН и учёта трансграничной передачи.</div>
        </div>

        <div className="field">
          <label>Ответственный за обработку ПД</label>
          <input type="text" value={d.responsible} onChange={(e) => set('responsible', e.target.value)} placeholder="ФИО (можно руководителя)" />
        </div>
      </div>

      {!paid ? (
        <div className="cta-band" style={{ marginTop: 28 }}>
          <h3>{isMonitoring ? '1 990 ₽ / мес' : '7 900 ₽ — весь пакет'}</h3>
          <p>
            {isMonitoring
              ? 'Ежемесячный рескан, алерты об изменениях закона и автообновление документов.'
              : 'Политика, согласие, данные для РКН и приказ — в DOCX, под ваш бизнес.'}
          </p>
          {!required && <div className="alert info">Заполните хотя бы наименование или ФИО, чтобы продолжить.</div>}
          <button className="btn btn-lg" onClick={pay} disabled={!required || paying}>
            {paying ? <><span className="spinner" /> Переход к оплате…</> : isMonitoring ? 'Оформить подписку' : 'Перейти к оплате'}
          </button>
          <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
            Демо-режим: оплата имитируется. На проде здесь ЮKassa / CloudPayments.
          </p>
        </div>
      ) : (
        <div className="cta-band" style={{ marginTop: 28, textAlign: 'left' }}>
          <h3 style={{ textAlign: 'center' }}>✓ Оплачено. Скачайте документы</h3>
          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            {DOCS.map(([k, label]) => (
              <button key={k} className="btn btn-ghost" style={{ justifyContent: 'space-between' }} onClick={() => download(k)}>
                ⬇ {label} (DOCX)
              </button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
            Документы типовые и требуют финальной вычитки. Это не юридическая консультация.
            После публикации политики на сайте подайте уведомление на pd.rkn.gov.ru.
          </p>
        </div>
      )}
    </div>
  );
}
