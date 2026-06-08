/**
 * Runs a canvas confetti animation on the given canvas element.
 * Returns a cancel function.
 */
export const runConfetti = (canvas, onDone) => {
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#ec4899"];
  const pts = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 6 + 4,
    d: Math.random() * canvas.height,
    color: colors[Math.floor(Math.random() * colors.length)],
    tilt: 0, tiltAngle: 0
  }));
  let animId;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    pts.forEach((p, i) => {
      p.tiltAngle += Math.random() * 0.07 + 0.02;
      p.y  += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.x  += Math.sin(p.tiltAngle);
      p.tilt = Math.sin(p.tiltAngle - i / 3) * 15;
      if (p.y < canvas.height) active = true;
      ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();
    });
    if (active) animId = requestAnimationFrame(draw);
    else onDone?.();
  };
  draw();
  return () => cancelAnimationFrame(animId);
};
