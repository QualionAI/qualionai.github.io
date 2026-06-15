const canvas = document.getElementById("neural");
const ctx = canvas.getContext("2d");

let w, h;

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

// Nodes
const NODES = 120;
const nodes = [];

for (let i = 0; i < NODES; i++) {
  nodes.push({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6
  });
}

// Mouse influence
const mouse = { x: w/2, y: h/2 };

window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

function draw() {
  ctx.clearRect(0, 0, w, h);

  // Update nodes
  for (let n of nodes) {
    // movement
    n.x += n.vx;
    n.y += n.vy;

    // boundaries
    if (n.x < 0 || n.x > w) n.vx *= -1;
    if (n.y < 0 || n.y > h) n.vy *= -1;

    // mouse attraction
    const dx = mouse.x - n.x;
    const dy = mouse.y - n.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < 150) {
      n.x += dx * 0.01;
      n.y += dy * 0.01;
    }

    // draw node
    ctx.beginPath();
    ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#7c3aed";
    ctx.fill();
  }

  // connections
  for (let i = 0; i < NODES; i++) {
    for (let j = i + 1; j < NODES; j++) {
      const a = nodes[i];
      const b = nodes[j];

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < 120) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(124, 58, 237, ${1 - dist/120})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(draw);
}

draw();
