'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ScanForm({ large }) {
  const [url, setUrl] = useState('');
  const router = useRouter();

  function submit(e) {
    e.preventDefault();
    const v = url.trim();
    if (!v) return;
    router.push('/scan?url=' + encodeURIComponent(v));
  }

  return (
    <form className="scan-box" onSubmit={submit}>
      <input
        type="text"
        inputMode="url"
        placeholder="вашсайт.ру"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        aria-label="Адрес сайта"
      />
      <button className={'btn' + (large ? ' btn-lg' : '')} type="submit">
        Проверить бесплатно
      </button>
    </form>
  );
}
