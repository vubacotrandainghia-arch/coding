const STORAGE_KEY = "battle-wars-users";

const $ = (id) => document.getElementById(id);

const MAPS = {
  forest: { name: "Rừng", bg: "#1b5133", particle: "🍃", music: "Forest Theme" },
  desert: { name: "Sa mạc", bg: "#8d6a30", particle: "🌪", music: "Desert Wind" },
  urban: { name: "Đô thị", bg: "#3a4357", particle: "💨", music: "Urban Pulse" },
};

const VEHICLES = [
  { id: "none", name: "Đi bộ", speed: 2 },
  { id: "car", name: "Ô tô", speed: 3.2 },
  { id: "motor", name: "Mô tô", speed: 3.8 },
  { id: "heli", name: "Trực thăng", speed: 4.4 },
  { id: "ship", name: "Tàu", speed: 2.7 },
  { id: "plane", name: "Máy bay", speed: 5.1 },
];

const SHOP_ITEMS = [
  { id: "pistol", type: "weapon", name: "Súng ngắn", priceCoin: 40, priceCash: 2, minLevel: 1 },
  { id: "rifle", type: "weapon", name: "Rifle tấn công", priceCoin: 140, priceCash: 6, minLevel: 2 },
  { id: "sniper", type: "weapon", name: "Sniper scope", priceCoin: 250, priceCash: 11, minLevel: 4 },
  { id: "armor-a", type: "armor", name: "Áo giáp I", priceCoin: 90, priceCash: 4, minLevel: 2 },
  { id: "armor-b", type: "armor", name: "Áo giáp II", priceCoin: 200, priceCash: 9, minLevel: 5 },
  { id: "shield-x", type: "item", name: "Lá chắn plasma", priceCoin: 320, priceCash: 14, minLevel: 6 },
];

const game = {
  users: loadUsers(),
  currentUser: null,
  state: null,
  keys: {},
  offer: null,
};

function loadUsers() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  const seed = {
    admin: {
      username: "admin",
      password: "battlewars",
      role: "admin",
      coin: Number.MAX_SAFE_INTEGER,
      cash: Number.MAX_SAFE_INTEGER,
      level: 99,
      inventory: ["all-weapons", "all-armors", "god-shield"],
      friends: ["LuckyNPC"],
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function saveUsers() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(game.users));
}

function secureText(input) {
  return input.replace(/[^\w.-]/g, "").slice(0, 18);
}

