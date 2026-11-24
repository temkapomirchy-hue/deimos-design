(function () {
  const cards = document.querySelectorAll("[data-tilt]");
  cards.forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform =
        "rotateX(" + (-y * 9).toFixed(2) + "deg) rotateY(" + (x * 9).toFixed(2) + "deg) translateY(-4px)";
    });
    card.addEventListener("mouseleave", function () {
      card.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0px)";
    });
  });
})();

(function () {
  const canvas = document.getElementById("rubikCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = 0;
  let height = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Контрастный чёрный гранит с белым кварцем и серебряными прожилками
  const graniteCanvas = document.createElement("canvas");
  graniteCanvas.width = 180;
  graniteCanvas.height = 180;
  const gCtx = graniteCanvas.getContext("2d");

  gCtx.fillStyle = "#0F1013";
  gCtx.fillRect(0, 0, 180, 180);

  for (let i = 0; i < 2400; i++) {
    const gx = Math.random() * 180;
    const gy = Math.random() * 180;
    const size = Math.random() * 2.4 + 0.6;
    const r = Math.random();

    if (r > 0.94) {
      gCtx.fillStyle = "rgba(255, 255, 255, 0.55)";
    } else if (r > 0.65) {
      gCtx.fillStyle = "rgba(115, 120, 130, 0.45)";
    } else if (r > 0.35) {
      gCtx.fillStyle = "rgba(42, 44, 50, 0.65)";
    } else {
      gCtx.fillStyle = "rgba(3, 3, 5, 0.88)";
    }
    gCtx.fillRect(gx, gy, size, size);
  }

  for (let v = 0; v < 4; v++) {
    gCtx.beginPath();
    let vx = Math.random() * 180;
    let vy = Math.random() * 180;
    gCtx.moveTo(vx, vy);
    for (let step = 0; step < 6; step++) {
      vx += (Math.random() - 0.5) * 45;
      vy += (Math.random() - 0.5) * 45;
      gCtx.lineTo(vx, vy);
    }
    gCtx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    gCtx.lineWidth = 0.8;
    gCtx.stroke();
  }

  const granitePattern = ctx.createPattern(graniteCanvas, "repeat");

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize);
  resize();

  function vec(x, y, z) {
    return { x: x, y: y, z: z };
  }

  const cubies = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        cubies.push({
          x: x,
          y: y,
          z: z,
          bx: vec(1, 0, 0),
          by: vec(0, 1, 0),
          bz: vec(0, 0, 1),
        });
      }
    }
  }

  let rotX = -0.46;
  let rotY = 0.64;
  let mouseX = 0;
  let mouseY = 0;
  let scrollOffset = 0;

  window.addEventListener("mousemove", function (e) {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    mouseX = nx * 0.45;
    mouseY = ny * 0.35;
  });

  window.addEventListener("scroll", function () {
    scrollOffset = window.scrollY * 0.0025;
  });

  let activeMove = null;
  let moveCooldown = 80;

  function startRandomLayerMove() {
    const axes = ["x", "y", "z"];
    const layers = [-1, 0, 1];
    const axis = axes[Math.floor(Math.random() * 3)];
    const layer = layers[Math.floor(Math.random() * 3)];
    const dir = Math.random() > 0.5 ? 1 : -1;
    activeMove = {
      axis: axis,
      layer: layer,
      dir: dir,
      progress: 0,
      duration: 52,
    };
  }

  function rotateVec(v, axis, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    if (axis === "x") {
      return vec(v.x, v.y * c - v.z * s, v.y * s + v.z * c);
    }
    if (axis === "y") {
      return vec(v.x * c + v.z * s, v.y, -v.x * s + v.z * c);
    }
    return vec(v.x * c - v.y * s, v.x * s + v.y * c, v.z);
  }

  function commitLayerMove(move) {
    const angle = (Math.PI / 2) * move.dir;
    for (let i = 0; i < cubies.length; i++) {
      const item = cubies.at(i);
      if (Math.round(item[move.axis]) === move.layer) {
        const p = rotateVec(vec(item.x, item.y, item.z), move.axis, angle);
        item.x = Math.round(p.x);
        item.y = Math.round(p.y);
        item.z = Math.round(p.z);
        item.bx = rotateVec(item.bx, move.axis, angle);
        item.by = rotateVec(item.by, move.axis, angle);
        item.bz = rotateVec(item.bz, move.axis, angle);
      }
    }
  }
  const localFaces = [
    { n: vec(0, 0, 1), verts: [vec(-1, -1, 1), vec(1, -1, 1), vec(1, 1, 1), vec(-1, 1, 1)] },
    { n: vec(0, 0, -1), verts: [vec(1, -1, -1), vec(-1, -1, -1), vec(-1, 1, -1), vec(1, 1, -1)] },
    { n: vec(1, 0, 0), verts: [vec(1, -1, 1), vec(1, -1, -1), vec(1, 1, -1), vec(1, 1, 1)] },
    { n: vec(-1, 0, 0), verts: [vec(-1, -1, -1), vec(-1, -1, 1), vec(-1, 1, 1), vec(-1, 1, -1)] },
    { n: vec(0, 1, 0), verts: [vec(-1, 1, 1), vec(1, 1, 1), vec(1, 1, -1), vec(-1, 1, -1)] },
    { n: vec(0, -1, 0), verts: [vec(-1, -1, -1), vec(1, -1, -1), vec(1, -1, 1), vec(-1, -1, 1)] },
  ];

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  const rawLight = vec(0.45, -0.68, 0.58);
  const lightLen = Math.hypot(rawLight.x, rawLight.y, rawLight.z);
  const lightDir = vec(
    rawLight.x / lightLen,
    rawLight.y / lightLen,
    rawLight.z / lightLen
  );

  const dustParticles = [];
  for (let d = 0; d < 36; d++) {
    dustParticles.push({
      angle: Math.random() * Math.PI * 2,
      radius: 130 + Math.random() * 115,
      yOffset: (Math.random() - 0.5) * 260,
      speed: (Math.random() * 0.004 + 0.0015) * (Math.random() > 0.5 ? 1 : -1),
      size: Math.random() * 1.8 + 0.7,
      phase: Math.random() * Math.PI * 2,
    });
  }

  let isDragging = false;
  let lastDragX = 0;
  let lastDragY = 0;

  canvas.style.cursor = "grab";
  canvas.addEventListener("mousedown", function (e) {
    isDragging = true;
    lastDragX = e.clientX;
    lastDragY = e.clientY;
    canvas.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", function (e) {
    if (!isDragging) return;
    const dx = e.clientX - lastDragX;
    const dy = e.clientY - lastDragY;
    rotY += dx * 0.008;
    rotX += dy * 0.008;
    lastDragX = e.clientX;
    lastDragY = e.clientY;
  });

  window.addEventListener("mouseup", function () {
    isDragging = false;
    canvas.style.cursor = "grab";
  });
    // Поддержка вращения кубика пальцем на телефоне и планшете
  canvas.addEventListener("touchstart", function (e) {
    if (e.touches.length === 1) {
      isDragging = true;
      lastDragX = e.touches.item(0).clientX;
      lastDragY = e.touches.item(0).clientY;
    }
  }, { passive: true });

  canvas.addEventListener("touchmove", function (e) {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches.item(0);
    const dx = touch.clientX - lastDragX;
    const dy = touch.clientY - lastDragY;
    rotY += dx * 0.01;
    rotX += dy * 0.01;
    lastDragX = touch.clientX;
    lastDragY = touch.clientY;
  }, { passive: false });

  window.addEventListener("touchend", function () {
    isDragging = false;
  });


  let floatTime = 0;

  function render() {
    ctx.clearRect(0, 0, width, height);
    floatTime += 0.025;

    const centerX = width / 2;
    const centerY = height / 2 - 14;
    for (let d = 0; d < dustParticles.length; d++) {
      const pt = dustParticles.at(d);
      pt.angle += pt.speed;
      const px = centerX + Math.cos(pt.angle) * pt.radius + mouseX * 35;
      const py =
        centerY +
        pt.yOffset +
        Math.sin(floatTime + pt.phase) * 10 +
        mouseY * 25;
      const alpha = 0.25 + (Math.sin(floatTime * 1.4 + pt.phase) + 1) * 0.28;

      ctx.beginPath();
      ctx.arc(px, py, pt.size, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, " + alpha.toFixed(2) + ")";
      ctx.fill();
    }

    let moveAngle = 0;
    if (activeMove) {
      activeMove.progress += 1;
      const t = Math.min(activeMove.progress / activeMove.duration, 1);
      moveAngle = easeInOutCubic(t) * (Math.PI / 2) * activeMove.dir;
      if (t >= 1) {
        commitLayerMove(activeMove);
        activeMove = null;
        moveAngle = 0;
        moveCooldown = 60;
      }
    } else {
      moveCooldown -= 1;
      if (moveCooldown <= 0) startRandomLayerMove();
    }

    if (!isDragging) {
      rotY += 0.0055;
    }
    const targetX = rotX + mouseY * 0.8 + scrollOffset * 0.5;
    const targetY = rotY + mouseX * 0.8 + scrollOffset;

    const scaleBase = Math.min(width, height) * 0.1;
    const gap = 1.04;
    const half = 0.49;
    const fov = Math.min(535, width * 1.12);
    const camDist = 7.3;
    const hoverY = Math.sin(floatTime) * 7;

    const polygons = [];

    for (let i = 0; i < cubies.length; i++) {
      const c = cubies.at(i);
      const inLayer =
        activeMove && Math.round(c[activeMove.axis]) === activeMove.layer;

      let pos = vec(c.x * gap, c.y * gap, c.z * gap);
      let bx = c.bx;
      let by = c.by;
      let bz = c.bz;

      if (inLayer) {
        pos = rotateVec(pos, activeMove.axis, moveAngle);
        bx = rotateVec(bx, activeMove.axis, moveAngle);
        by = rotateVec(by, activeMove.axis, moveAngle);
        bz = rotateVec(bz, activeMove.axis, moveAngle);
      }

      for (let f = 0; f < localFaces.length; f++) {
        const face = localFaces.at(f);

        let wn = vec(
          face.n.x * bx.x + face.n.y * by.x + face.n.z * bz.x,
          face.n.x * bx.y + face.n.y * by.y + face.n.z * bz.y,
          face.n.x * bx.z + face.n.y * by.z + face.n.z * bz.z
        );
        wn = rotateVec(wn, "x", targetX);
        wn = rotateVec(wn, "y", targetY);

        if (wn.z <= -0.15) continue;

        const projected = [];
        let avgZ = 0;

        for (let vIdx = 0; vIdx < face.verts.length; vIdx++) {
          const v = face.verts.at(vIdx);
          const lx = v.x * half;
          const ly = v.y * half;
          const lz = v.z * half;

          let wp = vec(
            pos.x + lx * bx.x + ly * by.x + lz * bz.x,
            pos.y + lx * bx.y + ly * by.y + lz * bz.y,
            pos.z + lx * bx.z + ly * by.z + lz * bz.z
          );
          wp = rotateVec(wp, "x", targetX);
          wp = rotateVec(wp, "y", targetY);

          const zDepth = camDist - wp.z;
          const perspective = fov / (zDepth * scaleBase);
          const sx = centerX + wp.x * scaleBase * perspective;
          const sy = centerY + hoverY + wp.y * scaleBase * perspective;

          projected.push({ x: sx, y: sy });
          avgZ += wp.z;
        }

        avgZ /= 4;
        const diff = Math.max(
          0,
          wn.x * lightDir.x + wn.y * lightDir.y + wn.z * lightDir.z
        );
        polygons.push({ projected: projected, avgZ: avgZ, diff: diff });
      }
    }

    polygons.sort(function (a, b) {
      return a.avgZ - b.avgZ;
    });

    for (let p = 0; p < polygons.length; p++) {
      const poly = polygons.at(p);
      const pts = poly.projected;
      const first = pts.at(0);

      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      for (let j = 1; j < pts.length; j++) {
        const pt = pts.at(j);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();

      ctx.fillStyle = granitePattern || "#0F1013";
      ctx.fill();

      const lightOverlay =
        poly.diff > 0.52
          ? "rgba(255, 255, 255, " + ((poly.diff - 0.52) * 0.24).toFixed(3) + ")"
          : "rgba(0, 0, 0, " + ((0.52 - poly.diff) * 0.68).toFixed(3) + ")";
      ctx.fillStyle = lightOverlay;
      ctx.fill();

      // Яркие контрастные бело-серебристые рёбра
      const strokeAlpha = 0.42 + poly.diff * 0.58;
      ctx.strokeStyle = "rgba(255, 255, 255, " + strokeAlpha.toFixed(2) + ")";
      ctx.lineWidth = 1.25;
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    requestAnimationFrame(render);
  }

  render();
})();

