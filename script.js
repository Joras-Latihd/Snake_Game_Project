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
  let board = store.get("leaderboard", []); // same key as the old version, so old scores carry over
  let best = store.get("snakeBest", 0);
  const opt = {
    difficulty: store.get("snakeDiff", "normal"),
    walls: store.get("snakeWalls", "solid"),
    sound: store.get("snakeSound", true),
  };

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
    $("best").textContent = best;
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
    if (score > best) {
      best = score;
      store.set("snakeBest", best);
    }
    hud();
    const qualifies =
      score > 0 && (board.length < 5 || score > board[board.length - 1].score);
    $("nameInput").value = store.get("snakeName", "");
    showOverlay(
      "Game over",
      `Score: ${score}. ${qualifies ? "You made the leaderboard." : "Try again."}`,
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
    canvas.width = canvas.height = Math.round(SIZE * d);
    ctx.setTransform(
      (d * canvas.width) / (SIZE * d),
      0,
      0,
      (d * canvas.height) / (SIZE * d),
      0,
      0,
    );
  }

  function draw() {
    ctx.fillStyle = "#05080a";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.strokeStyle = "rgba(0,255,136,.05)";
    ctx.lineWidth = 1;
    for (let i = 1; i < N; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, SIZE);
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(SIZE, i * CELL);
      ctx.stroke();
    }
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ff3355";
    ctx.fillStyle = "#ff3355";
    ctx.beginPath();
    ctx.arc(food.x * CELL + 10, food.y * CELL + 10, 7, 0, 7);
    ctx.fill();
    if (bonus && (bonus.ttl > 15 || bonus.ttl % 4 < 2)) {
      ctx.shadowColor = "#ffd23f";
      ctx.fillStyle = "#ffd23f";
      ctx.beginPath();
      ctx.arc(bonus.x * CELL + 10, bonus.y * CELL + 10, 9, 0, 7);
      ctx.fill();
    }
    ctx.shadowColor = "#00ff88";
    snake.forEach((s, i) => {
      ctx.fillStyle =
        i === 0 ? "#c8ffe4" : `hsl(150 100% ${Math.max(32, 52 - i)}%)`;
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    });
    ctx.shadowBlur = 0;
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
    const list = $("scores");
    list.replaceChildren();
    if (!board.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "No scores yet. Be the first.";
      list.append(li);
      return;
    }
    board.forEach((e) => {
      const li = document.createElement("li"),
        n = document.createElement("span"),
        s = document.createElement("span");
      n.textContent = e.name;
      s.textContent = e.score;
      li.append(n, s);
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
    board.push({ name, score });
    board.sort((a, b) => b.score - a.score);
    board = board.slice(0, 5);
    store.set("leaderboard", board);
    renderBoard();
    $("saveForm").hidden = true;
    $("ovMsg").textContent = "Score saved.";
  });
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