function hashPass(pass) {
  let hash = 0;
  for (let i = 0; i < pass.length; i += 1) {
    hash = (hash << 5) - hash + pass.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

function flash(msg, bad = false) {
  $("auth-msg").textContent = msg;
  $("auth-msg").className = `msg ${bad ? "bad" : "good"}`;
}

function login(username, password) {
  const user = game.users[username];
  if (!user) return flash("Tài khoản không tồn tại", true);
  if (user.password !== hashPass(password) && !(username === "admin" && password === "battlewars")) {
    return flash("Sai mật khẩu", true);
  }
  game.currentUser = user;
  game.currentUser.username = username;
  openGame();
}

function register(username, password) {
  if (!username || !password) return flash("Thiếu thông tin", true);
  if (game.users[username]) return flash("Tên tài khoản đã tồn tại", true);
  game.users[username] = {
    username,
    password: hashPass(password),
    role: "player",
    coin: 120,
    cash: 15,
    level: 1,
    inventory: ["knife"],
    friends: [],
  };
  saveUsers();
  flash("Đăng ký thành công! Mời đăng nhập.");
}

function initAuth() {
  $("tab-login").onclick = () => {
    $("tab-login").classList.add("active");
    $("tab-register").classList.remove("active");
    $("login-form").classList.remove("hidden");
    $("register-form").classList.add("hidden");
  };
  $("tab-register").onclick = () => {
    $("tab-register").classList.add("active");
    $("tab-login").classList.remove("active");
    $("register-form").classList.remove("hidden");
    $("login-form").classList.add("hidden");
  };
  $("login-form").onsubmit = (e) => {
    e.preventDefault();
    login(secureText($("login-user").value.trim()), $("login-pass").value);
  };
  $("register-form").onsubmit = (e) => {
    e.preventDefault();
    register(secureText($("register-user").value.trim()), $("register-pass").value);
  };
}

function openGame() {
  $("auth-screen").classList.add("hidden");
  $("game-screen").classList.remove("hidden");
  setUpGameState();
  initControls();
  renderStaticUi();
  loop();
}

function setUpGameState() {
  game.state = {
    running: false,
    map: "forest",
    difficulty: "normal",
    time: 120,
    spawnTick: 0,
    enemyKills: 0,
    player: {
      x: 120,
      y: 220,
      hp: 100,
      ammo: 80,
      speed: 2,
      scoped: false,
      vehicle: VEHICLES[0],
    },
    enemies: [],
    allies: [],
    bullets: [],
    boss: null,
    particles: [],
    outcome: "",
  };
}

function initControls() {
  document.onkeydown = (e) => {
    game.keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === "q") game.state.player.scoped = !game.state.player.scoped;
    if (e.key === " ") shoot();
  };
  document.onkeyup = (e) => {
    game.keys[e.key.toLowerCase()] = false;
  };

  $("logout-btn").onclick = () => location.reload();
  $("start-match").onclick = startMatch;
  $("map-select").onchange = (e) => {
    game.state.map = e.target.value;
    emit(`Map: ${MAPS[game.state.map].name} | Nhạc: ${MAPS[game.state.map].music}`);
  };
  $("difficulty-select").onchange = (e) => (game.state.difficulty = e.target.value);
  $("hospital-btn").onclick = () => {
    if (game.currentUser.coin < 20 && game.currentUser.role !== "admin") return emit("Không đủ xu tới bệnh viện");
    if (game.currentUser.role !== "admin") game.currentUser.coin -= 20;
    game.state.player.hp = Math.min(100, game.state.player.hp + 60);
    emit("Bệnh viện đã chữa thương +60 HP");
    saveUsers();
    renderStatus();
  };
  $("invite-btn").onclick = () => emit("Đã mời người chơi bên ngoài vào phòng đấu!");
  $("add-friend-btn").onclick = addFriend;
  $("topup-btn").onclick = topUp;
  $("buy-offer").onclick = buyOffer;
  $("use-vehicle").onclick = useVehicle;
}

function renderStaticUi() {
  const vSel = $("vehicle-select");
  VEHICLES.forEach((v) => {
    const op = document.createElement("option");
    op.value = v.id;
    op.textContent = `${v.name} (speed ${v.speed})`;
    vSel.append(op);
  });

  const shop = $("shop-items");
  shop.innerHTML = "";
  SHOP_ITEMS.forEach((item) => {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `<b>${item.name}</b><br/>Lv.${item.minLevel}+ | ${item.priceCoin} xu hoặc ${item.priceCash}$ <button data-id="${item.id}">Mua</button>`;
    row.querySelector("button").onclick = () => buyItem(item.id);
    shop.append(row);
  });

  rollOffer();
  renderFriends();
  renderInventory();
  renderStatus();
}

function renderStatus() {
  const user = game.currentUser;
  const st = game.state;
  $("user-info").textContent = `👤 ${user.username} (${user.role}) Lv.${user.level}`;
  $("currency-info").textContent = `💰 Xu: ${safeDisplay(user.coin)} | Tiền: ${safeDisplay(user.cash)}`;
  $("match-info").textContent = `🕒 ${st.time}s | Kills: ${st.enemyKills}`;
  $("hp-bar").textContent = `HP: ${st.player.hp}`;
  $("ammo-info").textContent = `Ammo: ${st.player.ammo}`;
  $("scope-state").textContent = st.player.scoped ? "🔭 Scope ON (Q)" : "Scope OFF (Q)";
  $("vehicle-info").textContent = `Đang dùng: ${st.player.vehicle.name}`;
}

function safeDisplay(n) {
  return n > 1e15 ? "∞" : Math.floor(n);
}

function addFriend() {
  const name = secureText($("friend-name").value.trim());
  if (!name) return;
  if (!game.currentUser.friends.includes(name)) game.currentUser.friends.push(name);
  saveUsers();
  renderFriends();
  emit(`Đã kết bạn với ${name}`);
}

function renderFriends() {
  const ul = $("friend-list");
  ul.innerHTML = "";
  game.currentUser.friends.forEach((f) => {
    const li = document.createElement("li");
    li.textContent = `🤝 ${f}`;
    ul.append(li);
  });
}

function renderInventory() {
  const ul = $("inventory");
  ul.innerHTML = "";
  game.currentUser.inventory.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `• ${item}`;
    ul.append(li);
  });
}

