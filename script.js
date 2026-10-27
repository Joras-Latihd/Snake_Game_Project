(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const canvas = $("game"),
    ctx = canvas.getContext("2d");
  const N = 20,
    CELL = 20,
    SIZE = N * CELL;
  const BASE = { easy: 150, normal: 105, hard: 70 };
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const KEYS = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
  };

  const store = {
    get(k, d) {
      try {
        const v = JSON.parse(localStorage.getItem(k));
        return v ?? d;
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        /* storage blocked */
      }
    },
  };
  const opt = {
    difficulty: store.get("snakeDiff", "normal"),
    walls: store.get("snakeWalls", "solid"),
    sound: store.get("snakeSound", true),
  };

  // one leaderboard and one best score per difficulty (old single leaderboard moves to Normal)
  let boards = store.get("leaderboards", null);
  if (!boards) {
    boards = { easy: [], normal: store.get("leaderboard", []), hard: [] };
    store.set("leaderboards", boards);
  }
  let bests = store.get("snakeBests", null);
  if (!bests) {
    bests = { easy: 0, normal: store.get("snakeBest", 0), hard: 0 };
    store.set("snakeBests", bests);
  }
  let viewLevel = opt.difficulty;

  let snake,
    dir,
    queue,
    food,
    bonus,
    score,
    eaten,
    run,
    state = "idle",
    acc = 0,
    last = 0;

  // ---------- helpers ----------
  const rand = (n) => Math.floor(Math.random() * n);
  const same = (a, b) => a && b && a.x === b.x && a.y === b.y;
  const level = () => 1 + Math.floor(eaten / 5);
  const interval = () => Math.max(45, BASE[run.difficulty] - (level() - 1) * 6);

  function freeCell() {
    let c;
    do {
      c = { x: rand(N), y: rand(N) };
    } while (snake.some((s) => same(s, c)) || same(c, food) || same(c, bonus));
    return c;
  }

  let ac;
  function beep(freq, dur = 0.08, type = "square") {
    if (!opt.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(),
        g = ac.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = 0.04;
      o.connect(g);
      g.connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + dur);
    } catch {
      /* audio unavailable */
    }
  }

  // ---------- game state ----------
  function reset() {
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    dir = { x: 1, y: 0 };
    queue = [];
    score = 0;
    eaten = 0;
    bonus = null;
    food = null;
    food = freeCell();
    hud();
  }

  function hud() {
    $("score").textContent = score;
    $("best").textContent =
      bests[
        state === "playing" || state === "paused"
          ? run.difficulty
          : opt.difficulty
      ];
    $("level").textContent = level();
  }

  function setDir(name) {
    const [x, y] = DIRS[name];
    const ref = queue.length ? queue[queue.length - 1] : dir;
    if ((ref.x === x && ref.y === y) || (ref.x === -x && ref.y === -y)) return;
    if (queue.length < 3) queue.push({ x, y });
  }

  function tick() {
    if (queue.length) dir = queue.shift();
    let hx = snake[0].x + dir.x,
      hy = snake[0].y + dir.y;
    if (run.walls === "wrap") {
      hx = (hx + N) % N;
      hy = (hy + N) % N;
    } else if (hx < 0 || hx >= N || hy < 0 || hy >= N) return die();

    const head = { x: hx, y: hy };
    const eatsFood = same(head, food);
    const eatsBonus = same(head, bonus);
    const body = eatsFood || eatsBonus ? snake : snake.slice(0, -1);
    if (body.some((s) => same(s, head))) return die();

    snake.unshift(head);
    if (eatsFood) {
      score += 10;
      eaten++;
      beep(660);
      food = freeCell();
      if (eaten % 5 === 0 && !bonus) bonus = { ...freeCell(), ttl: 50 };
    } else if (eatsBonus) {
      score += 50;
      bonus = null;
      beep(980, 0.15, "triangle");
    } else {
      snake.pop();
    }
    if (bonus && !eatsBonus && --bonus.ttl <= 0) bonus = null;
    hud();
  }

  function die() {
    state = "over";
    beep(120, 0.35, "sawtooth");
    if (navigator.vibrate) navigator.vibrate(120);
    const lv = run.difficulty,
      rows = boards[lv];
    if (score > bests[lv]) {
      bests[lv] = score;
      store.set("snakeBests", bests);
    }
    hud();
    const qualifies =
      score > 0 && (rows.length < 5 || score > rows[rows.length - 1].score);
    $("nameInput").value = store.get("snakeName", "");
    showOverlay(
      "Game over",
      `Score: ${score} on ${lv[0].toUpperCase() + lv.slice(1)}. ${qualifies ? "You made the leaderboard." : "Try again."}`,
      "Play again",
      qualifies,
    );
  }

  // ---------- flow ----------
  function showOverlay(title, msg, btn, form) {
    $("ovTitle").textContent = title;
    $("ovMsg").textContent = msg;
    $("playBtn").textContent = btn;
    $("saveForm").hidden = !form;
    $("overlay").hidden = false;
    $("pauseBtn").disabled = state !== "playing" && state !== "paused";
    $("pauseBtn").textContent = state === "paused" ? "Resume" : "Pause";
  }

  function start() {
    run = { ...opt };
    reset();
    state = "playing";
    acc = 0;
    last = performance.now();
    $("overlay").hidden = true;
    viewLevel = run.difficulty;
    renderBoard();
    $("pauseBtn").disabled = false;
    $("pauseBtn").textContent = "Pause";
  }

  function togglePause() {
    if (state === "playing") {
      state = "paused";
      showOverlay("Paused", "Take a breath.", "Resume", false);
    } else if (state === "paused") {
      state = "playing";
      last = performance.now();
      $("overlay").hidden = true;
      $("pauseBtn").textContent = "Pause";
    }
  }

  function press(name) {
    if (state === "idle") {
      start();
    }
    if (state === "playing") setDir(name);
  }

  // ---------- rendering ----------
  function fit() {
    const d = window.devicePixelRatio || 1;
    const px = Math.round((canvas.clientWidth || SIZE) * d);
    if (canvas.width === px) return;
    canvas.width = canvas.height = px;
    ctx.setTransform(px / SIZE, 0, 0, px / SIZE, 0, 0);
  }

  function ball(cx, cy, r, c1, c2, c3) {
    const g = ctx.createRadialGradient(
      cx - r * 0.35,
      cy - r * 0.4,
      r * 0.1,
      cx,
      cy,
      r,
    );
    g.addColorStop(0, c1);
    g.addColorStop(0.55, c2);
    g.addColorStop(1, c3);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function blob(x, y, rx, ry, color, rot = 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    const now = performance.now();
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        ctx.fillStyle = (x + y) % 2 ? "#a9d66b" : "#b6e07a";
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }

    if (food) {
      const fx = food.x * CELL + 10,
        fy = food.y * CELL + 11;
      blob(fx + 1, fy + 6, 7, 3, "rgba(30,70,20,.25)");
      ball(fx, fy, 7.5, "#ff9c9c", "#e5303c", "#9e1220");
      blob(fx + 3, fy - 7, 3.6, 1.8, "#3f9b2f", -0.5);
      blob(fx - 2.5, fy - 2.5, 2, 1.2, "rgba(255,255,255,.6)", -0.6);
    }
    if (bonus && (bonus.ttl > 15 || bonus.ttl % 4 < 2)) {
      const bx = bonus.x * CELL + 10,
        by = bonus.y * CELL + 10,
        bob = Math.sin(now / 180) * 1.5;
      blob(bx + 1, by + 7, 7, 3, "rgba(30,70,20,.25)");
      ball(bx, by - 2 + bob, 9, "#fff6bd", "#ffc933", "#b8820a");
      ctx.strokeStyle = "rgba(150,95,0,.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, by - 2 + bob, 5.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // body points from tail to head, with midpoints so the body reads as one smooth tube
    const len = snake.length,
      pts = [];
    for (let i = len - 1; i >= 0; i--) {
      const s = snake[i],
        r = i === 0 ? 10.5 : 9.5 - Math.max(0, i - (len - 4)) * 0.9;
      const p = pts[pts.length - 1];
      if (p && Math.abs(p.gx - s.x) <= 1 && Math.abs(p.gy - s.y) <= 1)
        pts.push({
          x: (p.x + s.x * CELL + 10) / 2,
          y: (p.y + s.y * CELL + 10) / 2,
          r: (p.r + r) / 2,
        });
      pts.push({ x: s.x * CELL + 10, y: s.y * CELL + 10, r, gx: s.x, gy: s.y });
    }
    pts.forEach((p) =>
      blob(p.x + 2, p.y + 5, p.r, p.r * 0.8, "rgba(30,70,20,.22)"),
    );
    pts.forEach((p) => ball(p.x, p.y, p.r, "#9cc8ff", "#2f7df6", "#1b4fb8"));

    const h = pts[pts.length - 1],
      px = -dir.y,
      py = dir.x;
    [-1, 1].forEach((side) => {
      const ex = h.x + dir.x * 3.5 + px * 4.6 * side,
        ey = h.y + dir.y * 3.5 + py * 4.6 * side;
      blob(ex, ey, 3.3, 3.3, "#fff");
      blob(ex + dir.x * 1.1, ey + dir.y * 1.1, 1.7, 1.7, "#14213a");
    });
  }

  function frame(t) {
    if (state === "playing") {
      acc += Math.min(t - last, 250);
      while (acc >= interval() && state === "playing") {
        tick();
        acc -= interval();
      }
    }
    last = t;
    draw();
    requestAnimationFrame(frame);
  }

  function renderBoard() {
    document.querySelectorAll("#tabs button").forEach((b) => {
      const on = b.dataset.level === viewLevel;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on);
    });
    const list = $("scores"),
      rows = boards[viewLevel];
    list.replaceChildren();
    if (!rows.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = `No ${viewLevel} scores yet. Be the first.`;
      list.append(li);
      return;
    }
    rows.forEach((e) => {
      const li = document.createElement("li"),
        n = document.createElement("span"),
        sc = document.createElement("span");
      n.textContent = e.name;
      sc.textContent = e.score;
      li.append(n, sc);
      list.append(li);
    });
  }

  // ---------- events ----------
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, select")) return;
    if (KEYS[e.key]) {
      e.preventDefault();
      press(KEYS[e.key]);
    } else if (e.key === " " || e.key === "p" || e.key === "P") {
      if (e.target.matches("button")) return;
      e.preventDefault();
      togglePause();
    }
  });

  let t0 = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      t0 = e.touches[0];
    },
    { passive: true },
  );
  canvas.addEventListener("touchend", (e) => {
    if (!t0) return;
    const t1 = e.changedTouches[0],
      dx = t1.clientX - t0.clientX,
      dy = t1.clientY - t0.clientY;
    t0 = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    press(
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "down"
          : "up",
    );
  });

  document.querySelectorAll(".dpad button").forEach((b) =>
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      press(b.dataset.dir);
    }),
  );

  $("playBtn").addEventListener("click", () =>
    state === "paused" ? togglePause() : start(),
  );
  $("pauseBtn").addEventListener("click", togglePause);
  $("difficulty").addEventListener("change", (e) => {
    opt.difficulty = e.target.value;
    store.set("snakeDiff", opt.difficulty);
    viewLevel = opt.difficulty;
    renderBoard();
    hud();
  });
  $("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-level]");
    if (b) {
      viewLevel = b.dataset.level;
      renderBoard();
    }
  });
  $("walls").addEventListener("change", (e) => {
    opt.walls = e.target.value;
    store.set("snakeWalls", opt.walls);
  });
  $("soundBtn").addEventListener("click", () => {
    opt.sound = !opt.sound;
    store.set("snakeSound", opt.sound);
    $("soundBtn").textContent = `Sound: ${opt.sound ? "on" : "off"}`;
    $("soundBtn").setAttribute("aria-pressed", opt.sound);
  });
  $("saveForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("nameInput").value.trim().slice(0, 12) || "Anonymous";
    store.set("snakeName", name);
    const lv = run.difficulty;
    boards[lv].push({ name, score });
    boards[lv].sort((a, b) => b.score - a.score);
    boards[lv] = boards[lv].slice(0, 5);
    store.set("leaderboards", boards);
    viewLevel = lv;
    renderBoard();
    $("saveForm").hidden = true;
    $("ovMsg").textContent = "Score saved.";
  });
  new ResizeObserver(fit).observe(canvas);
  window.addEventListener("resize", fit);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") togglePause();
  });

  // ---------- init ----------
  $("difficulty").value = opt.difficulty;
  $("walls").value = opt.walls;
  $("soundBtn").textContent = `Sound: ${opt.sound ? "on" : "off"}`;
  $("soundBtn").setAttribute("aria-pressed", opt.sound);
  run = { ...opt };
  fit();
  reset();
  renderBoard();
  $("pauseBtn").disabled = true;
  requestAnimationFrame(frame);
})();
