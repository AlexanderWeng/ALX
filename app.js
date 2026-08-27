/* =========================================================
   ALX-PLAN — app.js
   Vanilla JS, no build step.
   Local-first (localStorage). Optional cloud sync via Supabase
   using a short join-code so a phone + a PC can share one
   Mind Plan (see the "เชื่อมต่ออุปกรณ์" panel).

   Developed by Alexander_Weng
========================================================= */
(() => {
  "use strict";

  const STORE_KEY = "alxplan_v1";
  const SYNC_CFG_KEY = "alxplan_sync_cfg";
  // Default Supabase project, pre-filled so you don't have to type the
  // URL/anon key on every device. Still overridable per-device inside
  // Settings → Join Plan. Remember: the anon key ends up readable in the
  // deployed site's source (that's normal for Supabase's anon key design —
  // real protection is the RLS policies on the `mindplans` table), so only
  // point this at a Supabase project you're fine having publicly reachable
  // by anyone who finds your 6-digit join code.
  const DEFAULT_SUPABASE_URL = "https://wnrhnxfnckvsxeejtyct.supabase.co";
  const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducmhueGZuY2t2c3hlZWp0eWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MDg0OTYsImV4cCI6MjEwMzM4NDQ5Nn0.CIb_-o6UL4_UuCxGYZdtHRvOV6id84RHqa8VKU_LlO8";
  const uid = () => Math.random().toString(36).slice(2, 9);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------------------------------------------------------
     Icon set (inline SVG, theme-aware via currentColor)
     — replaces the old default-OS emoji so nodes always match
     the app's look, on every device/font.
  --------------------------------------------------------- */
  const ICONS = {
    idea:      `<path d="M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.4c.6.6 1 1.4 1 2.3V16h6v-1.3c0-.9.4-1.7 1-2.3A6 6 0 0 0 12 2Z"/>`,
    goal:      `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none"/>`,
    milestone: `<path d="M6 3v18"/><path d="M6 4h11l-3 4 3 4H6Z"/>`,
    action:    `<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>`,
    star:      `<path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.8 5.9 21l1.3-6.8-5-4.7 6.8-.8L12 2.5Z"/>`,
    rocket:    `<path d="M5 15.5c-1 1-1.2 3.7-1.2 4.7 1 0 3.7-.2 4.7-1.2l6.2-6.2c2-2 3-6.2 3-8.3 0 0-4.3 1-8.3 3l-4.4 8Z"/><circle cx="14.5" cy="9.5" r="1.5"/>`,
    check:     `<path d="M4 12.5l5 5L20 6"/>`,
    clock:     `<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5l3.6 2"/>`,
    heart:     `<path d="M12 20.2s-7.2-4.4-9.7-9C.6 7.7 2.4 4 6.2 3.6c2.2-.3 3.9.9 4.8 2.3.9-1.4 2.6-2.6 4.8-2.3 3.8.4 5.6 4.1 3.9 7.6-2.5 4.6-9.7 9-9.7 9Z"/>`,
    note:      `<rect x="4.2" y="3" width="15.6" height="18" rx="2.2"/><path d="M8 8h8M8 12h8M8 16h5"/>`,
    fire:      `<path d="M12 22c4.2 0 7.4-2.8 7.4-6.9 0-3.1-2.1-5.2-3.1-7.3.3 2.1-1 3.1-1.8 2.1.6-2.9-.7-6.2-3.4-7.7.3 2.4-.6 4.2-2.1 5.6C6.7 9.5 5 11.9 5 15.4 5 19.6 8 22 12 22Z"/>`,
    warning:   `<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10.2v4"/><circle cx="12" cy="16.8" r="0.8" fill="currentColor" stroke="none"/>`
  };
  const ICON_LABEL = {
    idea: "ไอเดีย", goal: "เป้าหมาย", milestone: "ขั้นตอน", action: "ลงมือทำ",
    star: "เด่น", rocket: "เปิดตัว", check: "เสร็จสิ้น", clock: "กำหนดเวลา",
    heart: "ชื่นชอบ", note: "บันทึกย่อ", fire: "เร่งด่วน", warning: "ต้องระวัง"
  };
  const ICON_ORDER = ["idea","goal","milestone","action","star","rocket","check","clock","heart","note","fire","warning"];
  function iconMarkup(key) { return `<svg viewBox="0 0 24 24" class="ico">${ICONS[key] || ICONS.idea}</svg>`; }

  /* ---------------------------------------------------------
     Color helpers — full RGB/HEX picking + auto 5-shade families
  --------------------------------------------------------- */
  const PALETTE = ["#00C2D9", "#6C5CE7", "#FF4FA0", "#1FB874", "#FFA53E"];
  function randomColor() { return PALETTE[Math.floor(Math.random() * PALETTE.length)]; }

  function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
    if (!m) return { r: 0, g: 194, b: 217 };
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return { h, s, l };
  }
  function hslToHex(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }
  // 5 perceptually-related shades of one base color (light -> dark)
  function shadesOf(hex, n = 5) {
    const { r, g, b } = hexToRgb(hex);
    const { h, s } = rgbToHsl(r, g, b);
    const lights = [0.82, 0.66, 0.5, 0.36, 0.24];
    return lights.slice(0, n).map(l => hslToHex(h, Math.max(s, 0.35), l));
  }

  /* ---------------------------------------------------------
     State + persistence
  --------------------------------------------------------- */
  function defaultPlan(name = "แผนงานของฉัน", color = "#00C2D9") {
    const rootId = uid();
    return {
      id: uid(),
      name,
      color,
      createdAt: Date.now(),
      selectedNodeId: rootId,
      camera: null, // centered on first render via fitView() — see renderMindmap()
      migratedV2: true,
      nodes: [
        { id: rootId, parentId: null, text: name, x: 0, y: 0, color, icon: "idea", isRoot: true, progress: null, active: false, due: null }
      ]
    };
  }

  function freshState() {
    const plan = defaultPlan();
    return { plans: [plan], activePlanId: plan.id, tasks: [], settings: { favColors: [] } };
  }

  function migrateNode(n) {
    if (!n.icon) n.icon = ICON_ORDER.includes(n.type) ? n.type : "idea";
    if (n.progress === undefined) n.progress = null;
    if (n.active === undefined) n.active = false;
    if (n.due === undefined) n.due = null;
    return n;
  }

  /* ---------------------------------------------------------
     Due-date helpers — used by the node badge + node modal
  --------------------------------------------------------- */
  function dueDayDiff(dueStr) {
    if (!dueStr) return null;
    const due = new Date(dueStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((due - today) / 86400000);
  }
  function formatDueShort(dueStr) {
    try {
      const d = new Date(dueStr + "T00:00:00");
      return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    } catch (e) { return dueStr; }
  }
  function dueBadgeInfo(dueStr) {
    const diff = dueDayDiff(dueStr);
    if (diff === null) return null;
    let cls = "is-upcoming", label = "กำหนดส่ง";
    if (diff < 0) { cls = "is-overdue"; label = "เลยกำหนด " + Math.abs(diff) + " วัน"; }
    else if (diff === 0) { cls = "is-due-today"; label = "กำหนดส่งวันนี้"; }
    else if (diff <= 3) { cls = "is-due-soon"; label = "อีก " + diff + " วัน"; }
    else { label = "กำหนดส่ง " + formatDueShort(dueStr); }
    return { cls, label, text: formatDueShort(dueStr) };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return freshState();
      const parsed = JSON.parse(raw);
      if (!parsed.settings) parsed.settings = { favColors: [] };
      if (!parsed.settings.favColors) parsed.settings.favColors = [];

      let plans;
      if (parsed.plans && parsed.plans.length) {
        plans = parsed.plans;
        if (!parsed.tasks) parsed.tasks = [];
      } else if (parsed.nodes && parsed.nodes.length) {
        // legacy single-plan format
        const plan = defaultPlan("แผนงานของฉัน", "#00C2D9");
        plan.nodes = parsed.nodes;
        plan.selectedNodeId = parsed.selectedNodeId || plan.nodes[0].id;
        plans = [plan];
        parsed.tasks = (parsed.tasks || []).map(t => ({ ...t, planId: plan.id, nodeId: t.nodeId || null }));
      } else {
        return freshState();
      }

      plans.forEach(p => {
        if (!p.nodes || !p.nodes.length) p.nodes = defaultPlan(p.name, p.color).nodes;
        p.nodes.forEach(migrateNode);
        if (!p.selectedNodeId) p.selectedNodeId = (p.nodes.find(n => n.isRoot) || p.nodes[0]).id;

        // One-time migration from the old normalized 0..1 layout (or any
        // plan that has never run the new deterministic layout) into the
        // new infinite world canvas. This also fixes any tangled/overlapping
        // positions inherited from the old random layout. Must run BEFORE
        // fitView() below, otherwise the camera gets centered on the old
        // (soon to be discarded) positions instead of the final ones.
        if (!p.migratedV2) {
          layoutRadial(p);
          p.migratedV2 = true;
        }

        if (!p.camera) fitView(p); // never leave a plan un-centered (was the cause of the root node rendering cut off in the corner)
      });

      if (!parsed.activePlanId || !plans.some(p => p.id === parsed.activePlanId)) {
        parsed.activePlanId = plans[0].id;
      }
      return { plans, activePlanId: parsed.activePlanId, tasks: parsed.tasks || [], settings: parsed.settings };
    } catch (e) {
      return freshState();
    }
  }

  let state = loadState();

  function getPlan(id) { return state.plans.find(p => p.id === id) || state.plans[0]; }
  function currentPlan() { return getPlan(state.activePlanId); }

  let pushTimer = null;
  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    pulseSyncPill();
    if (syncCfg.code) {
      clearTimeout(pushTimer);
      pushTimer = setTimeout(pushToCloud, 900);
    }
  }

  function pulseSyncPill() {
    const pill = document.getElementById("syncPill");
    if (!pill) return;
    pill.classList.add("is-pulsing");
    clearTimeout(pulseSyncPill._t);
    pulseSyncPill._t = setTimeout(() => pill.classList.remove("is-pulsing"), 900);
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("is-visible"), 2200);
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str == null ? "" : str;
    return d.innerHTML;
  }

  /* Walk a node's subtree (including itself) and tally linked tasks */
  function subtreeTaskStats(node, nodes) {
    const ids = new Set([node.id]);
    let grew = true;
    while (grew) {
      grew = false;
      nodes.forEach(n2 => {
        if (n2.parentId && ids.has(n2.parentId) && !ids.has(n2.id)) { ids.add(n2.id); grew = true; }
      });
    }
    let total = 0, done = 0;
    ids.forEach(id => {
      const n = nodes.find(x => x.id === id);
      if (n && n.taskId) {
        const t = state.tasks.find(x => x.id === n.taskId);
        if (t) { total++; if (t.status === "done") done++; }
      }
    });
    return { total, done };
  }

  /* ---------------------------------------------------------
     DETERMINISTIC RADIAL AUTO-LAYOUT
     Replaces the old "random angle" arrange, which was the root
     cause of the reported bug: random placement could stack a
     child almost exactly on top of its parent (or a cousin
     branch), collapsing its connector line to ~0px so it looked
     like the link had vanished. This version gives every branch
     a proportional angular slice (by leaf count) so siblings can
     never overlap, and it's the same result every time you press
     the button.
  --------------------------------------------------------- */
  function layoutRadial(plan) {
    const nodes = plan.nodes;
    const root = nodes.find(n => n.isRoot);
    if (!root) return;

    const byParent = new Map();
    nodes.forEach(n => {
      if (!n.parentId) return;
      if (!byParent.has(n.parentId)) byParent.set(n.parentId, []);
      byParent.get(n.parentId).push(n);
    });

    // Defensive: if the data ever contains a cycle (e.g. corrupted/old
    // localStorage, or a manual JSON edit), plain recursion here would
    // recurse forever and throw "Maximum call stack size exceeded" —
    // aborting layoutRadial() BEFORE fitView()/render() run, which looked
    // to users like "pressing arrange made the lines vanish" (the canvas
    // just silently never re-rendered). Both recursive helpers below now
    // carry a visited-set guard so a stray cycle can never do that again;
    // worst case a cyclic node is simply skipped instead of crashing.
    const leafCache = new Map();
    function leafCount(n, seen) {
      if (leafCache.has(n.id)) return leafCache.get(n.id);
      seen = seen || new Set();
      if (seen.has(n.id)) return 1; // cycle guard
      seen = new Set(seen); seen.add(n.id);
      const kids = byParent.get(n.id) || [];
      const val = kids.length ? kids.reduce((s, k) => s + leafCount(k, seen), 0) : 1;
      leafCache.set(n.id, val);
      return val;
    }

    const LEVEL_GAP = 235;
    root.x = 0; root.y = 0;

    function place(n, angleStart, angleEnd, depth, seen) {
      seen = seen || new Set([n.id]);
      const kids = byParent.get(n.id) || [];
      if (!kids.length || depth > 200) return; // depth cap = extra cycle guard
      const span = angleEnd - angleStart;
      const total = kids.reduce((s, k) => s + leafCount(k), 0) || 1;
      let cursor = angleStart;
      const radius = LEVEL_GAP * (depth + 1);
      kids.forEach(k => {
        if (seen.has(k.id)) return; // cycle guard — never re-place an ancestor
        const weight = leafCount(k) / total;
        const kSpan = span * weight;
        const angle = cursor + kSpan / 2;
        k.x = Math.cos(angle) * radius;
        k.y = Math.sin(angle) * radius;
        const kSeen = new Set(seen); kSeen.add(k.id);
        place(k, cursor, cursor + kSpan, depth + 1, kSeen);
        cursor += kSpan;
      });
    }
    place(root, 0, Math.PI * 2, 0);
  }

  function fitView(plan) {
    const nodes = plan.nodes;
    const { w: cw, h: ch } = canvasSize();
    if (!cw || !ch) return;
    if (nodes.length <= 1) {
      plan.camera = { x: cw / 2, y: ch / 2, zoom: 1 };
      return;
    }
    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = Math.max(maxX - minX, 1), h = Math.max(maxY - minY, 1);
    const pad = 110;
    let zoom = Math.min((cw - pad * 2) / w, (ch - pad * 2) / h, 1.3);
    zoom = clamp(zoom, 0.22, 1.3);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    plan.camera = { zoom, x: cw / 2 - cx * zoom, y: ch / 2 - cy * zoom };
  }

  /* ---------------------------------------------------------
     View switching (Mind Plan / Task Board)
  --------------------------------------------------------- */
  function switchView(view) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("is-active"));
    document.getElementById(`view-${view}`).classList.add("is-active");

    document.querySelectorAll(".hud-tab").forEach(t => {
      const active = t.dataset.view === view;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll(".mtab").forEach(t => t.classList.toggle("is-active", t.dataset.view === view));

    if (view === "mindplan") renderMindmap();
    if (view === "board") renderBoard();
  }

  document.querySelectorAll(".hud-tab, .mtab").forEach(btn => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  function renderAll() {
    renderPlanBar();
    renderTaskPlanFilterOptions();
    renderMindmap();
    renderBoard();
  }

  /* ---------------------------------------------------------
     Reusable color-picker widget (used by node modal + plan modal)
  --------------------------------------------------------- */
  function wireColorPicker(prefix, getInitial) {
    const swatchWrap = document.getElementById(`${prefix}Swatches`);
    const favWrap = document.getElementById(`${prefix}FavRow`);
    const shadeWrap = document.getElementById(`${prefix}ShadeRow`);
    const customInput = document.getElementById(`${prefix}ColorCustom`);
    const addFavBtn = document.getElementById(`${prefix}AddFavBtn`);
    let current = getInitial();

    function markSelected(color) {
      current = color;
      document.querySelectorAll(`#${prefix}Swatches .swatch, #${prefix}FavRow .swatch, #${prefix}ShadeRow .swatch`)
        .forEach(s => s.classList.toggle("is-selected", (s.dataset.color || "").toLowerCase() === color.toLowerCase()));
      customInput.value = color;
    }

    function renderFav() {
      favWrap.innerHTML = "";
      (state.settings.favColors || []).forEach(hex => {
        const s = document.createElement("button");
        s.type = "button"; s.className = "swatch swatch-fav"; s.style.setProperty("--c", hex);
        s.dataset.color = hex; s.title = hex;
        s.addEventListener("click", () => { markSelected(hex); renderShades(hex); });
        favWrap.appendChild(s);
      });
    }
    function renderShades(baseHex) {
      shadeWrap.innerHTML = "";
      shadesOf(baseHex, 5).forEach(hex => {
        const s = document.createElement("button");
        s.type = "button"; s.className = "swatch swatch-shade"; s.style.setProperty("--c", hex);
        s.dataset.color = hex; s.title = hex;
        s.addEventListener("click", () => markSelected(hex));
        shadeWrap.appendChild(s);
      });
    }

    swatchWrap.querySelectorAll(".swatch").forEach(s => {
      s.onclick = () => { markSelected(s.dataset.color); shadeWrap.innerHTML = ""; };
    });
    customInput.oninput = () => { markSelected(customInput.value); shadeWrap.innerHTML = ""; };
    addFavBtn.onclick = () => {
      const hex = current.toUpperCase();
      const favs = state.settings.favColors;
      if (!favs.includes(hex)) {
        favs.unshift(hex);
        if (favs.length > 8) favs.length = 8;
        save();
        renderFav();
        toast("เพิ่มสีโปรดแล้ว");
      }
    };

    renderFav();
    markSelected(current);
    return { get: () => current, set: (c) => { markSelected(c); shadeWrap.innerHTML = ""; }, refreshFav: renderFav };
  }

  /* ---------------------------------------------------------
     PLAN BAR — switch / create / edit / delete Mind Plans
  --------------------------------------------------------- */
  function renderPlanBar() {
    const bar = document.getElementById("planBar");
    bar.innerHTML = "";
    state.plans.forEach(p => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "plan-pill" + (p.id === state.activePlanId ? " is-active" : "");
      pill.style.setProperty("--pc", p.color || "#00C2D9");
      pill.innerHTML = `
        <span class="plan-dot"></span>
        <span class="plan-name">${escapeHtml(p.name)}</span>
        <svg class="plan-edit" viewBox="0 0 24 24" title="แก้ไขแผน"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
      `;
      pill.addEventListener("click", (e) => {
        if (e.target.closest(".plan-edit")) { openPlanModal(p.id); return; }
        if (state.activePlanId !== p.id) {
          state.activePlanId = p.id;
          save();
          renderPlanBar();
          renderMindmap();
        }
      });
      bar.appendChild(pill);
    });

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "plan-add-btn";
    addBtn.title = "เพิ่มแผนใหม่";
    addBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`;
    addBtn.addEventListener("click", () => openPlanModal(null));
    bar.appendChild(addBtn);
  }

  const planModal = document.getElementById("planModalOverlay");
  let editingPlanId = null;
  let planColorPicker = null;

  function openPlanModal(id) {
    editingPlanId = id;
    const isNew = !id;
    const p = id ? getPlan(id) : { name: "", color: randomColor() };

    document.getElementById("planModalTitle").textContent = isNew ? "แผนใหม่" : "แก้ไขแผน";
    document.getElementById("planName").value = p.name;
    document.getElementById("planDeleteBtn").style.visibility = (!isNew && state.plans.length > 1) ? "visible" : "hidden";
    planColorPicker = wireColorPicker("plan", () => p.color || "#00C2D9");

    planModal.classList.add("is-open");
    document.getElementById("planName").focus();
  }
  function closePlanModal() { planModal.classList.remove("is-open"); editingPlanId = null; }

  document.getElementById("planModalClose").addEventListener("click", closePlanModal);
  planModal.addEventListener("click", (e) => { if (e.target === planModal) closePlanModal(); });

  document.getElementById("planSaveBtn").addEventListener("click", () => {
    const name = document.getElementById("planName").value.trim();
    if (!name) { toast("กรุณาใส่ชื่อแผน"); return; }
    const color = planColorPicker ? planColorPicker.get() : "#00C2D9";

    if (editingPlanId) {
      const p = getPlan(editingPlanId);
      p.name = name; p.color = color;
      toast("บันทึกแผนแล้ว");
    } else {
      const newPlan = defaultPlan(name, color);
      state.plans.push(newPlan);
      state.activePlanId = newPlan.id;
      toast("สร้างแผนใหม่แล้ว");
    }
    save();
    renderPlanBar();
    renderMindmap();
    renderTaskPlanFilterOptions();
    closePlanModal();
  });

  document.getElementById("planDeleteBtn").addEventListener("click", () => {
    if (!editingPlanId || state.plans.length <= 1) return;
    const wasActive = state.activePlanId === editingPlanId;
    state.tasks = state.tasks.filter(t => t.planId !== editingPlanId);
    state.plans = state.plans.filter(p => p.id !== editingPlanId);
    if (wasActive) state.activePlanId = state.plans[0].id;
    save();
    renderPlanBar();
    renderMindmap();
    renderBoard();
    renderTaskPlanFilterOptions();
    closePlanModal();
    toast("ลบแผนแล้ว");
  });

  /* ---------------------------------------------------------
     MIND PLAN — infinite pan/zoom constellation canvas
  --------------------------------------------------------- */
  const canvas = document.getElementById("mindmapCanvas");
  const svg = document.getElementById("mindmapSvg");
  const mmWorld = document.getElementById("mmWorld");
  const nodesLayer = document.getElementById("mindmapNodes");
  const dotfield = document.getElementById("mmDotfield");

  function ensureSvgDefs() {
    svg.innerHTML = `
      <defs>
        <linearGradient id="linkGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#00C2D9"/>
          <stop offset="100%" stop-color="#6C5CE7"/>
        </linearGradient>
      </defs>`;
  }

  function canvasSize() {
    const r = canvas.getBoundingClientRect();
    return { w: r.width, h: r.height };
  }

  function applyCamera(plan) {
    const cam = plan.camera || { x: 0, y: 0, zoom: 1 };
    mmWorld.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom})`;
    updateZoomLabel(cam.zoom);
  }

  function updateZoomLabel(zoom) {
    const el = document.getElementById("zoomLabel");
    if (el) el.textContent = Math.round(zoom * 100) + "%";
  }

  // Position a node using transform only (compositor-only, no layout reflow)
  function placeNode(el, node) {
    el.style.transform = `translate(${node.x}px, ${node.y}px) translate(-50%, -50%)`;
  }

  // Update just the SVG lines touching this node (as child and/or as parent)
  function updateConnectedLines(node) {
    const nodes = currentPlan().nodes;
    if (node.parentId) {
      const asChild = svg.querySelector(`line[data-child="${node.id}"]`);
      if (asChild) { asChild.setAttribute("x2", node.x); asChild.setAttribute("y2", node.y); }
    }
    svg.querySelectorAll(`line[data-parent="${node.id}"]`).forEach(line => {
      line.setAttribute("x1", node.x);
      line.setAttribute("y1", node.y);
    });
  }

  // Interactive dot-field: brighten dots around the pointer (compositor-only)
  let dotRaf = null, pendingMx = -9999, pendingMy = -9999;
  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    pendingMx = e.clientX - rect.left;
    pendingMy = e.clientY - rect.top;
    if (dotRaf == null) {
      dotRaf = requestAnimationFrame(() => {
        dotfield.style.setProperty("--mx", pendingMx + "px");
        dotfield.style.setProperty("--my", pendingMy + "px");
        dotRaf = null;
      });
    }
  });
  canvas.addEventListener("pointerleave", () => {
    dotfield.style.setProperty("--mx", "-9999px");
    dotfield.style.setProperty("--my", "-9999px");
  });

  function renderMindmap() {
    ensureSvgDefs();
    nodesLayer.innerHTML = "";
    const plan = currentPlan();
    const nodes = plan.nodes;
    if (!plan.camera) fitView(plan);
    applyCamera(plan);

    // clear stale task links (task was deleted elsewhere)
    nodes.forEach(n => {
      if (n.taskId && !state.tasks.some(t => t.id === n.taskId)) n.taskId = null;
    });

    // links — plain, non-interactive lines (pointer-events:none via CSS) so
    // hovering/tapping near a line can never accidentally cut it anymore.
    // Connecting/disconnecting branches is now done from the small colored
    // connector dot on each node itself (see attachConnectorDrag below).
    nodes.forEach(n => {
      if (!n.parentId) return;
      const parent = nodes.find(p => p.id === n.parentId);
      if (!parent) return;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", parent.x);
      line.setAttribute("y1", parent.y);
      line.setAttribute("x2", n.x);
      line.setAttribute("y2", n.y);
      line.setAttribute("class", "mm-link");
      line.dataset.parent = parent.id;
      line.dataset.child = n.id;
      svg.appendChild(line);
    });

    // nodes
    nodes.forEach(n => {
      const el = document.createElement("div");
      const hasChildren = nodes.some(c => c.parentId === n.id);
      const linkedTask = n.taskId ? state.tasks.find(t => t.id === n.taskId) : null;
      const stats = subtreeTaskStats(n, nodes);
      const iconKey = n.icon || "idea";

      el.className = "mm-node" + (n.isRoot ? " is-root" : "") + (plan.selectedNodeId === n.id ? " is-selected" : "") + (n.active ? " is-active-node" : "");
      placeNode(el, n);
      el.style.setProperty("--nc", n.color || "#00C2D9");
      el.dataset.id = n.id;

      let badgesHtml = "";
      if (!n.isRoot) badgesHtml += `<span class="mm-type-badge" title="${ICON_LABEL[iconKey] || ""}">${iconMarkup(iconKey)}</span>`;
      if (linkedTask) badgesHtml += `<span class="mm-status-badge status-${linkedTask.status}" title="สถานะ: ${STATUS_LABEL[linkedTask.status]}"></span>`;
      if (n.active) badgesHtml += `<span class="mm-active-badge" title="กำลังดำเนินการอยู่"></span>`;

      const dueInfo = dueBadgeInfo(n.due);
      const dueHtml = dueInfo
        ? `<span class="mm-due-badge ${dueInfo.cls}" title="${dueInfo.label}"><svg viewBox="0 0 24 24" class="ico"><rect x="3.5" y="5" width="17" height="15" rx="2.4"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>${dueInfo.text}</span>`
        : "";

      let progressHtml = "";
      if (n.progress != null) {
        progressHtml = `<div class="mm-progress" title="ความคืบหน้า ${n.progress}%"><div class="mm-progress-bar" style="width:${n.progress}%"></div></div>`;
      } else if (hasChildren && stats.total > 0) {
        const pct = Math.round((stats.done / stats.total) * 100);
        progressHtml = `<div class="mm-progress" title="${stats.done}/${stats.total} งานเสร็จ"><div class="mm-progress-bar" style="width:${pct}%"></div></div>`;
      }

      el.innerHTML = badgesHtml + `<span class="mm-node-text">${escapeHtml(n.text || "ไม่มีชื่อ")}</span>` + dueHtml + progressHtml;

      // Connector dot — every non-root node can be dragged FROM this dot
      // onto another node to (re)connect the branch, or onto empty canvas
      // to disconnect it. Always present (so it's discoverable), brighter
      // on hover/selection so it never reads as "missing".
      if (!n.isRoot) {
        const dot = document.createElement("div");
        dot.className = "mm-connector";
        dot.title = "ลาก = ต่อกับโหนดอื่น · ปล่อยที่ว่าง = ตัดการเชื่อม";
        el.appendChild(dot);
        attachConnectorDrag(dot, n);
      }

      nodesLayer.appendChild(el);
      attachNodeDrag(el, n);
    });

    renderPlanProgress(plan, nodes);
  }

  function renderPlanProgress(plan, nodes) {
    const el = document.getElementById("planProgress");
    if (!el) return;
    const root = nodes.find(n => n.isRoot);
    const stats = root ? subtreeTaskStats(root, nodes) : { total: 0, done: 0 };
    if (!stats.total) {
      el.textContent = `แผน "${plan.name}" — ยังไม่มีงานที่ส่งไป Task Board`;
    } else {
      const pct = Math.round((stats.done / stats.total) * 100);
      el.innerHTML = `แผน "${escapeHtml(plan.name)}" คืบหน้า <b>${stats.done}/${stats.total}</b> งาน (${pct}%)`;
    }
  }

  // Drag nodes with pointer events (works for mouse + touch).
  // Screen-pixel deltas are divided by the current zoom so dragging
  // still feels 1:1 with the cursor at any zoom level.
  function attachNodeDrag(el, node) {
    let dragging = false;
    let moved = false;
    let startX, startY, startNodeX, startNodeY;
    let rafId = null;
    let pendingX, pendingY;

    el.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      dragging = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      startNodeX = node.x;
      startNodeY = node.y;
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      if (!moved) return;

      const zoom = (currentPlan().camera || { zoom: 1 }).zoom || 1;
      pendingX = startNodeX + dx / zoom;
      pendingY = startNodeY + dy / zoom;

      if (rafId == null) {
        rafId = requestAnimationFrame(() => {
          node.x = pendingX; node.y = pendingY;
          placeNode(el, node);
          updateConnectedLines(node);
          rafId = null;
        });
      }
    });

    el.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      el.releasePointerCapture(e.pointerId);
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
        node.x = pendingX; node.y = pendingY;
        placeNode(el, node);
        updateConnectedLines(node);
      }
      if (moved) {
        save(); // DOM already reflects the new position, just persist it
      } else {
        // tap = select as parent, or open edit if already selected
        const plan = currentPlan();
        if (plan.selectedNodeId === node.id) {
          openNodeModal(node.id);
        } else {
          plan.selectedNodeId = node.id;
          save();
          renderMindmap();
        }
      }
    });
  }

  // Drag a node's own connector dot to either:
  //  - drop it on a different node  -> connect this node under that node
  //  - drop it on empty canvas      -> cut the current connection (node
  //                                     becomes free-floating, draggable
  //                                     onto something else later)
  // Starting the drag from the node's own dot (instead of a thin midpoint
  // handle sitting on top of the line) makes it much harder to mis-tap and
  // accidentally sever a branch, and gives an obvious, always-visible
  // target for making a *new* connection.
  let connectorPreviewLine = null;
  function attachConnectorDrag(dotEl, node) {
    let dragging = false;

    dotEl.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      dragging = true;
      dotEl.setPointerCapture(e.pointerId);
      dotEl.classList.add("is-dragging");

      connectorPreviewLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      connectorPreviewLine.setAttribute("class", "mm-link mm-link-preview");
      connectorPreviewLine.setAttribute("x1", node.x);
      connectorPreviewLine.setAttribute("y1", node.y);
      connectorPreviewLine.setAttribute("x2", node.x);
      connectorPreviewLine.setAttribute("y2", node.y);
      svg.appendChild(connectorPreviewLine);
    });

    dotEl.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const plan = currentPlan();
      const cam = plan.camera;
      const rect = canvas.getBoundingClientRect();
      const wx = (e.clientX - rect.left - cam.x) / cam.zoom;
      const wy = (e.clientY - rect.top - cam.y) / cam.zoom;

      if (connectorPreviewLine) { connectorPreviewLine.setAttribute("x2", wx); connectorPreviewLine.setAttribute("y2", wy); }

      document.querySelectorAll(".mm-node.is-drop-target").forEach(el => el.classList.remove("is-drop-target"));
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const nodeEl = under && under.closest(".mm-node");
      if (nodeEl && nodeEl.dataset.id !== node.id) nodeEl.classList.add("is-drop-target");
    });

    function finishDrag(e) {
      if (!dragging) return;
      dragging = false;
      dotEl.releasePointerCapture(e.pointerId);
      dotEl.classList.remove("is-dragging");
      document.querySelectorAll(".mm-node.is-drop-target").forEach(el => el.classList.remove("is-drop-target"));
      if (connectorPreviewLine) { connectorPreviewLine.remove(); connectorPreviewLine = null; }

      const plan = currentPlan();
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const nodeEl = under && under.closest(".mm-node");
      const targetId = nodeEl ? nodeEl.dataset.id : null;

      if (!targetId) {
        // dropped on empty space -> cut the connection (if it had one)
        if (node.parentId) {
          node.parentId = null;
          save();
          renderMindmap();
          toast("ตัดการเชื่อมต่อแล้ว — ลากจุดนี้ไปต่อโหนดอื่นได้ทุกเมื่อ");
        }
        return;
      }
      if (targetId === node.id || targetId === node.parentId) {
        return; // dropped on itself or the node it's already connected to — no-op
      }

      // prevent cycles: target can't be this node or one of its own descendants
      const descendants = new Set([node.id]);
      let grew = true;
      while (grew) {
        grew = false;
        plan.nodes.forEach(nd => {
          if (nd.parentId && descendants.has(nd.parentId) && !descendants.has(nd.id)) { descendants.add(nd.id); grew = true; }
        });
      }
      if (descendants.has(targetId)) {
        toast("เชื่อมต่อไม่ได้: จะทำให้เกิดวงวน (loop)");
        return;
      }

      node.parentId = targetId;
      save();
      renderMindmap();
      toast("เชื่อมต่อโหนดแล้ว");
    }
    dotEl.addEventListener("pointerup", finishDrag);
    dotEl.addEventListener("pointercancel", finishDrag);
  }

  document.getElementById("btnAddNode").addEventListener("click", () => {
    const plan = currentPlan();
    const parent = plan.nodes.find(n => n.id === plan.selectedNodeId) || plan.nodes[0];
    const angle = Math.random() * Math.PI * 2;
    const dist = 190;
    const newNode = {
      id: uid(),
      parentId: parent.id,
      text: "ความคิดใหม่",
      x: parent.x + Math.cos(angle) * dist,
      y: parent.y + Math.sin(angle) * dist,
      color: randomColor(),
      icon: "idea",
      progress: null,
      active: false,
      due: null
    };
    plan.nodes.push(newNode);
    plan.selectedNodeId = newNode.id;
    save();
    renderMindmap();
    centerOnNode(plan, newNode);
    openNodeModal(newNode.id);
  });

  function centerOnNode(plan, node) {
    const { w, h } = canvasSize();
    if (!w || !h) return;
    const zoom = (plan.camera || { zoom: 1 }).zoom || 1;
    plan.camera.x = w / 2 - node.x * zoom;
    plan.camera.y = h / 2 - node.y * zoom;
    applyCamera(plan);
  }

  document.getElementById("btnArrange").addEventListener("click", () => {
    const plan = currentPlan();
    layoutRadial(plan);
    fitView(plan);
    save();
    renderMindmap();
    toast("จัดเรียงผังใหม่แล้ว (ไม่ทับกัน เส้นครบทุกกิ่ง)");
  });

  document.getElementById("btnZoomIn").addEventListener("click", () => zoomBy(1.22));
  document.getElementById("btnZoomOut").addEventListener("click", () => zoomBy(1 / 1.22));
  document.getElementById("btnZoomReset").addEventListener("click", () => {
    const plan = currentPlan();
    plan.camera.zoom = 1;
    applyCamera(plan);
    save();
  });
  document.getElementById("btnFitView").addEventListener("click", () => {
    const plan = currentPlan();
    fitView(plan);
    applyCamera(plan);
    save();
  });

  function zoomBy(factor) {
    const plan = currentPlan();
    const { w, h } = canvasSize();
    const cam = plan.camera;
    const worldX = (w / 2 - cam.x) / cam.zoom, worldY = (h / 2 - cam.y) / cam.zoom;
    cam.zoom = clamp(cam.zoom * factor, 0.2, 2.6);
    cam.x = w / 2 - worldX * cam.zoom;
    cam.y = h / 2 - worldY * cam.zoom;
    applyCamera(plan);
    save();
  }

  // ---- Pan (drag empty canvas) + wheel zoom + pinch zoom ----
  const activePointers = new Map();
  let panState = null;
  let pinchState = null;

  canvas.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".mm-node") || e.target.closest(".mm-link-handle")) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    const plan = currentPlan();
    if (activePointers.size === 1) {
      panState = { startX: e.clientX, startY: e.clientY, camX: plan.camera.x, camY: plan.camera.y };
      canvas.classList.add("is-panning");
    } else if (activePointers.size === 2) {
      panState = null;
      const pts = [...activePointers.values()];
      pinchState = {
        startDist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        startZoom: plan.camera.zoom,
        midX: (pts[0].x + pts[1].x) / 2, midY: (pts[0].y + pts[1].y) / 2,
        camX: plan.camera.x, camY: plan.camera.y
      };
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const plan = currentPlan();
    const rect = canvas.getBoundingClientRect();

    if (activePointers.size === 1 && panState) {
      plan.camera.x = panState.camX + (e.clientX - panState.startX);
      plan.camera.y = panState.camY + (e.clientY - panState.startY);
      applyCamera(plan);
    } else if (activePointers.size === 2 && pinchState) {
      const pts = [...activePointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const scaleFactor = dist / (pinchState.startDist || 1);
      const newZoom = clamp(pinchState.startZoom * scaleFactor, 0.2, 2.6);
      const midX = pinchState.midX - rect.left, midY = pinchState.midY - rect.top;
      const worldX = (midX - pinchState.camX) / pinchState.startZoom;
      const worldY = (midY - pinchState.camY) / pinchState.startZoom;
      plan.camera.zoom = newZoom;
      plan.camera.x = midX - worldX * newZoom;
      plan.camera.y = midY - worldY * newZoom;
      applyCamera(plan);
    }
  });

  function endCanvasPointer(e) {
    activePointers.delete(e.pointerId);
    if (activePointers.size < 2) pinchState = null;
    if (activePointers.size < 1) {
      canvas.classList.remove("is-panning");
      panState = null;
      save();
    }
  }
  canvas.addEventListener("pointerup", endCanvasPointer);
  canvas.addEventListener("pointercancel", endCanvasPointer);

  let wheelSaveTimer = null;
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const plan = currentPlan();
    const cam = plan.camera;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const worldX = (mx - cam.x) / cam.zoom, worldY = (my - cam.y) / cam.zoom;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    cam.zoom = clamp(cam.zoom * factor, 0.2, 2.6);
    cam.x = mx - worldX * cam.zoom;
    cam.y = my - worldY * cam.zoom;
    applyCamera(plan);
    clearTimeout(wheelSaveTimer);
    wheelSaveTimer = setTimeout(save, 400);
  }, { passive: false });

  window.addEventListener("resize", () => {
    if (document.getElementById("view-mindplan").classList.contains("is-active")) applyCamera(currentPlan());
  });

  /* ---- Node modal ---- */
  const nodeModal = document.getElementById("nodeModalOverlay");
  let editingNodeId = null;
  let nodeColorPicker = null;
  let selectedIcon = "idea";

  function renderIconPicker(activeKey) {
    const wrap = document.getElementById("nodeIconPicker");
    wrap.innerHTML = "";
    ICON_ORDER.forEach(key => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "type-btn" + (key === activeKey ? " is-selected" : "");
      b.dataset.icon = key;
      b.title = ICON_LABEL[key];
      b.innerHTML = iconMarkup(key) + `<span>${ICON_LABEL[key]}</span>`;
      b.addEventListener("click", () => {
        selectedIcon = key;
        wrap.querySelectorAll(".type-btn").forEach(x => x.classList.remove("is-selected"));
        b.classList.add("is-selected");
      });
      wrap.appendChild(b);
    });
  }

  function openNodeModal(id) {
    editingNodeId = id;
    const plan = currentPlan();
    const n = plan.nodes.find(x => x.id === id);
    document.getElementById("nodeText").value = n.text;
    nodeColorPicker = wireColorPicker("node", () => n.color || "#00C2D9");
    selectedIcon = n.icon || "idea";
    renderIconPicker(selectedIcon);

    const manualToggle = document.getElementById("nodeProgressManualToggle");
    const range = document.getElementById("nodeProgressRange");
    const rangeVal = document.getElementById("nodeProgressValue");
    manualToggle.checked = n.progress != null;
    range.value = n.progress != null ? n.progress : 50;
    rangeVal.textContent = range.value + "%";
    range.disabled = !manualToggle.checked;

    document.getElementById("nodeActiveToggle").checked = !!n.active;
    document.getElementById("nodeDueInput").value = n.due || "";

    document.getElementById("nodeDeleteBtn").style.visibility = n.isRoot ? "hidden" : "visible";
    document.getElementById("nodeModalTitle").textContent = n.isRoot ? "โหนดศูนย์กลาง" : "โหนดความคิด";
    renderNodeLinkInfo(n);
    nodeModal.classList.add("is-open");
    document.getElementById("nodeText").focus();
  }
  function closeNodeModal() { nodeModal.classList.remove("is-open"); editingNodeId = null; }

  document.getElementById("nodeProgressManualToggle").addEventListener("change", (e) => {
    document.getElementById("nodeProgressRange").disabled = !e.target.checked;
  });
  document.getElementById("nodeProgressRange").addEventListener("input", (e) => {
    document.getElementById("nodeProgressValue").textContent = e.target.value + "%";
  });

  function renderNodeLinkInfo(n) {
    const box = document.getElementById("nodeLinkInfo");
    const btn = document.getElementById("nodeToTaskBtn");
    const task = n.taskId ? state.tasks.find(t => t.id === n.taskId) : null;

    if (task) {
      box.classList.remove("is-empty");
      box.innerHTML = `
        <span class="nli-status"><span class="nli-dot status-${task.status}"></span>เชื่อมกับงาน: ${escapeHtml(task.title)} · ${STATUS_LABEL[task.status]}</span>
        <button type="button" class="nli-unlink" id="nliUnlinkBtn">ยกเลิกการเชื่อม</button>
      `;
      document.getElementById("nliUnlinkBtn").addEventListener("click", () => {
        n.taskId = null;
        save();
        renderNodeLinkInfo(n);
        renderMindmap();
        toast("ยกเลิกการเชื่อมกับงานแล้ว");
      });
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg> ไปที่งานนี้`;
    } else {
      box.classList.add("is-empty");
      box.innerHTML = "";
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg> ส่งไป Task Board`;
    }
  }

  document.getElementById("nodeModalClose").addEventListener("click", closeNodeModal);
  nodeModal.addEventListener("click", (e) => { if (e.target === nodeModal) closeNodeModal(); });

  document.getElementById("nodeSaveBtn").addEventListener("click", () => {
    const plan = currentPlan();
    const n = plan.nodes.find(x => x.id === editingNodeId);
    if (!n) return closeNodeModal();
    n.text = document.getElementById("nodeText").value.trim() || n.text;
    if (nodeColorPicker) n.color = nodeColorPicker.get();
    n.icon = selectedIcon;
    const manual = document.getElementById("nodeProgressManualToggle").checked;
    n.progress = manual ? parseInt(document.getElementById("nodeProgressRange").value, 10) : null;
    n.active = document.getElementById("nodeActiveToggle").checked;
    n.due = document.getElementById("nodeDueInput").value || null;
    save();
    renderMindmap();
    closeNodeModal();
    toast("บันทึกโหนดแล้ว");
  });

  document.getElementById("nodeDeleteBtn").addEventListener("click", () => {
    if (!editingNodeId) return;
    const plan = currentPlan();
    const n = plan.nodes.find(x => x.id === editingNodeId);
    if (n && n.isRoot) return;

    // remove node + all descendants
    const toRemove = new Set([editingNodeId]);
    let grew = true;
    while (grew) {
      grew = false;
      plan.nodes.forEach(n2 => {
        if (n2.parentId && toRemove.has(n2.parentId) && !toRemove.has(n2.id)) {
          toRemove.add(n2.id); grew = true;
        }
      });
    }
    state.tasks = state.tasks.filter(t => !(t.nodeId && toRemove.has(t.nodeId)));
    plan.nodes = plan.nodes.filter(n2 => !toRemove.has(n2.id));
    plan.selectedNodeId = (plan.nodes.find(x => x.isRoot) || plan.nodes[0]).id;
    save();
    renderMindmap();
    renderBoard();
    closeNodeModal();
    toast("ลบโหนดแล้ว (และงานที่เชื่อมโยง)");
  });

  document.getElementById("nodeToTaskBtn").addEventListener("click", () => {
    const plan = currentPlan();
    const n = plan.nodes.find(x => x.id === editingNodeId);
    if (!n) return;

    const existingTask = n.taskId ? state.tasks.find(t => t.id === n.taskId) : null;
    if (existingTask) {
      closeNodeModal();
      switchView("board");
      openTaskModal(existingTask.id);
      return;
    }

    const task = createTask({ title: n.text, status: "task", priority: "mid", notes: "", due: "", planId: plan.id, nodeId: n.id });
    n.taskId = task.id;
    save();
    closeNodeModal();
    renderMindmap();
    toast("ส่งไปยัง Task Board แล้ว");
    switchView("board");
  });

  /* ---------------------------------------------------------
     TASK BOARD
  --------------------------------------------------------- */
  const STATUSES = ["task", "doing", "done"];
  const STATUS_LABEL = { task: "Task", doing: "Doing", done: "Done" };
  let boardFilterPlanId = "all";

  function createTask({ title, status = "task", priority = "mid", notes = "", due = "", planId = null, nodeId = null }) {
    const t = { id: uid(), title, status, priority, notes, due, planId, nodeId, createdAt: Date.now() };
    state.tasks.push(t);
    save();
    renderBoard();
    return t;
  }

  function visibleTasks() {
    if (boardFilterPlanId === "all") return state.tasks;
    return state.tasks.filter(t => t.planId === boardFilterPlanId);
  }

  function renderTaskPlanFilterOptions() {
    const sel = document.getElementById("taskPlanFilter");
    if (!sel) return;
    const prev = boardFilterPlanId;
    sel.innerHTML = `<option value="all">ทุกแผน</option>` +
      state.plans.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
    sel.value = state.plans.some(p => p.id === prev) ? prev : "all";
    boardFilterPlanId = sel.value;
  }

  document.getElementById("taskPlanFilter").addEventListener("change", (e) => {
    boardFilterPlanId = e.target.value;
    renderBoard();
  });

  function renderBoard() {
    const tasksForBoard = visibleTasks();
    STATUSES.forEach(status => {
      const body = document.getElementById(`col-${status}`);
      const items = tasksForBoard.filter(t => t.status === status).sort((a, b) => b.createdAt - a.createdAt);
      document.getElementById(`count-${status}`).textContent = items.length;
      body.innerHTML = "";

      if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "column-empty";
        empty.textContent = status === "task" ? "ยังไม่มีงาน — กด “เพิ่มงานใหม่”" : "ลากการ์ดมาวางที่นี่";
        body.appendChild(empty);
      }

      items.forEach(t => body.appendChild(renderCard(t)));

      body.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!body.classList.contains("is-dragover")) body.classList.add("is-dragover");
      };
      body.ondragleave = (e) => {
        if (!body.contains(e.relatedTarget)) body.classList.remove("is-dragover");
      };
      body.ondrop = (e) => {
        e.preventDefault();
        body.classList.remove("is-dragover");
        const id = e.dataTransfer.getData("text/plain");
        moveTask(id, status);
      };
    });
    renderBoardProgress();
  }

  function renderBoardProgress() {
    const el = document.getElementById("boardProgress");
    if (!el) return;
    const tasks = visibleTasks();
    const total = tasks.length;
    if (!total) { el.textContent = "ยังไม่มีงานในบอร์ดนี้"; return; }
    const done = tasks.filter(t => t.status === "done").length;
    const pct = Math.round((done / total) * 100);
    el.innerHTML = `เสร็จแล้ว <b>${done}/${total}</b> งาน (${pct}%)`;
  }

  function renderCard(t) {
    const card = document.createElement("div");
    card.className = "task-card";
    card.draggable = true;
    card.dataset.id = t.id;

    const idx = STATUSES.indexOf(t.status);
    const dueLabel = t.due ? formatDate(t.due) : "";
    const plan = t.planId ? state.plans.find(p => p.id === t.planId) : null;
    const planTagHtml = plan
      ? `<span class="plan-tag" style="--pc:${plan.color}"><span class="plan-tag-dot"></span>${escapeHtml(plan.name)}</span>`
      : "";

    card.innerHTML = `
      <div class="task-card-top">
        ${planTagHtml}
        <span class="priority-chip priority-${t.priority}">${priorityLabel(t.priority)}</span>
        ${dueLabel ? `<span class="task-due">${dueLabel}</span>` : ""}
      </div>
      <div class="task-title">${escapeHtml(t.title)}</div>
      ${t.notes ? `<div class="task-notes">${escapeHtml(t.notes)}</div>` : ""}
      <div class="task-card-actions">
        <button class="move-btn" data-dir="-1" ${idx === 0 ? "disabled" : ""} title="ย้ายไปคอลัมน์ก่อนหน้า">
          <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <button class="move-btn" data-dir="1" ${idx === STATUSES.length - 1 ? "disabled" : ""} title="ย้ายไปคอลัมน์ถัดไป">
          <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
        <button class="move-btn breakdown-btn" title="แตกเป็นขั้นตอนย่อยใน Mind Plan">
          <svg viewBox="0 0 24 24"><path d="M4 12h5M13 5h7M13 12h7M13 19h7"/><path d="M9 12l4-7M9 12l4 7"/></svg>
        </button>
      </div>
    `;

    card.addEventListener("dragstart", (e) => {
      card.classList.add("is-dragging");
      e.dataTransfer.setData("text/plain", t.id);
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => card.classList.remove("is-dragging"));

    card.addEventListener("click", (e) => {
      if (e.target.closest(".move-btn")) return;
      openTaskModal(t.id);
    });

    card.querySelectorAll(".move-btn:not(.breakdown-btn)").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const dir = parseInt(btn.dataset.dir, 10);
        const newIdx = STATUSES.indexOf(t.status) + dir;
        if (newIdx < 0 || newIdx >= STATUSES.length) return;
        moveTask(t.id, STATUSES[newIdx]);
      });
    });

    card.querySelector(".breakdown-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openBreakdownModal(t.id);
    });

    return card;
  }

  function moveTask(id, status) {
    const t = state.tasks.find(x => x.id === id);
    if (!t || t.status === status) return;
    t.status = status;
    save();
    renderBoard();
    if (document.getElementById("view-mindplan").classList.contains("is-active")) renderMindmap();
    toast(`ย้ายไปยัง ${STATUS_LABEL[status]} แล้ว`);
  }

  function priorityLabel(p) { return { low: "ต่ำ", mid: "ปานกลาง", high: "สูง" }[p] || p; }
  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  }

  /* ---- Task modal ---- */
  const taskModal = document.getElementById("taskModalOverlay");
  let editingTaskId = null;

  function openTaskModal(id) {
    editingTaskId = id;
    const isNew = !id;
    const t = id ? state.tasks.find(x => x.id === id) : { title: "", notes: "", priority: "mid", due: "", status: "task", planId: currentPlan().id };

    document.getElementById("taskModalTitle").textContent = isNew ? "งานใหม่" : "แก้ไขงาน";
    document.getElementById("taskTitle").value = t.title;
    document.getElementById("taskNotes").value = t.notes || "";
    document.getElementById("taskPriority").value = t.priority;
    document.getElementById("taskDue").value = t.due || "";
    document.getElementById("taskDeleteBtn").style.visibility = isNew ? "hidden" : "visible";
    document.getElementById("taskBreakdownBtn").style.visibility = isNew ? "hidden" : "visible";

    const planSel = document.getElementById("taskPlanSelect");
    planSel.innerHTML = state.plans.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
    planSel.value = state.plans.some(p => p.id === t.planId) ? t.planId : currentPlan().id;
    // A task linked to a Mind Plan node stays pinned to that node's plan —
    // changing it here would orphan the node link, so lock the field.
    planSel.disabled = !!t.nodeId;

    document.querySelectorAll("#taskStatusSeg .seg-btn").forEach(b => {
      b.classList.toggle("is-active", b.dataset.status === t.status);
    });

    taskModal.classList.add("is-open");
    document.getElementById("taskTitle").focus();
  }
  function closeTaskModal() { taskModal.classList.remove("is-open"); editingTaskId = null; }

  document.getElementById("btnAddTask").addEventListener("click", () => openTaskModal(null));
  document.getElementById("taskModalClose").addEventListener("click", closeTaskModal);
  taskModal.addEventListener("click", (e) => { if (e.target === taskModal) closeTaskModal(); });
  document.getElementById("taskBreakdownBtn").addEventListener("click", () => {
    if (!editingTaskId) return;
    const id = editingTaskId;
    closeTaskModal();
    openBreakdownModal(id);
  });

  document.querySelectorAll("#taskStatusSeg .seg-btn").forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll("#taskStatusSeg .seg-btn").forEach(x => x.classList.remove("is-active"));
      b.classList.add("is-active");
    });
  });

  document.getElementById("taskSaveBtn").addEventListener("click", () => {
    const title = document.getElementById("taskTitle").value.trim();
    if (!title) { toast("กรุณาใส่ชื่องาน"); return; }
    const notes = document.getElementById("taskNotes").value.trim();
    const priority = document.getElementById("taskPriority").value;
    const due = document.getElementById("taskDue").value;
    const status = document.querySelector("#taskStatusSeg .seg-btn.is-active").dataset.status;
    const planSel = document.getElementById("taskPlanSelect");
    const planId = planSel.disabled ? undefined : planSel.value;

    if (editingTaskId) {
      const t = state.tasks.find(x => x.id === editingTaskId);
      Object.assign(t, { title, notes, priority, due, status }, planId !== undefined ? { planId } : {});
      toast("บันทึกงานแล้ว");
    } else {
      createTask({ title, notes, priority, due, status, planId: planId || currentPlan().id });
      toast("เพิ่มงานใหม่แล้ว");
    }
    save();
    renderBoard();
    if (document.getElementById("view-mindplan").classList.contains("is-active")) renderMindmap();
    closeTaskModal();
  });

  document.getElementById("taskDeleteBtn").addEventListener("click", () => {
    if (!editingTaskId) return;
    state.plans.forEach(p => {
      p.nodes.forEach(n => { if (n.taskId === editingTaskId) n.taskId = null; });
    });
    state.tasks = state.tasks.filter(t => t.id !== editingTaskId);
    save();
    renderBoard();
    renderMindmap();
    closeTaskModal();
    toast("ลบงานแล้ว");
  });

  /* ---------------------------------------------------------
     TASK → MIND PLAN — "breakdown": take a task that turned out
     to be bigger than expected and analyze it into an ordered
     chain of sub-step nodes (1 -> 2 -> 3 -> ...) hanging off the
     node this task is linked to. If the task has no node yet
     (it was created directly on the board), one is created for it
     first. Ends by jumping to Mind Plan with that branch in view.
  --------------------------------------------------------- */
  const breakdownModal = document.getElementById("breakdownModalOverlay");
  let breakdownTaskId = null;

  function openBreakdownModal(taskId) {
    const t = state.tasks.find(x => x.id === taskId);
    if (!t) return;
    breakdownTaskId = taskId;
    document.getElementById("breakdownTaskLabel").innerHTML = `งาน: <b>${escapeHtml(t.title)}</b>`;
    document.getElementById("breakdownSteps").value = "";
    breakdownModal.classList.add("is-open");
    document.getElementById("breakdownSteps").focus();
  }
  function closeBreakdownModal() { breakdownModal.classList.remove("is-open"); breakdownTaskId = null; }

  document.getElementById("breakdownModalClose").addEventListener("click", closeBreakdownModal);
  document.getElementById("breakdownCancelBtn").addEventListener("click", closeBreakdownModal);
  breakdownModal.addEventListener("click", (e) => { if (e.target === breakdownModal) closeBreakdownModal(); });

  document.getElementById("breakdownConfirmBtn").addEventListener("click", () => {
    const t = state.tasks.find(x => x.id === breakdownTaskId);
    if (!t) return closeBreakdownModal();

    const lines = document.getElementById("breakdownSteps").value
      .split("\n").map(s => s.trim()).filter(Boolean);
    if (!lines.length) { toast("พิมพ์อย่างน้อย 1 ขั้นตอนก่อน"); return; }

    const plan = getPlan(t.planId) || currentPlan();

    // Find (or create) the node this task is linked to.
    let anchor = t.nodeId ? plan.nodes.find(n => n.id === t.nodeId) : null;
    if (!anchor) {
      const root = plan.nodes.find(n => n.isRoot) || plan.nodes[0];
      const angle = Math.random() * Math.PI * 2;
      anchor = {
        id: uid(), parentId: root.id, text: t.title,
        x: root.x + Math.cos(angle) * 190, y: root.y + Math.sin(angle) * 190,
        color: randomColor(), icon: "action", progress: null, active: false, due: null,
        taskId: t.id
      };
      plan.nodes.push(anchor);
      t.nodeId = anchor.id;
    }

    // Chain the steps straight off the anchor node: anchor -> 1 -> 2 -> 3 ...
    let parent = anchor;
    const angle = Math.atan2(parent.y - (plan.nodes.find(n => n.id === parent.parentId)?.y ?? parent.y - 1),
                              parent.x - (plan.nodes.find(n => n.id === parent.parentId)?.x ?? parent.x)) || 0;
    const STEP_DIST = 175;
    let lastNode = anchor;
    lines.forEach((text, i) => {
      const node = {
        id: uid(), parentId: parent.id, text,
        x: parent.x + Math.cos(angle) * STEP_DIST,
        y: parent.y + Math.sin(angle) * STEP_DIST,
        color: anchor.color || randomColor(), icon: "check", progress: null, active: i === 0, due: null
      };
      plan.nodes.push(node);
      parent = node;
      lastNode = node;
    });

    state.activePlanId = plan.id;
    layoutRadial(plan);
    save();
    closeBreakdownModal();
    switchView("mindplan");
    plan.selectedNodeId = anchor.id;
    renderMindmap();
    fitView(plan);
    applyCamera(plan);
    renderPlanBar();
    toast(`แตกงานเป็น ${lines.length} ขั้นตอนใน Mind Plan แล้ว`);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeNodeModal(); closeTaskModal(); closePlanModal(); closeSyncModal(); closeSettingsModal(); closeBreakdownModal(); }
  });

  /* ---------------------------------------------------------
     CLOUD SYNC — join a Mind Plan with a short code (Supabase)
     Fully optional: everything above already works 100% offline
     with localStorage. This layer only activates once the user
     fills in their own Supabase URL + anon key.
  --------------------------------------------------------- */
  function loadSyncCfg() {
    let cfg;
    try { cfg = JSON.parse(localStorage.getItem(SYNC_CFG_KEY)) || {}; }
    catch (e) { cfg = {}; }
    if (!cfg.url) cfg.url = DEFAULT_SUPABASE_URL;
    if (!cfg.key) cfg.key = DEFAULT_SUPABASE_KEY;
    return cfg;
  }
  function saveSyncCfg() { localStorage.setItem(SYNC_CFG_KEY, JSON.stringify(syncCfg)); }
  let syncCfg = loadSyncCfg();
  let supabaseClient = null;
  let realtimeChannel = null;

  function genCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = ""; for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function ensureSupabaseLib() {
    if (window.supabase) return Promise.resolve(window.supabase);
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
      s.onload = () => resolve(window.supabase);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function connectSupabase() {
    if (!syncCfg.url || !syncCfg.key) return null;
    if (supabaseClient) return supabaseClient;
    try {
      const sb = await ensureSupabaseLib();
      supabaseClient = sb.createClient(syncCfg.url, syncCfg.key);
      return supabaseClient;
    } catch (e) {
      console.warn("Supabase library failed to load", e);
      return null;
    }
  }

  async function pushToCloud() {
    if (!syncCfg.code) return;
    const client = await connectSupabase();
    if (!client) return;
    try {
      await client.from("mindplans").upsert({ code: syncCfg.code, data: state, updated_at: new Date().toISOString() });
    } catch (e) { console.warn("sync push failed", e); }
  }

  async function createCloudPlan() {
    const client = await connectSupabase();
    if (!client) { toast("กรุณาใส่ Supabase URL และ anon key ก่อน"); return; }
    const code = genCode();
    const { error } = await client.from("mindplans").insert({ code, data: state });
    if (error) { toast("สร้างรหัสไม่สำเร็จ: " + error.message); return; }
    syncCfg.code = code; saveSyncCfg();
    subscribeRealtime();
    renderSyncModal();
    toast("สร้างรหัสเชื่อมต่อแล้ว: " + code);
  }

  async function joinCloudPlan(code) {
    code = (code || "").trim().toUpperCase();
    if (!code) { toast("กรุณาใส่รหัส"); return; }
    const client = await connectSupabase();
    if (!client) { toast("กรุณาใส่ Supabase URL และ anon key ก่อน"); return; }
    const { data, error } = await client.from("mindplans").select("*").eq("code", code).maybeSingle();
    if (error || !data) { toast("ไม่พบรหัสนี้"); return; }
    state = data.data;
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    syncCfg.code = code; saveSyncCfg();
    subscribeRealtime();
    renderAll();
    renderSyncModal();
    toast("เข้าร่วมแผน " + code + " แล้ว");
  }

  function subscribeRealtime() {
    if (!supabaseClient || !syncCfg.code) return;
    if (realtimeChannel) { supabaseClient.removeChannel(realtimeChannel); realtimeChannel = null; }
    realtimeChannel = supabaseClient
      .channel("mp-" + syncCfg.code)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "mindplans", filter: `code=eq.${syncCfg.code}` }, (payload) => {
        if (payload.new && payload.new.data) {
          state = payload.new.data;
          localStorage.setItem(STORE_KEY, JSON.stringify(state));
          renderAll();
          toast("ซิงค์ข้อมูลจากอุปกรณ์อื่นแล้ว");
        }
      })
      .subscribe();
  }

  function disconnectCloud() {
    if (realtimeChannel && supabaseClient) { supabaseClient.removeChannel(realtimeChannel); realtimeChannel = null; }
    syncCfg.code = null; saveSyncCfg();
    renderSyncModal();
    toast("ยกเลิกการเชื่อมต่อแล้ว ใช้งานออฟไลน์ในเครื่องนี้");
  }

  const syncModal = document.getElementById("syncModalOverlay");
  function openSyncModal() { renderSyncModal(); syncModal.classList.add("is-open"); }
  function closeSyncModal() { syncModal.classList.remove("is-open"); }
  document.getElementById("btnOpenSync").addEventListener("click", openSyncModal);
  document.getElementById("syncModalClose").addEventListener("click", closeSyncModal);
  syncModal.addEventListener("click", (e) => { if (e.target === syncModal) closeSyncModal(); });

  // ---- Settings modal (menu) — "Join Plan" lives inside it ----
  const settingsModal = document.getElementById("settingsModalOverlay");
  function openSettingsModal() { renderSyncModal(); settingsModal.classList.add("is-open"); }
  function closeSettingsModal() { settingsModal.classList.remove("is-open"); }
  document.getElementById("btnOpenSettings").addEventListener("click", openSettingsModal);
  document.getElementById("settingsModalClose").addEventListener("click", closeSettingsModal);
  settingsModal.addEventListener("click", (e) => { if (e.target === settingsModal) closeSettingsModal(); });
  document.getElementById("settingsJoinPlanItem").addEventListener("click", () => {
    closeSettingsModal();
    openSyncModal();
  });
  document.getElementById("syncModalBack").addEventListener("click", () => {
    closeSyncModal();
    openSettingsModal();
  });

  function renderSyncModal() {
    document.getElementById("syncUrlInput").value = syncCfg.url || "";
    document.getElementById("syncKeyInput").value = syncCfg.key || "";
    const statusEl = document.getElementById("syncStatusText");
    const pill = document.getElementById("syncPill");
    const menuSub = document.getElementById("settingsJoinPlanSub");
    if (syncCfg.code) {
      statusEl.innerHTML = `กำลังเชื่อมต่อแผนรหัส <b>${escapeHtml(syncCfg.code)}</b> — อุปกรณ์อื่นที่ใส่รหัสเดียวกันจะเห็นข้อมูลนี้แบบเรียลไทม์`;
      document.getElementById("syncCodeDisplay").textContent = syncCfg.code;
      document.getElementById("syncCodeBox").style.display = "flex";
      document.getElementById("syncDisconnectBtn").style.display = "inline-flex";
      pill.querySelector("span").textContent = "ซิงค์: " + syncCfg.code;
      pill.classList.add("is-cloud");
      if (menuSub) menuSub.textContent = "เชื่อมต่ออยู่ — รหัส " + syncCfg.code;
    } else {
      statusEl.textContent = "ยังไม่ได้เชื่อมต่อ — ข้อมูลบันทึกอยู่ในเครื่องนี้เท่านั้น (ออฟไลน์)";
      document.getElementById("syncCodeBox").style.display = "none";
      document.getElementById("syncDisconnectBtn").style.display = "none";
      pill.querySelector("span").textContent = "บันทึกในเครื่องอัตโนมัติ";
      pill.classList.remove("is-cloud");
      if (menuSub) menuSub.textContent = "ยังไม่ได้เชื่อมต่อ — ออฟไลน์";
    }
  }

  document.getElementById("syncSaveConfigBtn").addEventListener("click", () => {
    syncCfg.url = document.getElementById("syncUrlInput").value.trim();
    syncCfg.key = document.getElementById("syncKeyInput").value.trim();
    saveSyncCfg();
    supabaseClient = null;
    toast("บันทึกการตั้งค่า Supabase แล้ว");
  });
  document.getElementById("syncGenerateBtn").addEventListener("click", createCloudPlan);
  document.getElementById("syncJoinBtn").addEventListener("click", () => joinCloudPlan(document.getElementById("syncJoinInput").value));
  document.getElementById("syncDisconnectBtn").addEventListener("click", disconnectCloud);
  document.getElementById("syncCopyBtn").addEventListener("click", () => {
    const code = syncCfg.code || "";
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => toast("คัดลอกรหัสแล้ว")).catch(() => {});
  });

  async function initSync() {
    renderSyncModal();
    if (!syncCfg.url || !syncCfg.key || !syncCfg.code) return;
    const client = await connectSupabase();
    if (!client) return;
    try {
      const { data } = await client.from("mindplans").select("*").eq("code", syncCfg.code).maybeSingle();
      if (data && data.data) { state = data.data; renderAll(); }
      subscribeRealtime();
      renderSyncModal();
    } catch (e) { console.warn("initial sync pull failed", e); }
  }

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */
  renderAll();
  initSync();
})();