function topUp() {
  const amount = Number($("topup-amount").value || 0);
  const cur = $("currency-select").value;
  const pay = $("payment-select").value;
  if (amount <= 0) return emit("Số nạp không hợp lệ");
  const converted = Math.round(amount * 1.5);
  if (game.currentUser.role !== "admin") {
    game.currentUser.coin += converted;
    game.currentUser.cash += Math.round(amount / 40);
  }
  saveUsers();
  emit(`Nạp thành công ${amount} ${cur} qua ${pay}. +${converted} xu`);
  renderStatus();
}

function buyItem(id) {
  const item = SHOP_ITEMS.find((s) => s.id === id);
  if (!item) return;
  if (game.currentUser.level < item.minLevel && game.currentUser.role !== "admin") {
    return emit(`Cần level ${item.minLevel} để mua ${item.name}`);
  }
  if (game.currentUser.role !== "admin" && game.currentUser.coin < item.priceCoin && game.currentUser.cash < item.priceCash) {
    return emit("Không đủ tiền để mua");
  }
  if (game.currentUser.role !== "admin") {
    if (game.currentUser.coin >= item.priceCoin) game.currentUser.coin -= item.priceCoin;
    else game.currentUser.cash -= item.priceCash;
  }
  game.currentUser.inventory.push(item.name);
  saveUsers();
  renderInventory();
  renderStatus();
  emit(`Đã mua ${item.name}`);
}

function rollOffer() {
  const offers = [
    { name: "Legend Pack", price: 20, reward: "Hero Titan + Plasma Gun" },
    { name: "Sniper Elite", price: 12, reward: "Sniper X + Armor II" },
    { name: "Lucky Wings", price: 15, reward: "Triệu hồi Lucky sớm" },
  ];
  game.offer = offers[Math.floor(Math.random() * offers.length)];
  $("offer-box").innerHTML = `<b>${game.offer.name}</b><br/>${game.offer.reward}<br/>Giá: ${game.offer.price}$`;
}

function buyOffer() {
  if (game.currentUser.role !== "admin" && game.currentUser.cash < game.offer.price) return emit("Không đủ tiền mặt");
  if (game.currentUser.role !== "admin") game.currentUser.cash -= game.offer.price;
  game.currentUser.inventory.push(game.offer.reward);
  saveUsers();
  renderInventory();
  renderStatus();
  emit(`Bạn đã mua gói ${game.offer.name}`);
  rollOffer();
}

function useVehicle() {
  const id = $("vehicle-select").value;
  const vehicle = VEHICLES.find((v) => v.id === id) || VEHICLES[0];
  game.state.player.vehicle = vehicle;
  game.state.player.speed = vehicle.speed;
  renderStatus();
}

function startMatch() {
  const s = game.state;
  s.running = true;
  s.time = 120;
  s.enemyKills = 0;
  s.outcome = "";
  s.enemies = [];
  s.allies = [makeBot(true), makeBot(true)];
  s.boss = null;
  s.player.hp = 100;
  s.player.ammo = 120;
  emit("Trận đấu bắt đầu!");
}

