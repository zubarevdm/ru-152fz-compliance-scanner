import { Suspense } from 'react';
import Wizard from './Wizard';

export const metadata = {
  title: 'Пакет документов по 152-ФЗ под ваш бизнес',
};

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 60 }}>Загрузка…</div>}>
      <Wizard />
    </Suspense>
  );
}
