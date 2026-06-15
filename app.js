(function () {
  const canvas = document.getElementById('neural-canvas');
  const ctx = canvas.getContext('2d');

  const CYAN   = '#00e5ff';
  const VIOLET = '#7c3aed';
  const NODE_COUNT = 80;
  const CONNECTION_DIST = 160;
  const PULSE_SPEED = 0.006;

  let W, H, nodes, time = 0, raf;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function createNodes() {
    nodes = Array.from({ length: NODE_COUNT }, () => ({
      x:   rand(0, W),
      y:   rand(0, H),
      vx:  rand(-0.25, 0.25),
      vy:  rand(-0.25, 0.25),
      r:   rand(1.5, 3.5),
      phase: rand(0, Math.PI * 2),
      type: Math.random() > 0.85 ? 'hub' : 'node',
      pulseOffset: rand(0, 1),
    }));
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  }

  const CYAN_RGB   = hexToRgb(CYAN);
  const VIOLET_RGB = hexToRgb(VIOLET);

  function draw() {
    ctx.clearRect(0, 0, W, H);

    time += PULSE_SPEED;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];

      a.x += a.vx;
      a.y += a.vy;

      if (a.x < -50)  a.x = W + 50;
      if (a.x > W+50) a.x = -50;
      if (a.y < -50)  a.y = H + 50;
      if (a.y > H+50) a.y = -50;

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < CONNECTION_DIST) {
          const alpha = (1 - dist / CONNECTION_DIST) * 0.35;

          const pulse = Math.sin(time * 3 + a.phase) * 0.5 + 0.5;
          const isActive = pulse > 0.7 && a.type === 'hub';
          const rgb = isActive ? VIOLET_RGB : CYAN_RGB;
          const finalAlpha = isActive ? alpha * 1.5 : alpha;

          ctx.beginPath();
          ctx.strokeStyle = `rgba(${rgb},${finalAlpha})`;
          ctx.lineWidth = isActive ? 1.5 : 0.5;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          if (isActive && dist < 100) {
            const t = (time * 2 + a.phase) % 1;
            const px = a.x + (b.x - a.x) * t;
            const py = a.y + (b.y - a.y) * t;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${VIOLET_RGB},0.9)`;
            ctx.fill();
          }
        }
      }
    }

    for (const n of nodes) {
      const glow = Math.sin(time * 2 + n.phase) * 0.5 + 0.5;
      const r = n.type === 'hub' ? n.r * 1.8 : n.r;
      const rgb = n.type === 'hub' ? VIOLET_RGB : CYAN_RGB;

      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 4);
      grad.addColorStop(0, `rgba(${rgb},${0.6 + glow * 0.4})`);
      grad.addColorStop(1, `rgba(${rgb},0)`);

      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 4, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},${0.7 + glow * 0.3})`;
      ctx.fill();
    }

    raf = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    resize();
    draw();
  });

  resize();
  createNodes();
  draw();
})();