function makeBot(ally = false) {
  return {
    x: Math.random() * 840 + 20,
    y: Math.random() * 460 + 20,
    hp: ally ? 70 : 45,
    ally,
    cooldown: 0,
  };
}

function shoot(from = game.state.player, enemyTarget = false) {
  if (!enemyTarget && from.ammo <= 0) return;
  if (!enemyTarget) from.ammo -= 1;
  const angle = from.ally ? Math.random() * Math.PI * 2 : Math.atan2((game.mouseY || from.y) - from.y, (game.mouseX || from.x) - from.x);
  const speed = from.ally ? 4 : game.state.player.scoped ? 8 : 6;
  game.state.bullets.push({ x: from.x, y: from.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, enemyTarget });
}

function spawnEnemy() {
  game.state.enemies.push(makeBot(false));
}

function maybeSpawnLucky() {
  const s = game.state;
  if (!s.boss && s.player.hp < 35 && s.enemies.length >= 8) {
    s.boss = {
      name: "Lucky",
      x: 760,
      y: 110,
      hp: 300,
      animation: "Fly",
      cooldown: 0,
    };
    emit("🔥 Lucky xuất hiện bảo vệ phe người tốt!");
  }
}

function update(dt) {
  const s = game.state;
  if (!s.running) return;

  s.time -= dt;
  if (s.time <= 0) return finishMatch(s.enemyKills >= 15);

  s.spawnTick += dt;
  const spawnRate = s.difficulty === "chaos" ? 0.7 : s.difficulty === "hard" ? 1.1 : 1.5;
  if (s.spawnTick > spawnRate) {
    spawnEnemy();
    s.spawnTick = 0;
  }

  movePlayer();

  s.allies.forEach((a) => {
    a.cooldown -= dt;
    if (a.cooldown <= 0 && s.enemies.length > 0) {
      shoot(a, true);
      a.cooldown = 1.2;
    }
  });

  s.enemies.forEach((e) => {
    const dx = s.player.x - e.x;
    const dy = s.player.y - e.y;
    const len = Math.hypot(dx, dy) || 1;
    e.x += (dx / len) * 1.1;
    e.y += (dy / len) * 1.1;
    if (len < 15) s.player.hp -= 0.25;
  });

  if (s.boss) {
    s.boss.cooldown -= dt;
    s.boss.animation = s.boss.hp > 200 ? "Fly" : s.boss.hp > 120 ? "Attack" : "TakeDamage";
    if (s.boss.cooldown <= 0) {
      const target = s.enemies[Math.floor(Math.random() * s.enemies.length)];
      if (target) {
        s.bullets.push({ x: s.boss.x, y: s.boss.y, vx: (target.x - s.boss.x) / 20, vy: (target.y - s.boss.y) / 20, enemyTarget: true, lucky: true });
      }
      s.boss.cooldown = 0.5;
    }
  }

  s.bullets.forEach((b) => {
    b.x += b.vx;
    b.y += b.vy;
  });

  hitDetect();
  maybeSpawnLucky();
  if (s.player.hp <= 0) finishMatch(false);
}

function finishMatch(win) {
  const s = game.state;
  s.running = false;
  s.outcome = win ? "THẮNG" : "THUA";
  if (win) {
    if (game.currentUser.role !== "admin") {
      game.currentUser.coin += 110 + s.enemyKills * 4;
      game.currentUser.level += 1;
    }
    emit(`✅ Bạn ${s.outcome}! + thưởng.`);
  } else emit("❌ Thất bại, hãy nâng cấp trang bị.");
  saveUsers();
  renderStatus();
}

