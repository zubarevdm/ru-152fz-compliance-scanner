import './globals.css';

export const metadata = {
  title: 'Проверка сайта по 152-ФЗ за 60 секунд | Защита от штрафов РКН',
  description:
    'Узнайте за минуту, за что вас может оштрафовать Роскомнадзор, и закройте нарушения за вечер — без юриста и аудита за 50 000 ₽.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <a href="/" className="logo">152&nbsp;<span>проверка</span></a>
            <nav className="nav">
              <a href="/#how">Как работает</a>
              <a href="/#price">Цены</a>
              <a href="/documents">Документы</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container">
            <p className="footer-disclaimer">
              Сервис помогает подготовить документы и выявить типовые нарушения по 152-ФЗ.
              Не является юридической консультацией. Данные хранятся на серверах в РФ.
            </p>
            <p className="footer-copy">© {new Date().getFullYear()} 152-проверка</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
