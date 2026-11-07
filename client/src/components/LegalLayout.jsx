import { useEffect } from 'react';
import { LEGAL } from '../lib/legal.js';

export default function LegalLayout({ title, intro, sections }) {
  useEffect(() => {
    document.title = `${title} | Natxios`;
  }, [title]);

  return (
    <article className="legal">
      <header className="legal__head">
        <h1 className="legal__title">{title}</h1>
        {LEGAL.updated && <p className="legal__updated">Last updated: {LEGAL.updated}</p>}
        <p className="legal__intro">{intro}</p>
      </header>
      <nav className="legal__toc" aria-label="On this page">
        <ol>
          {sections.map((s) => (
            <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>
          ))}
        </ol>
      </nav>
      {sections.map((s) => (
        <section key={s.id} id={s.id} className="legal__section">
          <h2>{s.title}</h2>
          {s.body}
        </section>
      ))}
    </article>
  );
}