function hitDetect() {
  const s = game.state;
  s.bullets = s.bullets.filter((b) => b.x >= 0 && b.y >= 0 && b.x <= 900 && b.y <= 520);

  s.bullets.forEach((b) => {
    const targets = b.enemyTarget ? s.enemies : [];
    targets.forEach((enemy) => {
      if (Math.hypot(b.x - enemy.x, b.y - enemy.y) < 14) {
        enemy.hp -= b.lucky ? 22 : 12;
        b.x = -999;
      }
    });
  });

  s.bullets.forEach((b) => {
    if (!b.enemyTarget) return;
  });

  const before = s.enemies.length;
  s.enemies = s.enemies.filter((e) => e.hp > 0);
  const diff = before - s.enemies.length;
  if (diff > 0) s.enemyKills += diff;

  renderStatus();
}

function movePlayer() {
  const p = game.state.player;
  if (game.keys.w) p.y -= p.speed;
  if (game.keys.s) p.y += p.speed;
  if (game.keys.a) p.x -= p.speed;
  if (game.keys.d) p.x += p.speed;
  p.x = Math.max(10, Math.min(890, p.x));
  p.y = Math.max(10, Math.min(510, p.y));
}

function draw() {
  const c = $("battlefield");
  const ctx = c.getContext("2d");
  const s = game.state;
  const map = MAPS[s.map];

  ctx.fillStyle = map.bg;
  ctx.fillRect(0, 0, c.width, c.height);

  for (let i = 0; i < 26; i += 1) {
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillText(map.particle, (i * 37 + performance.now() * 0.03) % c.width, (i * 21) % c.height);
  }

  ctx.fillStyle = "#47e1ff";
  ctx.beginPath();
  ctx.arc(s.player.x, s.player.y, 12, 0, Math.PI * 2);
  ctx.fill();

  s.allies.forEach((a) => {
    ctx.fillStyle = "#5cff88";
    ctx.fillRect(a.x - 7, a.y - 7, 14, 14);
  });

  s.enemies.forEach((e) => {
    ctx.fillStyle = "#ff5f7f";
    ctx.fillRect(e.x - 8, e.y - 8, 16, 16);
  });

  if (s.boss) {
    ctx.fillStyle = "#ffd166";
    ctx.font = "18px sans-serif";
    ctx.fillText(`Lucky-${s.boss.animation}`, s.boss.x - 40, s.boss.y - 16);
    ctx.beginPath();
    ctx.arc(s.boss.x, s.boss.y, 16, 0, Math.PI * 2);
    ctx.fill();
    if (s.boss.hp <= 0) {
      s.boss.animation = "Die";
      s.boss = null;
    }
  }

  ctx.fillStyle = "#fff";
  s.bullets.forEach((b) => ctx.fillRect(b.x, b.y, 4, 4));

  if (s.player.scoped) {
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath();
    ctx.arc(game.mouseX || s.player.x, game.mouseY || s.player.y, 26, 0, Math.PI * 2);
    ctx.moveTo((game.mouseX || s.player.x) - 30, game.mouseY || s.player.y);
    ctx.lineTo((game.mouseX || s.player.x) + 30, game.mouseY || s.player.y);
    ctx.moveTo(game.mouseX || s.player.x, (game.mouseY || s.player.y) - 30);
    ctx.lineTo(game.mouseX || s.player.x, (game.mouseY || s.player.y) + 30);
    ctx.stroke();
  }

  if (!s.running) {
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.fillRect(200, 180, 500, 160);
    ctx.fillStyle = "#fff";
    ctx.font = "28px sans-serif";
    ctx.fillText(s.outcome ? `Kết quả: ${s.outcome}` : "Nhấn 'Bắt đầu trận' để chơi", 220, 260);
  }
}

function emit(text) {
  $("event-feed").textContent = text;
}

let last = performance.now();
function loop(now = performance.now()) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("mousemove", (e) => {
  const rect = $("battlefield").getBoundingClientRect();
  game.mouseX = ((e.clientX - rect.left) / rect.width) * 900;
  game.mouseY = ((e.clientY - rect.top) / rect.height) * 520;
});

initAuth();
