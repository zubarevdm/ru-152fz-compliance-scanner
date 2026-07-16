import { Suspense } from 'react';
import ScanReport from './ScanReport';

export const metadata = {
  title: 'Результат проверки сайта по 152-ФЗ',
};

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 60 }}>Загрузка…</div>}>
      <ScanReport />
    </Suspense>
  );
}
