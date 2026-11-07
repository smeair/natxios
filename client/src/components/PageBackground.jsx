import { useEffect, useRef } from 'react';

/** One fixed background behind the whole page: soft glows, contour lines and a cursor torch. */
export default function PageBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf = 0;
    let x = 0;
    let y = 0;
    const onMove = (e) => {
      if (e.pointerType === 'touch') return;
      x = e.clientX;
      y = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          el.style.setProperty('--mx', `${x}px`);
          el.style.setProperty('--my', `${y}px`);
        });
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="page-bg" aria-hidden="true">
      <span className="page-bg__glow page-bg__glow--top" />
      <span className="page-bg__glow page-bg__glow--side" />
      <span className="page-bg__topo" />
      <span className="page-bg__topo page-bg__topo--lit" />
      <span className="page-bg__grain" />
    </div>
  );
}
