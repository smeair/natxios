import { useEffect, useState } from 'react';
import { drawScorecard } from '../lib/scorecard.js';
import Icon from './Icon.jsx';

// Where shared links point. Set VITE_SITE_URL in client/.env (falls back to the current site).
const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');
const QUIZ_URL = `${SITE_URL}/quiz`;

export default function ShareScore({ score, total, results }) {
  const [blob, setBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [status, setStatus] = useState('');

  const text = `I scored ${score}/${total} on the Natxios animal quiz. Can you beat me?`;

  useEffect(() => {
    let url = '';
    let alive = true;
    drawScorecard({
      score,
      total,
      results,
      siteLabel: QUIZ_URL.replace(/^https?:\/\//, ''),
      dateLabel: new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }),
    }).then((b) => {
      if (!alive || !b) return;
      url = URL.createObjectURL(b);
      setBlob(b);
      setPreviewUrl(url);
    });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [score, total, results]);

  const file = blob ? new File([blob], 'natxios-quiz-score.png', { type: 'image/png' }) : null;
  const canShareFile = !!(file && navigator.canShare?.({ files: [file] }));

  const nativeShare = async () => {
    try {
      if (canShareFile) await navigator.share({ files: [file], text: `${text} ${QUIZ_URL}` });
      else await navigator.share({ text, url: QUIZ_URL });
    } catch {
      /* closed the share sheet */
    }
  };

  const download = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = 'natxios-quiz-score.png';
    a.click();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${QUIZ_URL}`);
      setStatus('Copied. Paste it anywhere to invite friends.');
    } catch {
      setStatus('Copy failed. You can copy the link from your address bar.');
    }
  };

  const enc = encodeURIComponent;
  const links = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${enc(`${text} ${QUIZ_URL}`)}` },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(QUIZ_URL)}` },
    { name: 'X', href: `https://x.com/intent/post?text=${enc(text)}&url=${enc(QUIZ_URL)}` },
  ];

  return (
    <div className="share">
      <p className="share__title">Challenge your friends</p>
      <div className="share__card">
        {previewUrl ? (
          <img src={previewUrl} alt={`Scorecard: ${score} out of ${total}`} width="1080" height="1080" />
        ) : (
          <div className="share__placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="share__actions">
        {typeof navigator.share === 'function' && (
          <button type="button" className="btn btn--primary btn--sm" onClick={nativeShare} disabled={!blob}>
            <Icon name="share" size={16} /> Share
          </button>
        )}
        <button type="button" className="btn btn--ghost btn--sm" onClick={download} disabled={!blob}>
          <Icon name="download" size={16} /> Save image
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={copyLink}>
          <Icon name="link" size={16} /> Copy link
        </button>
      </div>
      <ul className="share__links" aria-label="Share on social media">
        {links.map((l) => (
          <li key={l.name}>
            <a href={l.href} target="_blank" rel="noopener noreferrer">{l.name}</a>
          </li>
        ))}
      </ul>
      <p className="share__status" role="status" aria-live="polite">{status}</p>
    </div>
  );
}
