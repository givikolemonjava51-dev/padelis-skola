(function () {
  "use strict";

  var S = window.SCHOOL;
  var app = document.getElementById("app");
  var STORE_KEY = "padel-school-done";
  var SUB_KEY = "padel-school-sub";
  var SUB = S.subscription || { price: 10, currency: "₾", period: "თვეში", paymentUrl: "", demo: false };
  var PRICE = SUB.price + " " + SUB.currency + " " + SUB.period;

  // ---------- პროგრესი (ინახება მხოლოდ ამ ბრაუზერში) ----------
  function loadDone() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  var done = loadDone();
  function saveDone() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(done)); } catch (e) { /* storage off */ }
  }

  // ---------- გამოწერა ----------
  // შენიშვნა: ეს მხოლოდ ინტერფეისია. ნამდვილი შემოწმება უნდა გააკეთოს სერვერმა გადახდის შემდეგ.
  function isSubscribed() {
    try { return localStorage.getItem(SUB_KEY) === "1"; } catch (e) { return false; }
  }
  function setSubscribed(on) {
    try { if (on) localStorage.setItem(SUB_KEY, "1"); else localStorage.removeItem(SUB_KEY); } catch (e) { /* storage off */ }
  }
  function canWatch(l) { return !!l.free || isSubscribed(); }

  // ---------- დამხმარეები ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function allLessons() {
    var out = [];
    S.courses.forEach(function (c) {
      c.lessons.forEach(function (l, i) { out.push({ course: c, lesson: l, index: i }); });
    });
    return out;
  }
  function findLesson(id) {
    var all = allLessons();
    for (var i = 0; i < all.length; i++) if (all[i].lesson.id === id) return all[i];
    return null;
  }
  function findCourse(id) {
    for (var i = 0; i < S.courses.length; i++) if (S.courses[i].id === id) return S.courses[i];
    return null;
  }
  function courseStats(c) {
    var mins = 0, n = 0, videos = 0;
    c.lessons.forEach(function (l) {
      mins += l.minutes || 0;
      if (done[l.id]) n++;
      if (l.video) videos++;
    });
    return { mins: mins, done: n, total: c.lessons.length, videos: videos, pct: Math.round((n / c.lessons.length) * 100) };
  }
  function levelLabel(c) {
    return c.level ? "დონე " + c.level + " · " + c.levelName : c.levelName;
  }
  function lessonWord(n) { return n + " გაკვეთილი"; }

  // ---------- ვიდეო ----------
  function youtubeId(url) {
    var m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }
  function vimeoId(url) {
    var m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? m[1] : null;
  }
  function lockedHtml() {
    return '<div class="player placeholder locked">' + courtSvg("ph-court") +
      '<div class="ph-text"><span class="lock" aria-hidden="true"></span><strong>გაკვეთილი გამოწერით</strong>' +
      
      '<a class="btn primary" href="#subscribe">გამოწერა · ' + esc(PRICE) + "</a></div></div>";
  }

  function videoHtml(lesson) {
    if (!canWatch(lesson)) return lockedHtml();
    var url = (lesson.video || "").trim();
    if (!url) {
      return '<div class="player placeholder" role="img" aria-label="ვიდეო მალე დაემატება">' +
        courtSvg("ph-court") +
        '<div class="ph-text"><span class="ph-dot"></span><strong>ვიდეო მალე დაემატება</strong></div></div>';
    }
    var yt = youtubeId(url), vm = vimeoId(url), embed = null;
    if (yt) embed = "https://www.youtube-nocookie.com/embed/" + yt + "?rel=0";
    else if (vm) embed = "https://player.vimeo.com/video/" + vm;
    var link = '<a class="ext" href="' + esc(url) + '" target="_blank" rel="noopener">ვიდეოს გახსნა ახალ ფანჯარაში ↗</a>';
    if (embed) {
      return '<div class="player"><iframe src="' + esc(embed) + '" title="' + esc(lesson.title) +
        '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>' + link;
    }
    if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url)) {
      return '<div class="player"><video controls preload="metadata" playsinline src="' + esc(url) + '"></video></div>';
    }
    return '<div class="player placeholder"><div class="ph-text"><strong>ვიდეო</strong>' + link + "</div></div>";
  }

  function courtSvg(cls) {
    // კორტი ზემოდან: 20 × 10 მ, მოწოდების ხაზები ბადიდან 6.95 მ-ზე
    return '<svg class="' + cls + '" viewBox="0 0 200 100" aria-hidden="true" preserveAspectRatio="xMidYMid slice">' +
      '<rect x="0" y="0" width="200" height="100" class="c-turf"/>' +
      '<rect x="2" y="2" width="196" height="96" class="c-line" fill="none"/>' +
      '<line x1="100" y1="0" x2="100" y2="100" class="c-net"/>' +
      '<line x1="30.5" y1="2" x2="30.5" y2="98" class="c-line"/>' +
      '<line x1="169.5" y1="2" x2="169.5" y2="98" class="c-line"/>' +
      '<line x1="30.5" y1="50" x2="169.5" y2="50" class="c-line"/>' +
      '<path d="M 18 78 Q 70 -10 150 30" class="c-path" fill="none"/>' +
      '<circle cx="150" cy="30" r="3.2" class="c-ball"/>' +
      "</svg>";
  }

  // ---------- გვერდები ----------
  function viewHome() {
    var all = allLessons();
    var doneN = all.filter(function (x) { return done[x.lesson.id]; }).length;
    var next = all.filter(function (x) { return !done[x.lesson.id]; })[0];

    var html = '<section class="hero wrap">' +
      "<h1>ისწავლე პადელი <em>ონლაინ</em></h1>" +
      '<p class="lead">ვიდეო-გაკვეთილები ქართულად, სრული დამწყებიდან Advanced-მდე. ისწავლე შენი ტემპით, პირველი კურსი უფასოა.</p>' +
      (next ? '<a class="btn primary" href="#l-' + next.lesson.id + '">' + (doneN ? "გაგრძელება" : "დაიწყე უფასოდ") + "</a>" : "") +
      "</section>";

    html += '<section class="wrap" id="courses"><h2>კურსები</h2><ol class="courses">';
    S.courses.forEach(function (c) {
      var st = courseStats(c);
      var allFree = c.lessons.every(function (l) { return l.free; });
      html += '<li><a class="course" href="#c-' + c.id + '">' +
        '<span class="lvl' + (c.level ? "" : " side") + '">' + (c.level ? c.level : "+") + "</span>" +
        '<span class="course-body"><span class="course-level">' + esc(c.levelName) + "</span>" +
        "<strong>" + esc(c.title) + "</strong>" +
        '<span class="course-meta">' + lessonWord(st.total) + (allFree ? ' · <b class="free-word">უფასო</b>' : "") +
        (st.done ? " · გავლილია " + st.pct + "%" : "") + "</span></span></a></li>";
    });
    return html + "</ol></section>";
  }

  function viewCourse(c) {
    var html = '<section class="wrap narrow page-head"><a class="back" href="#courses">← კურსები</a>' +
      '<p class="course-level">' + esc(c.levelName) + "</p><h1>" + esc(c.title) + "</h1>" +
      '<p class="lead">' + esc(c.description) + "</p></section>" +
      '<section class="wrap narrow"><ol class="lesson-list">';
    c.lessons.forEach(function (l, i) {
      var side = done[l.id] ? '<span class="check" aria-label="გავლილია">✓</span>'
        : canWatch(l) ? '<span class="dur">' + (l.minutes || "–") + " წთ</span>"
        : '<span class="mini-lock" aria-label="გამოწერით"></span>';
      html += '<li><a href="#l-' + l.id + '">' +
        '<span class="num">' + (i + 1) + "</span>" +
        '<span class="ll-title">' + esc(l.title) + (l.free && !c.lessons.every(function (x) { return x.free; }) ? ' <b class="free-word">უფასო</b>' : "") + "</span>" +
        side + "</a></li>";
    });
    return html + "</ol></section>";
  }

  function viewLesson(hit) {
    var c = hit.course, l = hit.lesson, i = hit.index;
    var next = c.lessons[i + 1];
    if (!next) {
      var nc = S.courses[S.courses.indexOf(c) + 1];
      if (nc) next = nc.lessons[0];
    }
    var isDone = !!done[l.id];
    var html = '<section class="wrap narrow lesson">' +
      '<a class="back" href="#c-' + c.id + '">← ' + esc(c.title) + "</a>" +
      videoHtml(l) +
      '<p class="course-level">გაკვეთილი ' + (i + 1) + " / " + c.lessons.length + "</p>" +
      "<h1>" + esc(l.title) + "</h1><p class=\"lead\">" + esc(l.summary) + "</p>" +
      '<ul class="points">' + l.points.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul>" +
      '<div class="lesson-actions">' +
      (canWatch(l) ? '<button id="toggleDone" class="btn ' + (isDone ? "ghost" : "primary") + '" type="button">' +
        (isDone ? "✓ გავლილია" : "მონიშნე გავლილად") + "</button>" : "") +
      (next ? '<a class="btn ghost" href="#l-' + next.id + '">შემდეგი →</a>' : "") +
      "</div></section>";
    return html;
  }

  function viewSubscribe() {
    var all = allLessons();
    var sub = isSubscribed();
    var html = '<section class="wrap narrow page-head center"><h1>ყველა კურსი ერთ ფასად</h1>' +
      '<p class="price">' + esc(SUB.price + " " + SUB.currency) + " <small>/ " + esc(SUB.period.replace(/ში$/, "")) + "</small></p>" +
      '<ul class="perks"><li>ყველა ' + all.length + " გაკვეთილი</li><li>ახალი ვიდეოები ყოველთვიურად</li><li>გაუქმება ნებისმიერ დროს</li></ul>";
    if (sub) {
      html += '<p class="sub-on">✓ გამოწერა აქტიურია</p>';
    } else if (SUB.paymentUrl) {
      html += '<a class="btn primary" href="' + esc(SUB.paymentUrl) + '" target="_blank" rel="noopener">გამოწერა</a>' +
        '<p class="fine">გადახდა ხდება ბანკის დაცულ გვერდზე.</p>';
    } else {
      html += '<button class="btn primary" type="button" disabled>გადახდა მალე ჩაირთვება</button>';
    }
    html += '<p class="fine"><a href="#c-intro">პირველი კურსი უფასოა →</a></p></section>';
    if (SUB.demo) {
      html += '<section class="wrap narrow"><div class="demo"><span>სატესტო რეჟიმი (მხოლოდ შენთვის)</span>' +
        '<button id="demoSub" class="linkbtn" type="button">' + (sub ? "გამოწერის გამორთვა" : "გამოწერის ჩართვა") + "</button></div></section>";
    }
    return html;
  }

  function viewGlossary() {
    var html = '<section class="wrap narrow page-head"><h1>ლექსიკონი</h1>' +
      '<p class="lead">ტერმინები, რომლებიც გაკვეთილებში გვხვდება.</p></section><section class="wrap narrow"><dl class="gloss">';
    S.glossary.forEach(function (g) {
      html += "<div><dt>" + esc(g[0]) + (g[0] !== g[1] ? ' <span lang="es">' + esc(g[1]) + "</span>" : "") + "</dt><dd>" + esc(g[2]) + "</dd></div>";
    });
    return html + "</dl></section>";
  }

  // ---------- მარშრუტიზაცია ----------
  function render(keepScroll) {
    var h = location.hash.replace(/^#/, "");
    var html, scrollTo = null;
    if (h.indexOf("l-") === 0 && findLesson(h.slice(2))) {
      var hit = findLesson(h.slice(2));
      html = viewLesson(hit);
      document.title = hit.lesson.title + " · " + S.name;
    } else if (h.indexOf("c-") === 0 && findCourse(h.slice(2))) {
      var c = findCourse(h.slice(2));
      html = viewCourse(c);
      document.title = c.title + " · " + S.name;
    } else if (h === "subscribe") {
      html = viewSubscribe();
      document.title = "გამოწერა · " + S.name;
    } else if (h === "glossary") {
      html = viewGlossary();
      document.title = "ლექსიკონი · " + S.name;
    } else {
      html = viewHome();
      document.title = S.name;
      if (h === "courses") scrollTo = "courses";
    }
    app.innerHTML = html;
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + h || (h.indexOf("c-") === 0 || h.indexOf("l-") === 0) && a.getAttribute("href") === "#courses");
    });
    var ds = document.getElementById("demoSub");
    if (ds) ds.addEventListener("click", function () { setSubscribed(!isSubscribed()); render(true); });
    var t = document.getElementById("toggleDone");
    if (t) t.addEventListener("click", function () {
      var id = h.slice(2);
      if (done[id]) delete done[id]; else done[id] = Date.now();
      saveDone();
      render(true);
    });
    if (scrollTo) document.getElementById(scrollTo).scrollIntoView();
    else if (keepScroll !== true) window.scrollTo(0, 0);
  }

  document.getElementById("brandName").textContent = S.name;
  document.getElementById("footName").textContent = S.name;
  document.getElementById("footTag").textContent = S.contact ? "კონტაქტი: " + S.contact : "";
  window.addEventListener("hashchange", function () { render(); });
  render();
})();
