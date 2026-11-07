import { useState } from 'react';

/*
 * Single series column chart (no legend: the title names the series).
 * Thin bars with a 4px rounded top, hairline grid, hover tooltip per day, table view.
 */
const W = 720;
const H = 220;
const PAD = { top: 16, right: 8, bottom: 26, left: 40 };
const BAR = '#e8600a'; // validated against the dark surface

function niceMax(v) {
  if (v <= 5) return 5;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

const fmt = (n) => n.toLocaleString();
const shortDay = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export default function BarChart({ title, data, valueKey, unit }) {
  const [hover, setHover] = useState(null);
  const max = niceMax(Math.max(1, ...data.map((d) => d[valueKey])));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / data.length;
  const barW = Math.min(24, Math.max(4, slot - 2));
  const y = (v) => PAD.top + innerH - (v / max) * innerH;
  const ticks = [0, max / 2, max];

  return (
    <figure className="chart">
      <figcaption className="chart__title">{title}</figcaption>
      <div className="chart__wrap">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}, last ${data.length} days`} onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart__grid" />
              <text x={PAD.left - 8} y={y(t) + 4} className="chart__tick" textAnchor="end">{fmt(t)}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const v = d[valueKey];
            const x = PAD.left + i * slot + (slot - barW) / 2;
            const top = y(v);
            const h = PAD.top + innerH - top;
            const r = Math.min(4, h, barW / 2);
            const path = h <= 0
              ? ''
              : `M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`;
            return (
              <g key={d.day} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${shortDay(d.day)}: ${fmt(v)} ${unit}`}>
                <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={innerH} fill="transparent" />
                {path && <path d={path} fill={BAR} opacity={hover === null || hover === i ? 1 : 0.55} />}
              </g>
            );
          })}
          {[0, Math.floor(data.length / 2), data.length - 1].map((i) => (
            <text key={i} x={PAD.left + i * slot + slot / 2} y={H - 6} className="chart__tick" textAnchor="middle">{shortDay(data[i].day)}</text>
          ))}
        </svg>
        {hover !== null && (
          <div className="chart__tip" style={{ left: `${((PAD.left + hover * slot + slot / 2) / W) * 100}%` }}>
            <strong>{fmt(data[hover][valueKey])}</strong> {unit}
            <span>{shortDay(data[hover].day)}</span>
          </div>
        )}
      </div>
      <details className="chart__table">
        <summary>Show as table</summary>
        <table>
          <thead><tr><th>Day</th><th>{unit}</th></tr></thead>
          <tbody>
            {[...data].reverse().map((d) => (
              <tr key={d.day}><td>{shortDay(d.day)}</td><td>{fmt(d[valueKey])}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
