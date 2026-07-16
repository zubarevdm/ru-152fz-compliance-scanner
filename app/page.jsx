import ScanForm from './components/ScanForm';

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>
            Узнайте за 60 секунд, за что вас<br />
            оштрафует <span className="hl">Роскомнадзор</span>
          </h1>
          <p className="lead">
            Проверим ваш сайт по 152-ФЗ и покажем нарушения, за которые штрафуют
            прямо сейчас. Закройте их за вечер — без юриста и аудита за 50&nbsp;000&nbsp;₽.
          </p>
          <ScanForm large />
          <p className="hero-note">
            Бесплатно · без регистрации · проверка реального сайта, а не шаблон
          </p>
        </div>
      </section>

      <div className="container">
        <div className="trust">
          <div className="item"><b>до 700 000 ₽</b> штраф за сбор данных без согласия</div>
          <div className="item"><b>до 6 000 000 ₽</b> за нарушение локализации</div>
          <div className="item"><b>с 30.05.2025</b> уведомлять РКН обязаны почти все</div>
        </div>
      </div>

      <section id="how">
        <div className="container">
          <h2>Как это работает</h2>
          <p className="sub">
            Три шага от «не знаю, нарушаю ли я» до полного пакета документов.
          </p>
          <div className="steps">
            <div className="step">
              <div className="n">1</div>
              <h3>Сканируем сайт</h3>
              <p>
                Робот проверяет 7 машинно-выявляемых вещей, которые видит и
                Роскомнадзор: политику, согласия, зарубежные счётчики, cookie.
              </p>
            </div>
            <div className="step">
              <div className="n">2</div>
              <h3>Показываем нарушения</h3>
              <p>
                Отчёт с привязкой к статьям КоАП и суммам штрафов. Честно:
                «нарушение», «норма» или «нужна ручная проверка».
              </p>
            </div>
            <div className="step">
              <div className="n">3</div>
              <h3>Генерируем документы</h3>
              <p>
                Отвечаете на несколько вопросов — получаете готовый пакет:
                политику, согласие, уведомление в РКН. В DOCX, под ваш бизнес.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="price">
        <div className="container">
          <h2>Цены</h2>
          <p className="sub">
            Страховка от штрафов в сотни тысяч рублей — за стоимость одного обеда с юристом.
          </p>
          <div className="pricing">
            <div className="plan">
              <span className="tag">Скан</span>
              <div className="price">0 ₽</div>
              <ul>
                <li>Проверка сайта по 7 пунктам</li>
                <li>Отчёт с нарушениями и штрафами</li>
                <li>Привязка к статьям КоАП</li>
                <li>Без регистрации</li>
              </ul>
              <a href="#how" className="btn btn-ghost">Как это работает ↑</a>
            </div>
            <div className="plan featured">
              <span className="tag">Пакет документов</span>
              <div className="price">7 900 ₽ <small>разово</small></div>
              <ul>
                <li>Политика обработки ПД</li>
                <li>Согласие на обработку ПД</li>
                <li>Уведомление в Роскомнадзор</li>
                <li>Приказы и инструкции</li>
                <li>Всё под ваш бизнес, в DOCX</li>
              </ul>
              <a href="/documents" className="btn">Собрать пакет</a>
            </div>
            <div className="plan">
              <span className="tag">Мониторинг</span>
              <div className="price">1 990 ₽ <small>/ мес</small></div>
              <ul>
                <li>Ежемесячный рескан сайта</li>
                <li>Алерты об изменениях закона</li>
                <li>Автообновление документов</li>
                <li>Уведомления о новых рисках</li>
              </ul>
              <a href="/documents?plan=monitoring" className="btn btn-ghost">Подключить</a>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="cta-band">
            <h3>Проверьте свой сайт прямо сейчас</h3>
            <p>Это бесплатно и займёт меньше минуты.</p>
            <ScanForm />
          </div>
        </div>
      </section>
    </>
  );
}
