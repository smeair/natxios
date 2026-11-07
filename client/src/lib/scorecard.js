/*
 * Draws the shareable quiz scorecard as a 1080x1080 PNG, entirely in the browser.
 * Shows the score and a row of right/wrong dots (never the questions or answers).
 */
const SIZE = 1080;
const C = { bg: '#000000', line: 'rgba(255,255,255,0.06)', white: '#ffffff', muted: '#9a9a9a', orange: '#ff6b00', good: '#4cc38a', bad: '#ff8a65' };

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Faint contour lines, echoing the site background.
function drawContours(ctx) {
  ctx.save();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  const centres = [[180, 220], [900, 860], [860, 160]];
  for (const [cx, cy] of centres) {
    for (let r = 60; r < 520; r += 46) {
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.05) {
        const wobble = 1 + 0.08 * Math.sin(a * 3 + r / 50) + 0.05 * Math.cos(a * 5 - r / 80);
        const x = cx + Math.cos(a) * r * wobble;
        const y = cy + Math.sin(a) * r * 0.82 * wobble;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

export async function drawScorecard({ score, total, results, siteLabel, dateLabel }) {
  await document.fonts?.ready;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const display = '"Marcellus", Georgia, serif';
  const sans = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

  // Background and soft orange glow
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const glow = ctx.createRadialGradient(SIZE / 2, 0, 0, SIZE / 2, 0, 700);
  glow.addColorStop(0, 'rgba(255,107,0,0.22)');
  glow.addColorStop(1, 'rgba(255,107,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SIZE, SIZE);
  drawContours(ctx);

  // Logo
  try {
    const logo = await loadImage('/logo-white.png');
    const w = 300;
    const h = (logo.height / logo.width) * w;
    ctx.drawImage(logo, (SIZE - w) / 2, 110, w, h);
  } catch {
    ctx.fillStyle = C.white;
    ctx.font = `64px ${display}`;
    ctx.textAlign = 'center';
    ctx.fillText('Natxios', SIZE / 2, 170);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = C.muted;
  ctx.font = `600 30px ${sans}`;
  ctx.fillText('ANIMAL QUIZ', SIZE / 2, 300);

  // Score
  ctx.font = `600 230px ${sans}`;
  const scoreText = String(score);
  const totalText = `/${total}`;
  const sw = ctx.measureText(scoreText).width;
  ctx.font = `600 120px ${sans}`;
  const tw = ctx.measureText(totalText).width;
  const startX = (SIZE - (sw + tw)) / 2;
  ctx.textAlign = 'left';
  ctx.fillStyle = C.orange;
  ctx.font = `600 230px ${sans}`;
  ctx.fillText(scoreText, startX, 560);
  ctx.fillStyle = C.white;
  ctx.font = `600 120px ${sans}`;
  ctx.fillText(totalText, startX + sw + 6, 560);

  // Right / wrong dots
  const n = results.length;
  const gap = 18;
  const dot = Math.min(56, (SIZE - 200 - gap * (n - 1)) / n);
  let x = (SIZE - (n * dot + (n - 1) * gap)) / 2;
  for (const ok of results) {
    ctx.beginPath();
    ctx.arc(x + dot / 2, 650, dot / 2, 0, Math.PI * 2);
    ctx.fillStyle = ok ? C.good : C.bad;
    ctx.fill();
    x += dot + gap;
  }

  // Invite
  ctx.textAlign = 'center';
  ctx.fillStyle = C.white;
  ctx.font = `64px ${display}`;
  ctx.fillText('Can you beat me?', SIZE / 2, 820);
  ctx.fillStyle = C.orange;
  ctx.font = `600 38px ${sans}`;
  ctx.fillText(siteLabel, SIZE / 2, 890);
  ctx.fillStyle = C.muted;
  ctx.font = `28px ${sans}`;
  ctx.fillText(dateLabel, SIZE / 2, 960);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
