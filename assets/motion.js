/*
  ანიმაციები: ბურთის კურსორი, მაგნიტური ღილაკები, scroll-ზე გამოჩენა.
  ყველაფერი ითიშება, თუ მომხმარებელს ჩართული აქვს „შემცირებული მოძრაობა“ (სისტემაში ან საიტის ქვედა ზოლში).
  მობილურზე (თითით მართვისას) კურსორი და მაგნიტი არ ირთვება, დანარჩენი უფრო მსუბუქია.
*/
(function () {
  "use strict";

  var KEY = "padel-school-motion";
  var root = document.documentElement;
  var sysReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  function userPref() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function enabled() {
    var p = userPref();
    if (p === "off") return false;
    if (p === "on") return true;
    return !sysReduce.matches;
  }
  function apply() {
    root.classList.toggle("motion", enabled());
    root.classList.toggle("fx-desktop", enabled() && finePointer.matches);
    var b = document.getElementById("motionToggle");
    if (b) b.textContent = enabled() ? "მოძრაობის შემცირება" : "ანიმაციების ჩართვა";
    if (!enabled()) hideCursor();
  }

  // ---------- ბურთის კურსორი ----------
  var cursor = null, cx = -100, cy = -100, tx = -100, ty = -100, raf = 0;
  function ensureCursor() {
    if (cursor) return;
    cursor = document.createElement("div");
    cursor.className = "ball-cursor";
    cursor.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursor);
  }
  function hideCursor() { if (cursor) cursor.style.opacity = "0"; }
  function loop() {
    cx += (tx - cx) * 0.35;
    cy += (ty - cy) * 0.35;
    cursor.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3 ? requestAnimationFrame(loop) : 0;
  }
  document.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse" || !root.classList.contains("fx-desktop")) return;
    ensureCursor();
    tx = e.clientX; ty = e.clientY;
    cursor.style.opacity = "1";
    var hot = e.target.closest && e.target.closest("a, button, .course, label");
    cursor.classList.toggle("hot", !!hot);
    if (!raf) raf = requestAnimationFrame(loop);
    magnet(e);
  }, { passive: true });
  document.addEventListener("pointerdown", function () { if (cursor) cursor.classList.add("down"); });
  document.addEventListener("pointerup", function () { if (cursor) cursor.classList.remove("down"); });
  document.addEventListener("mouseleave", hideCursor);

  // ---------- მაგნიტური ღილაკები ----------
  var magnetEl = null;
  function magnet(e) {
    var btn = e.target.closest && e.target.closest(".btn:not([disabled])");
    if (magnetEl && magnetEl !== btn) { magnetEl.style.transform = ""; magnetEl = null; }
    if (!btn) return;
    var r = btn.getBoundingClientRect();
    var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
    var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    btn.style.transform = "translate(" + (dx * 8).toFixed(1) + "px," + (dy * 6).toFixed(1) + "px)";
    magnetEl = btn;
  }

  // ---------- scroll-ზე გამოჩენა ----------
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;

  // ეკრანზე უკვე ხილული ელემენტები არ იმალება, ასე რომ გვერდი ყოველთვის სრულად ჩანს.
  function scan(scope) {
    var els = (scope || document).querySelectorAll(".reveal");
    var vh = window.innerHeight;
    els.forEach(function (el, i) {
      el.style.setProperty("--d", (i % 6) * 60 + "ms");
      if (!io || !enabled() || el.getBoundingClientRect().top < vh * 0.92) { el.classList.add("in"); return; }
      el.classList.add("pre");
      io.observe(el);
    });
  }

  window.Motion = {
    enabled: enabled,
    afterRender: function (scope) { if (magnetEl) magnetEl = null; scan(scope); },
    toggle: function () {
      try { localStorage.setItem(KEY, enabled() ? "off" : "on"); } catch (e) { /* storage off */ }
      apply();
    }
  };

  sysReduce.addEventListener && sysReduce.addEventListener("change", apply);
  finePointer.addEventListener && finePointer.addEventListener("change", apply);
  document.addEventListener("DOMContentLoaded", apply);
  apply();
})();
