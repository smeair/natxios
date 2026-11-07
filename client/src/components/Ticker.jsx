function Row({ items, hidden }) {
  return (
    <ul className="ticker__row" aria-hidden={hidden || undefined}>
      {items.map((t) => (
        <li key={t} className="ticker__item">
          <span className="ticker__dot" aria-hidden="true" />
          {t}
        </li>
      ))}
    </ul>
  );
}

export default function Ticker({ items }) {
  return (
    <section className="ticker" aria-label="Quick animal facts" data-nosnippet="">
      {items.length > 0 && (
        <div className="ticker__track">
          <Row items={items} />
          <Row items={items} hidden />
        </div>
      )}
    </section>
  );
}
