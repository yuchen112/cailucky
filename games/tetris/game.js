(() => {
  "use strict";
  const COLS = 10,
    ROWS = 20,
    SHAPES = {
      I: [[1, 1, 1, 1]],
      O: [
        [1, 1],
        [1, 1],
      ],
      T: [
        [0, 1, 0],
        [1, 1, 1],
      ],
      S: [
        [0, 1, 1],
        [1, 1, 0],
      ],
      Z: [
        [1, 1, 0],
        [0, 1, 1],
      ],
      J: [
        [1, 0, 0],
        [1, 1, 1],
      ],
      L: [
        [0, 0, 1],
        [1, 1, 1],
      ],
    },
    TYPES = Object.keys(SHAPES),
    COLORS = {
      I: "#83d2d0",
      O: "#e8c36b",
      T: "#bca2d3",
      S: "#92b477",
      Z: "#d98a8d",
      J: "#748fae",
      L: "#d9a36f",
    };
  const chars = [
    ["鈴可", "幸運葉：整理困難方塊", "../shared/rebuilt/role-luck.webp"],
    ["糯糯", "糯糯的祝福：降低下降速度", "../shared/rebuilt/role-healing.webp"],
    [
      "森芽",
      "森芽的祝福：補上最底層缺口",
      "../shared/rebuilt/role-growth.webp",
    ],
    ["緹雅", "緹雅的祝福：重置保留機會", "../shared/rebuilt/role-memory.webp"],
    ["朵莉", "歡樂：獲得分數加成", "../shared/rebuilt/role-joy.webp"],
    ["米洛", "月光：再次保留並獲得心光", "../shared/rebuilt/role-night.webp"],
    ["伯恩", "伯恩的祝福：清除一枚障礙", "../shared/rebuilt/role-trust.webp"],
    ["汐寧", "雨幕：短暫放慢時間", "../shared/rebuilt/role-sadness.webp"],
    ["露緹", "星願：方塊變成直線", "../shared/rebuilt/role-dream.webp"],
    ["曦羽", "曦羽的祝福：危急時清理底行", "../shared/rebuilt/role-hope.webp"],
  ];
  const charTypes = [
    "幸運型",
    "療癒型",
    "成長型",
    "回憶型",
    "爆發型",
    "預備型",
    "整理型",
    "舒緩型",
    "變形型",
    "救援型",
  ];
  const charDescriptions = [
    "祝福充滿後，移除盤面上一枚最棘手的方塊，替危險局面打開空間。",
    "以溫柔力量暫時降低下降速度，適合需要更多思考時間的玩家。",
    "在最底層補上一個缺口，幫助不整齊的地基重新生長。",
    "立刻恢復一次 HOLD 使用機會，讓關鍵方塊能再次交換。",
    "將累積的歡樂化成大量心光，適合挑戰最高紀錄。",
    "再次開放 HOLD，並獲得 250 × 等級的心光，讓旅程多一個選擇。",
    "解開盤面上一枚障礙，替被封住的路線重新開鎖。",
    "召來雨幕，短時間放慢方塊下降，舒緩高壓局面。",
    "把目前方塊變成直線 I 方塊，創造完成四消的機會。",
    "危急時直接清理最底一行，為盤面帶回希望與空間。",
  ];
  const $ = (s) => document.querySelector(s),
    canvas = $("#board"),
    ctx = canvas.getContext("2d"),
    nextCtx = $("#next").getContext("2d"),
    holdCtx = $("#hold").getContext("2d");

  let board,
    cur,
    next,
    hold,
    canHold,
    score,
    level,
    lines,
    combo,
    charge,
    dropMs,
    last = 0,
    acc = 0,
    running = false,
    paused = false,
    cell = 28,
    charIndex = 0,
    best = +localStorage.mindTetrisBest || 0;
  let bag = [],
    slowLeft = 0,
    lockElapsed = 0,
    lockResets = 0,
    roundTime = 0,
    rule = "marathon";
  function bagType() {
    if (!bag.length) {
      bag = [...TYPES];
      for (let i = bag.length - 1; i; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    return bag.pop();
  }
  function piece(type = bagType()) {
    return { type, m: SHAPES[type].map((r) => r.slice()), x: 3, y: 0 };
  }
  let preparingRound = false;
  async function reset() {
    if (preparingRound) return;
    preparingRound = true;
    const controls = [
      "#start",
      "#quickClassic",
      "#restart",
      "#resultAgain",
    ].map($);
    controls.forEach((button) => (button.disabled = true));
    const status = $("#roundLoading");
    status.textContent = "正在準備方塊圖像…";
    try {
      await Promise.all(
        Object.values(blockSprites).map(async (image) => {
          if (image.complete && !image.naturalWidth) {
            const url = new URL(image.src);
            url.searchParams.set("retry", Date.now());
            image.src = url.href;
          }
          await image.decode();
        }),
      );
      status.textContent = "";
    } catch {
      status.textContent = "方塊圖像載入失敗，請再試一次。";
      return;
    } finally {
      preparingRound = false;
      controls.forEach((button) => (button.disabled = false));
    }
    bag = [];
    slowLeft = 0;
    lockElapsed = lockResets = roundTime = 0;
    rule = $("#journeyRule").value;
    CxQ.resume();
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    cur = piece();
    next = piece();
    hold = null;
    canHold = true;
    score = 0;
    level = 1;
    lines = 0;
    combo = 0;
    charge = 0;
    dropMs = 820;
    running = true;
    paused = false;
    last = acc = 0;
    showScreen("play");
    $("#pause").classList.remove("show");
    setFace("excited");
    setTimeout(() => running && setFace("think"), 1000);
    update();
    resize();
    CxQ.orientation("portrait", running);
  }
  function collide(p = cur, dx = 0, dy = 0, m = p.m) {
    for (let y = 0; y < m.length; y++)
      for (let x = 0; x < m[y].length; x++)
        if (m[y][x]) {
          const nx = p.x + x + dx,
            ny = p.y + y + dy;
          if (nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && board[ny][nx]))
            return true;
        }
    return false;
  }
  function resetLock() {
    if (lockElapsed > 0 && lockResets < 15) {
      lockElapsed = 0;
      lockResets++;
    }
  }
  function move(dx) {
    if (!collide(cur, dx)) {
      cur.x += dx;
      resetLock();
      CxQ.sound("move");
      draw();
    }
  }
  function soft(manual = true) {
    if (!collide(cur, 0, 1)) {
      cur.y++;
      if (manual) score++;
      lockElapsed = 0;
      update();
      draw();
    }
  }
  function hard() {
    let d = 0;
    while (!collide(cur, 0, 1)) {
      cur.y++;
      d++;
    }
    score += d * 2;
    CxQ.sound("drop");
    setFace("determined");
    lock();
    setTimeout(() => running && setFace("think"), 420);
  }
  function rotate() {
    if (cur.type === "O") return;
    const m = cur.m[0].map((_, i) => cur.m.map((r) => r[i]).reverse()),
      ox = cur.x,
      oy = cur.y;
    for (const [dx, dy] of [
      [0, 0],
      [-1, 0],
      [1, 0],
      [-2, 0],
      [2, 0],
      [0, -1],
      [-1, -1],
      [1, -1],
      [0, -2],
    ]) {
      cur.x = ox + dx;
      cur.y = oy + dy;
      if (!collide(cur, 0, 0, m)) {
        cur.m = m;
        resetLock();
        CxQ.sound("rotate");
        draw();
        return;
      }
    }
    cur.x = ox;
    cur.y = oy;
  }
  function doHold() {
    if (!canHold) return;
    lockElapsed = lockResets = 0;
    const old = hold;
    hold = piece(cur.type);
    cur = old ? piece(old.type) : next;
    next = old ? next : piece();
    canHold = false;
    if (collide()) gameOver();
    draw();
  }
  function lock() {
    lockElapsed = lockResets = 0;
    cur.m.forEach((r, y) =>
      r.forEach((v, x) => {
        if (v && cur.y + y >= 0) board[cur.y + y][cur.x + x] = cur.type;
      }),
    );
    clearLines();
    if (rule === "sprint" && lines >= 40) {
      finishChallenge();
      return;
    }
    cur = next;
    next = piece();
    canHold = true;
    if (collide()) gameOver();
    update();
    draw();
  }
  function clearLines() {
    let n = 0;
    for (let y = ROWS - 1; y >= 0; y--)
      if (board[y].every(Boolean)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(0));
        n++;
        y++;
      }
    if (n) {
      CxQ.sound(n === 4 ? "win" : "match");
      combo++;
      score += [0, 100, 300, 500, 850][n] * level + combo * 35;
      lines += n;
      charge = Math.min(4, charge + n);
      level = Math.floor(lines / 10) + 1;
      dropMs = Math.max(95, 820 - (level - 1) * 58);
      toast(n === 4 ? "完美織線！" : `連續編織 ×${combo}`);
      setFace(
        n === 4 ? "tetris" : combo > 2 ? "laugh" : combo > 1 ? "proud" : "win",
      );
      setTimeout(() => running && setFace("think"), 1050);
    } else combo = 0;
  }
  function activate() {
    if (!running || paused || charge < 4 || !$("#blessingMode").checked) return;
    charge = 0;
    let msg = "祝福發動";
    if (charIndex === 0 || charIndex === 6) {
      outer: for (let y = ROWS - 1; y >= 0; y--)
        for (let x = 0; x < COLS; x++)
          if (board[y][x]) {
            board[y][x] = 0;
            break outer;
          }
    } else if (charIndex === 1 || charIndex === 7) {
      slowLeft = 9000;
    } else if (charIndex === 2) {
      const y = ROWS - 1,
        holes = board[y]
          .map((v, i) => (v ? null : i))
          .filter((v) => v !== null);
      if (holes.length) {
        board[y][holes[0]] = "S";
        clearLines();
      }
    } else if (charIndex === 3) {
      canHold = true;
    } else if (charIndex === 4) {
      score += 1000 * level;
    } else if (charIndex === 8) {
      const candidate = piece("I");
      if (!collide(candidate)) cur = candidate;
      else {
        charge = 4;
        toast("上方空間不足，祝福已保留");
        return;
      }
    } else if (charIndex === 9 && board[ROWS - 1].some(Boolean)) {
      board.pop();
      board.unshift(Array(COLS).fill(0));
    } else {
      canHold = true;
      score += 250 * level;
      msg = "回收與預備：可再次保留方塊";
    }
    toast(chars[charIndex][0] + "・" + msg);
    setFace("magic");
    setTimeout(() => running && setFace("relieved"), 900);
    update();
    draw();
  }
  function finishChallenge() {
    running = false;
    releaseControls();
    CxQ.orientation("portrait", false);
    CxQ.sound("win");
    const raw = CxQ.read("cxq-tetris-sprint-v1", []),
      list = Array.isArray(raw) ? raw : [];
    list.push({
      seconds: Math.round(roundTime / 10) / 100,
      score,
      blessings: $("#blessingMode").checked,
      date: Date.now(),
    });
    CxQ.write(
      "cxq-tetris-sprint-v1",
      list
        .filter((v) => v && Number.isFinite(v.seconds) && v.seconds >= 0)
        .sort((a, b) => a.seconds - b.seconds)
        .slice(0, 30),
    );
    setFace("tetris");
    showResult(
      "完成 40 行",
      (roundTime / 1000).toFixed(2) + " 秒 · " + score + " 分",
    );
    update();
  }
  function gameOver() {
    running = false;
    CxQ.orientation("portrait", false);
    CxQ.sound("lose");
    const record = rule === "marathon" && score > best;
    if (record) {
      best = score;
      CxQ.write("mindTetrisBest", best);
    }
    setFace(record ? "surprised" : score ? "dizzy" : "sad");
    showResult("旅程結束", score + " 分 · 消除 " + lines + " 行");
    update();
  }
  function ghost() {
    let y = cur.y;
    while (!collide({ ...cur, y }, 0, 1)) y++;
    return y;
  }
  const blockTypes = [..."IOTSZJL"];
  const customBlockStyles = new Set(["candy", "emerald", "toy", "paper", "pixel"]);
  function blockArt(type, index) {
    const theme = window.CxQTheme?.current;
    if (customBlockStyles.has(theme))
      return "art/" + theme + "/block-" + type + ".webp?v=20261113-audit2";
    return "../shared/rebuilt/block-" + index + ".webp";
  }
  const blockSprites = Object.fromEntries(
    blockTypes.map((type, index) => {
      const image = new Image();
      image.src = blockArt(type, index);
      image.onload = () => {
        if (board) draw();
      };
      return [type, image];
    }),
  );
  function cellDraw(context, x, y, type, alpha = 1, size = cell) {
    const sprite = blockSprites[type];
    if (!sprite?.complete || !sprite.naturalWidth) return;
    context.save();
    context.globalAlpha = alpha;
    context.drawImage(sprite, x * size + 1, y * size + 1, size - 2, size - 2);
    context.restore();
  }
  function draw() {
    if (!board) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = document.documentElement.dataset.visualTheme==="candy"?"#92788c40":"#e8d5a217";
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cell, 0);
      ctx.lineTo(x * cell, ROWS * cell);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cell);
      ctx.lineTo(COLS * cell, y * cell);
      ctx.stroke();
    }
    board.forEach((r, y) => r.forEach((v, x) => v && cellDraw(ctx, x, y, v)));
    const gy = ghost();
    cur.m.forEach((r, y) =>
      r.forEach(
        (v, x) => v && cellDraw(ctx, cur.x + x, gy + y, cur.type, window.CxQTheme?.current==="candy"?.35:.18),
      ),
    );
    cur.m.forEach((r, y) =>
      r.forEach((v, x) => v && cellDraw(ctx, cur.x + x, cur.y + y, cur.type)),
    );
    mini(nextCtx, next);
    mini(holdCtx, hold);
    const danger = board.slice(0, 5).some((r) => r.some(Boolean));
    $("#companion").classList.toggle("danger", danger);
    if (danger) setFace("danger");
  }
  function mini(c, p) {
    c.clearRect(0, 0, 84, 84);
    if (!p) return;
    const s = 17,
      ox = (84 - p.m[0].length * s) / 2,
      oy = (84 - p.m.length * s) / 2;
    p.m.forEach((r, y) =>
      r.forEach(
        (v, x) => v && cellDraw(c, ox / s + x, oy / s + y, p.type, 1, s),
      ),
    );
  }
  function resize() {
    CxQ.orientation("portrait", running);
    if (!running) return;
    const stage=$(".stage"), rect=stage.getBoundingClientRect(), sidebar=Math.max(72,Math.min(88,Math.round(rect.width*.21)));
    const slot={width:rect.width-sidebar-8,height:rect.height};
    cell = Math.max(
      6,
      Math.floor(Math.min((slot.width-14) / COLS, (slot.height-14) / ROWS)),
    );
    stage.style.setProperty("grid-template-columns",(COLS*cell+14)+"px "+sidebar+"px","important");
    canvas.width = COLS * cell;
    canvas.height = ROWS * cell;
    draw();
  }
  addEventListener("cxq-theme-change", () => {
    blockTypes.forEach((type, index) => {
      const image = blockSprites[type];
      const src = new URL(blockArt(type, index), document.baseURI).href;
      if (image.src !== src) image.src = src;
    });
    if (board) draw();
  });
  function update() {
    $("#score").textContent = score || 0;
    $("#level").textContent = level || 1;
    $("#lines").textContent = lines || 0;
    $("#best").textContent =
      rule === "marathon" ? Math.max(best, score || 0) : best;
    $("#skillText").textContent = (charge || 0) + "/4";
    $("#skill").disabled = charge < 4 || !$("#blessingMode").checked;
  }
  const foxExpressions = {
    win: 1,
    danger: 2,
    thinking: 3,
    pause: 4,
    excited: 5,
    sad: 6,
    surprised: 7,
    proud: 8,
    laugh: 9,
    determined: 10,
    dizzy: 11,
    magic: 12,
    relieved: 13,
    love: 14,
    tetris: 15,
    wave: 16,
  };
  function setFace(state) {
    const base=chars[charIndex][2].replace('role-','').replace('.webp','');
    const src=base+(['excited','tetris','magic','love','surprised'].includes(state)?'-victory':'-idle')+'.webp';
    $(".pause-card img").src=chars[charIndex][2];
    const image = $("#companionImg");
    if (image.getAttribute("src") !== src) image.src = src;
  }
  function toast(t) {
    const el = $("#toast");
    el.textContent = t;
    el.classList.remove("show");
    void el.offsetWidth;
    el.classList.add("show");
  }
  function pause() {
    releaseControls();
    if (!running) return;
    paused = true;
    setFace("pause");
    $("#pause").classList.add("show");
  }
  function resume() {
    if (CxQ.orientation("portrait", running)) return;
    $("#pause").classList.remove("show");
    CxQ.countdown(() => {
      if (CxQ.orientation("portrait", running)) return;
      CxQ.resume();
      paused = false;
      last = 0;
      setFace("think");
      $("#pause").classList.remove("show");
    });
  }
  function act(a) {
    if (!running || paused) return;
    (
      ({
        left: () => move(-1),
        right: () => move(1),
        rotate,
        soft,
        drop: hard,
        hold: doHold,
      })[a] || (() => {})
    )();
  }
  function loop(t) {
    if (!last) last = t;
    const dt = Math.min(100, Math.max(0, t - last));
    last = t;
    if (running && !paused && !document.hidden) {
      roundTime += dt;
      slowLeft = Math.max(0, slowLeft - dt);
      acc += dt;
      if (rule !== "zen" && acc > dropMs + (slowLeft > 0 ? 220 : 0)) {
        soft(false);
        acc = 0;
      }
      if (collide(cur, 0, 1)) {
        lockElapsed += dt;
        if (lockElapsed >= 500) lock();
      } else lockElapsed = 0;
    }
    requestAnimationFrame(loop);
  }
  chars.forEach((c, i) => {
    const b = document.createElement("button");
    b.className = "char" + (i === 0 ? " active" : "");
    b.innerHTML = `<img src="${c[2]}" alt="${c[0]}"><b>${c[0]}</b>`;
    b.onclick = () => {
      charIndex = i;
      document
        .querySelectorAll(".char")
        .forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      const src = `${c[2]}`;
      $("#charName").textContent = c[0];
      $("#charPower").textContent = c[1];
      $("#detailCharImg").src = src;
      $("#detailCharName").textContent = c[0] + "・" + charTypes[i];
      $("#detailCharPower").textContent = charDescriptions[i];
      setFace("love");
    };
    $("#roster").appendChild(b);
  });
  const heldControls=new Map();
  function releaseControls(id){
    for(const [pointer,held] of heldControls){if(id!==undefined&&pointer!==id)continue;clearTimeout(held.delay);clearInterval(held.repeat);heldControls.delete(pointer);}
  }
  document.querySelectorAll('[data-act]').forEach(button=>{
    button.onpointerdown=e=>{if(e.button!==0||heldControls.has(e.pointerId))return;e.preventDefault();button.setPointerCapture(e.pointerId);const held={};heldControls.set(e.pointerId,held);act(button.dataset.act);if(['left','right','soft'].includes(button.dataset.act))held.delay=setTimeout(()=>{held.repeat=setInterval(()=>act(button.dataset.act),65)},170);};
    button.onpointerup=button.onpointercancel=button.onlostpointercapture=e=>releaseControls(e.pointerId);
    button.onclick=e=>{if(e.detail===0)act(button.dataset.act)};
  });
  addEventListener('pointerup',e=>releaseControls(e.pointerId));
  addEventListener('blur',()=>releaseControls());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseControls()});

  function showScreen(id) {
    document
      .querySelectorAll(".screen")
      .forEach((screen) => screen.classList.toggle("show", screen.id === id));
  }
  function showResult(title, summary) {
    $("#result>img").src=chars[charIndex][2].replace("role-", "").replace(".webp",title.includes("完成")?"-victory.webp":"-idle.webp");
    $("#resultTitle").textContent = title;
    $("#resultSummary").textContent = summary;
    $("#pause").classList.remove("show");
    showScreen("result");
  }
  $("#enterSetup").onclick = () => showScreen("menu");
  $("#backHome").onclick = () => showScreen("homeScreen");
  $("#resultSetup").onclick = () => showScreen("menu");
  $("#resultAgain").onclick = reset;
  $("#showHowto").onclick = (event) =>
    event.currentTarget.setAttribute(
      "aria-expanded",
      String($("#howto").classList.toggle("show")),
    );
  $("#quickClassic").onclick = () => {
    $("#blessingMode").checked = false;
    $("#journeyRule").value = "marathon";
    reset();
  };
  $("#start").onclick = reset;
  $("#pauseBtn").onclick = pause;
  $("#resume").onclick = resume;
  $("#restart").onclick = reset;
  $("#home").onclick = () => {
    running = false;
    setFace("wave");
    $("#pause").classList.remove("show");
    showScreen("homeScreen");
    CxQ.orientation("portrait", false);
  };
  $("#skill").onclick = activate;
  $("#blessingMode").onchange = update;
  window.onresize = resize;
  window.visualViewport?.addEventListener("resize", resize);
  document.onkeydown = (e) => {
    if (!running) return;
    if (e.code === "Space" && e.target.closest?.("button,input,select")) return;
    if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(
        e.code,
      )
    )
      e.preventDefault();
    if (e.key === "Escape") paused ? resume() : pause();
    if (e.key === "ArrowLeft") act("left");
    if (e.key === "ArrowRight") act("right");
    if (e.key === "ArrowUp") act("rotate");
    if (e.key === "ArrowDown") act("soft");
    if (e.code === "Space") {
      e.preventDefault();
      act("drop");
    }
    if (e.key.toLowerCase() === "c") act("hold");
  };
  CxQ.configure({ music: "arcade", pause });
  update();
  requestAnimationFrame(loop);
})();