(function () {
  const canvas = document.getElementById("ambient3dCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let w = 0;
  let h = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  function pt(x, y, z) {
    return { x: x, y: y, z: z };
  }

  function edge(a, b) {
    return { a: a, b: b };
  }

  const shapes = [
    {
      side: "left",
      yBase: 0.28,
      parallax: 0.14,
      size: 46,
      rx: 0.4,
      ry: 0.2,
      vx: 0.004,
      vy: 0.007,
      verts: [
        pt(0, -1.3, 0),
        pt(1, 0, 0),
        pt(0, 0, 1),
        pt(-1, 0, 0),
        pt(0, 0, -1),
        pt(0, 1.3, 0),
      ],
      edges: [
        edge(0, 1), edge(0, 2), edge(0, 3), edge(0, 4),
        edge(5, 1), edge(5, 2), edge(5, 3), edge(5, 4),
        edge(1, 2), edge(2, 3), edge(3, 4), edge(4, 1),
      ],
    },
    {
      side: "right",
      yBase: 0.24,
      parallax: -0.18,
      size: 44,
      rx: -0.3,
      ry: 0.8,
      vx: -0.0035,
      vy: 0.006,
      verts: [
        pt(0, -1.25, 0),
        pt(-1, 0.9, -1),
        pt(1, 0.9, -1),
        pt(1, 0.9, 1),
        pt(-1, 0.9, 1),
      ],
      edges: [
        edge(0, 1), edge(0, 2), edge(0, 3), edge(0, 4),
        edge(1, 2), edge(2, 3), edge(3, 4), edge(4, 1),
      ],
    },
    {
      side: "left",
      yBase: 0.78,
      parallax: -0.12,
      size: 36,
      rx: 0.7,
      ry: -0.5,
      vx: 0.005,
      vy: -0.005,
      verts: [
        pt(0, -1.2, 0),
        pt(1, 0, 0),
        pt(0, 0, 1),
        pt(-1, 0, 0),
        pt(0, 0, -1),
        pt(0, 1.2, 0),
      ],
      edges: [
        edge(0, 1), edge(0, 2), edge(0, 3), edge(0, 4),
        edge(5, 1), edge(5, 2), edge(5, 3), edge(5, 4),
        edge(1, 2), edge(2, 3), edge(3, 4), edge(4, 1),
      ],
    },
  ];

  function rot(p, ax, ay) {
    const cx = Math.cos(ax);
    const sx = Math.sin(ax);
    const y1 = p.y * cx - p.z * sx;
    const z1 = p.y * sx + p.z * cx;

    const cy = Math.cos(ay);
    const sy = Math.sin(ay);
    const x2 = p.x * cy + z1 * sy;
    const z2 = -p.x * sy + z1 * cy;
    return { x: x2, y: y1, z: z2 };
  }

  function loop() {
    ctx.clearRect(0, 0, w, h);
    const scrollY = window.scrollY || 0;
    const margin = Math.max(54, (w - 1240) * 0.25);

    for (let i = 0; i < shapes.length; i++) {
      const s = shapes.at(i);
      s.rx += s.vx;
      s.ry += s.vy;

      const baseX = s.side === "left" ? margin : w - margin;
      const baseY =
        (((h * s.yBase + scrollY * s.parallax) % (h + 160)) + (h + 160)) %
          (h + 160) -
        80;

      const projected = [];
      for (let v = 0; v < s.verts.length; v++) {
        const rp = rot(s.verts.at(v), s.rx, s.ry);
        const scale = 3.2 / (3.2 - rp.z);
        projected.push({
          x: baseX + rp.x * s.size * scale,
          y: baseY + rp.y * s.size * scale,
        });
      }

      ctx.beginPath();
      for (let e = 0; e < s.edges.length; e++) {
const pair = s.edges.at(e);
const p1 = projected.at(pair.a);
const p2 = projected.at(pair.b);
ctx.moveTo(p1.x, p1.y);
ctx.lineTo(p2.x, p2.y);
}
ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
ctx.lineWidth = 1;
ctx.stroke();
for (let v = 0; v < projected.length; v++) {
const pv = projected.at(v);
ctx.beginPath();
ctx.arc(pv.x, pv.y, 1.8, 0, Math.PI * 2);
ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
ctx.fill();
}
}
requestAnimationFrame(loop);
}
loop();
})();