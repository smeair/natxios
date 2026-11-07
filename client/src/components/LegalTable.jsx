/** Simple, accessible table for legal pages. */
export default function LegalTable({ caption, head, rows }) {
  return (
    <div className="legal__table-wrap">
      <table className="legal__table">
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>{r.map((c, i) => (i === 0 ? <th key={i} scope="row">{c}</th> : <td key={i}>{c}</td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
