

(function () {

  const AMBER      = '#e8a020';
  const AMBER_DIM  = 'rgba(232,160,32,0.45)';
  const AMBER_FAINT= 'rgba(232,160,32,0.18)';
  const RED        = '#c0392b';
  const MUTED      = 'rgba(216,207,200,0.25)';
  const bgCanvas = document.getElementById('eeg-canvas');
  const bgCtx    = bgCanvas.getContext('2d');
  let bgW, bgH, bgT = 0;

  function resizeBg() {
    bgW = bgCanvas.width  = window.innerWidth;
    bgH = bgCanvas.height = window.innerHeight;
  }

  const BG_CHANNELS = 8;
  const bgChannels  = Array.from({ length: BG_CHANNELS }, (_, i) => ({
    y:      0,
    freq:   0.8 + i * 0.3,
    amp:    12 + Math.random() * 18,
    speed:  0.3 + Math.random() * 0.2,
    phase:  Math.random() * Math.PI * 2,
    spike:  Math.random() * Math.PI * 2,  
    spikeT: Math.random() * 200,
  }));

  function drawBg() {
    bgCtx.clearRect(0, 0, bgW, bgH);
    bgT += 0.5;

    bgChannels.forEach((ch, i) => {
      ch.y = (bgH / (BG_CHANNELS + 1)) * (i + 1);

      bgCtx.beginPath();
      bgCtx.strokeStyle = MUTED;
      bgCtx.lineWidth   = 0.8;

      for (let x = 0; x <= bgW; x += 2) {
        const t   = (x + bgT * ch.speed * 60) * 0.012;
        let   y   = ch.y
                  + Math.sin(t * ch.freq + ch.phase) * ch.amp
                  + Math.sin(t * ch.freq * 2.3 + 1)  * (ch.amp * 0.3);

        const spikeX = ((bgT * ch.speed * 60 * 0.5 + ch.spikeT * 80) % bgW);
        const dist   = Math.abs(x - spikeX);
        if (dist < 18) {
          const env = Math.max(0, 1 - dist / 18);
          y += Math.sin(env * Math.PI) * ch.amp * 3 * (i % 2 === 0 ? 1 : -1);
        }

        if (x === 0) bgCtx.moveTo(x, y);
        else         bgCtx.lineTo(x, y);
      }
      bgCtx.stroke();
    });

    requestAnimationFrame(drawBg);
  }

  resizeBg();
  drawBg();
  window.addEventListener('resize', resizeBg);



  const CHANNELS = [
    { id: 'ch1', freq: 10.2, amp: 0.38, noise: 0.08, color: AMBER,      spikeRate: 0.003 },
    { id: 'ch2', freq: 6.5,  amp: 0.28, noise: 0.06, color: AMBER_DIM,  spikeRate: 0.005 },
    { id: 'ch3', freq: 22.0, amp: 0.18, noise: 0.12, color: AMBER_FAINT,spikeRate: 0.001 },
  ];

  const chCtxs    = [];
  const chBuffers = [];  // rolling sample buffer per channel
  const BUFFER    = 300;

  CHANNELS.forEach((ch, i) => {
    const el  = document.getElementById(ch.id);
    if (!el) return;
    const ctx = el.getContext('2d');
    chCtxs.push({ el, ctx, ch });
    chBuffers.push(new Float32Array(BUFFER).fill(0.5));
  });

  let chT = 0;

  function sineWave(t, freq, amp, noise) {
    return 0.5
      + Math.sin(t * freq * 0.08) * amp
      + Math.sin(t * freq * 0.19) * (amp * 0.4)
      + (Math.random() - 0.5) * noise;
  }

  function drawChannels() {
    chT++;

    chCtxs.forEach(({ el, ctx, ch }, i) => {
      const W = el.offsetWidth || 340;
      const H = el.offsetHeight || 50;
      el.width  = W;
      el.height = H;

      let v = sineWave(chT, ch.freq, ch.amp, ch.noise);
      if (Math.random() < ch.spikeRate) {
        v += (Math.random() > 0.5 ? 1 : -1) * 0.55;
      }
      v = Math.max(0.02, Math.min(0.98, v));

      const buf = chBuffers[i];
      buf.copyWithin(0, 1);
      buf[BUFFER - 1] = v;

      ctx.clearRect(0, 0, W, H);

      // Grid line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(232,160,32,0.06)';
      ctx.lineWidth   = 1;
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();

      // Wave
      ctx.beginPath();
      ctx.strokeStyle = ch.color;
      ctx.lineWidth   = 1.4;
      ctx.lineJoin    = 'round';

      for (let x = 0; x < BUFFER; x++) {
        const px = (x / BUFFER) * W;
        const py = (1 - buf[x]) * H;
        if (x === 0) ctx.moveTo(px, py);
        else         ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Glow on latest point
      const lx = W - 1;
      const ly = (1 - buf[BUFFER - 1]) * H;
      ctx.beginPath();
      ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = AMBER;
      ctx.fill();
    });

    // Hz readout
    const hz = (10 + Math.sin(chT * 0.01) * 2.4).toFixed(1);
    const el = document.getElementById('hz-read');
    if (el) el.textContent = hz + ' Hz';

    // Spike indicator
    const spikeEl = document.getElementById('spike-read');
    if (spikeEl && Math.random() < 0.003) {
      spikeEl.textContent = '⚡ SPIKE DETECTED';
      spikeEl.style.color = AMBER;
      setTimeout(() => {
        spikeEl.textContent = '∿ SIGNAL CLEAN';
        spikeEl.style.color = '';
      }, 800);
    }

    requestAnimationFrame(drawChannels);
  }
  drawChannels();

  const footEeg = document.getElementById('foot-eeg');
  const footCtx = footEeg ? footEeg.getContext('2d') : null;
  const footBuf = new Float32Array(160).fill(0.5);
  let footT = 0;

  function drawFooter() {
    footT++;
    if (!footCtx) return;

    const W = footEeg.width  = 160;
    const H = footEeg.height = 32;

    footCtx.clearRect(0, 0, W, H);

    let v = 0.5
      + Math.sin(footT * 0.18) * 0.28
      + Math.sin(footT * 0.43) * 0.08
      + (Math.random() - 0.5) * 0.04;
    v = Math.max(0.05, Math.min(0.95, v));

    footBuf.copyWithin(0, 1);
    footBuf[159] = v;

    footCtx.beginPath();
    footCtx.strokeStyle = AMBER_DIM;
    footCtx.lineWidth   = 1;
    for (let x = 0; x < 160; x++) {
      const py = (1 - footBuf[x]) * H;
      if (x === 0) footCtx.moveTo(x, py);
      else         footCtx.lineTo(x, py);
    }
    footCtx.stroke();

    // clock
    const timeEl = document.getElementById('foot-time');
    if (timeEl) {
      const now = new Date();
      const ts  = now.toISOString().replace('T', ' · ').slice(0, 22) + ' UTC';
      timeEl.textContent = ts;
    }

    requestAnimationFrame(drawFooter);
  }
  drawFooter();

})();
