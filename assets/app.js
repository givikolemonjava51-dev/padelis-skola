(function () {
  "use strict";

  var S = window.SCHOOL;
  var app = document.getElementById("app");
  var STORE_KEY = "padel-school-done";
  var SUB_KEY = "padel-school-sub";
  var CH_KEY = "padel-school-challenge";
  var JOURNAL_KEY = "padel-school-journal";
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
  function loadJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch (e) { return fallback; }
  }
  function saveJson(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage off */ }
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
  function findTier(id) {
    return (S.tiers || []).filter(function (t) { return t.id === id; })[0] || null;
  }
  function tierOfCourse(c) {
    return (S.tiers || []).filter(function (t) { return t.courses.indexOf(c.id) >= 0; })[0] || null;
  }
  function findModule(id) {
    return (S.modules || []).filter(function (m) { return m.id === id; })[0] || null;
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
        '<div class="ph-text"><span class="play"></span><span class="soon">ვიდეო მალე დაემატება</span></div></div>';
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
  // კორტის ნაწილები ინტერაქტიული სექციისთვის (კოორდინატები 200 × 100 კორტზე, ბადე შუაშია)
  var COURT_SPOTS = [
    { id: "net", x: 100, y: 50, name: "ბადე", text: "ბადე კორტს ორ 10 × 10 მეტრიან ნაწილად ყოფს. სიმაღლე ცენტრში 88 სმ-ია, კიდეებთან 92 სმ.", lesson: "i02" },
    { id: "serve", x: 65.25, y: 25, name: "მოწოდების ხაზი", text: "ბადიდან 6,95 მეტრზეა. მოწოდება სრულდება ამ ხაზის უკნიდან, წელის ქვემოთ და დიაგონალზე.", lesson: "b03" },
    { id: "center", x: 135, y: 50, name: "ცენტრალური ხაზი", text: "მოწოდების ზონას მარჯვენა და მარცხენა ნაწილებად ყოფს. მოწოდება ყოველთვის მეტოქის დიაგონალურ ზონაში უნდა მოხვდეს.", lesson: "i09" },
    { id: "back", x: 192, y: 72, name: "უკანა მინა", text: "3 მეტრი სიმაღლის შუშის კედელი. ბურთი შეგიძლია დააბრუნო მას შემდეგ, რაც მიწაზე დაეცემა და მინიდან აისხლიტება.", lesson: "b08" },
    { id: "side", x: 40, y: 95, name: "გვერდითი კედელი", text: "ნაწილი შუშაა, ნაწილი ლითონის ბადე. შუშიდან ბურთი თანაბრად აისხლიტება, ლითონის ბადიდან კი არაპროგნოზირებადად.", lesson: "w01" }
  ];

  function dash() { return '<div class="dash" aria-hidden="true"></div>'; }

  function courtExplorer() {
    var html = '<section class="band band-light" id="court"><div class="wrap explore reveal">' + dash() +
      '<p class="eyebrow">ნაბიჯი 3 · ინტერაქტიული</p><h2>გაიცანი კორტი</h2>' +
      '<p class="lead">დააჭირე კორტის მონიშნულ ნაწილს და გაიგე, რას ნიშნავს.</p>' +
      '<div class="explore-court"><svg viewBox="-6 -6 212 112" aria-hidden="true">' +
      '<rect x="0" y="0" width="200" height="100" rx="2" class="c-turf"/>' +
      '<rect x="0" y="0" width="200" height="100" rx="2" class="c-glass"/>' +
      '<rect x="2" y="2" width="196" height="96" class="c-line draw" pathLength="1" fill="none"/>' +
      '<line x1="30.5" y1="2" x2="30.5" y2="98" class="c-line draw" pathLength="1"/><line x1="169.5" y1="2" x2="169.5" y2="98" class="c-line draw" pathLength="1"/>' +
      '<line x1="30.5" y1="50" x2="169.5" y2="50" class="c-line draw" pathLength="1"/>' +
      '<line x1="100" y1="-3" x2="100" y2="103" class="c-net hl" data-part="net"/>' +
      '<line x1="30.5" y1="2" x2="30.5" y2="98" class="hl" data-part="serve"/><line x1="169.5" y1="2" x2="169.5" y2="98" class="hl" data-part="serve"/>' +
      '<line x1="30.5" y1="50" x2="169.5" y2="50" class="hl" data-part="center"/>' +
      '<line x1="200" y1="0" x2="200" y2="100" class="hl" data-part="back"/><line x1="0" y1="0" x2="0" y2="100" class="hl" data-part="back"/>' +
      '<line x1="0" y1="100" x2="200" y2="100" class="hl" data-part="side"/><line x1="0" y1="0" x2="200" y2="0" class="hl" data-part="side"/>' +
      "</svg>";
    COURT_SPOTS.forEach(function (p) {
      html += '<button class="spot" type="button" data-spot="' + p.id + '" style="left:' + ((p.x + 6) / 212 * 100) + "%;top:" + ((p.y + 6) / 112 * 100) + '%" aria-label="' + esc(p.name) + '"><span>+</span></button>';
    });
    html += '</div><div class="chips" role="tablist">';
    COURT_SPOTS.forEach(function (p) {
      html += '<button class="chip" type="button" role="tab" data-spot="' + p.id + '">' + esc(p.name) + "</button>";
    });
    return html + '</div><div class="spot-info" id="spotInfo" aria-live="polite"></div>' +
      (findModule("positioning") ? '<a class="mod-cta" href="#m-positioning">მოდული: პოზიციონირება →</a>' : "") + "</div></section>";
  }

  function selectSpot(id) {
    var p = COURT_SPOTS.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    document.querySelectorAll("[data-spot]").forEach(function (el) {
      var on = el.getAttribute("data-spot") === id;
      el.classList.toggle("on", on);
      if (el.classList.contains("chip")) el.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".explore-court .hl").forEach(function (el) {
      el.classList.toggle("on", el.getAttribute("data-part") === id);
    });
    var hit = findLesson(p.lesson);
    var box = document.getElementById("spotInfo");
    box.classList.remove("swap"); void box.offsetWidth; box.classList.add("swap");
    box.innerHTML = "<strong>" + esc(p.name) + "</strong><p>" + esc(p.text) + "</p>" +
      (hit ? '<a href="#l-' + hit.lesson.id + '">გაკვეთილი: ' + esc(hit.lesson.title) + " →</a>" : "");
  }

  // ბარათების ილუსტრაციები (160 × 70). თეთრი ხაზები, ყვითელი ბურთი.
  var ART = {
    intro: '<g class="a-line"><ellipse cx="62" cy="30" rx="15" ry="18"/><path d="M62 48 L62 62"/><circle cx="56" cy="24" r="1.4"/><circle cx="62" cy="22" r="1.4"/><circle cx="68" cy="24" r="1.4"/><circle cx="58" cy="31" r="1.4"/><circle cx="66" cy="31" r="1.4"/><circle cx="62" cy="38" r="1.4"/></g>' +
      '<circle class="a-ball" cx="100" cy="40" r="7"/><path class="a-seam" d="M95 35 Q100 40 95 45 M105 35 Q100 40 105 45"/>',
    basics: '<path class="a-dash" d="M28 56 Q70 4 128 30"/><g class="a-line" transform="rotate(-35 40 46)"><ellipse cx="40" cy="34" rx="10" ry="12"/><path d="M40 46 L40 58"/></g>' +
      '<circle class="a-ball" cx="128" cy="30" r="6"/><path class="a-line" d="M8 62 H152"/>',
    walls: '<path class="a-line" d="M110 6 V62 H20"/><path class="a-line thin" d="M118 14 V62 M126 22 V62"/>' +
      '<path class="a-dash" d="M24 50 L80 58 L108 20 L64 30"/><circle class="a-ball" cx="64" cy="30" r="6"/>',
    attack: '<path class="a-line" d="M10 60 H150"/><path class="a-line" d="M80 34 V60"/><path class="a-line thin" d="M80 38 H150 M80 46 H150" />' +
      '<circle class="a-ball" cx="40" cy="14" r="6"/><path class="a-dash" d="M44 18 L118 56"/><path class="a-line" d="M110 50 L118 56 L108 58"/>',
    advanced: '<rect class="a-line" x="20" y="8" width="120" height="54" rx="2"/><path class="a-line thin" d="M80 8 V62 M40 8 V62 M120 8 V62 M40 35 H120"/>' +
      '<path class="a-dash" d="M30 52 L70 20 L108 48"/><circle class="a-ball" cx="108" cy="48" r="5"/><circle class="a-spot" cx="30" cy="52" r="3"/><circle class="a-spot" cx="70" cy="20" r="3"/>',
    drills: '<path class="a-line" d="M126 6 V62"/><path class="a-line" d="M10 62 H150"/>' +
      '<circle class="a-ball f1" cx="40" cy="48" r="5"/><circle class="a-ball f2" cx="70" cy="34" r="5"/><circle class="a-ball f3" cx="100" cy="22" r="5"/>' +
      '<path class="a-dash" d="M40 48 L118 18"/>'
  };
  function courseArt(c) {
    return '<span class="course-art" aria-hidden="true"><svg viewBox="0 0 160 70">' + (ART[c.id] || ART.intro) + "</svg></span>";
  }

  function courseCard(c) {
    var st = courseStats(c);
    var allFree = c.lessons.every(function (l) { return l.free; });
    var tier = tierOfCourse(c);
    return '<li class="reveal"><a class="course lv-' + (c.level || 0) + '" href="#c-' + c.id + '">' +
      courseArt(c) + (allFree ? '<span class="badge-free">უფასო</span>' : "") +
      '<span class="course-row"><span class="lvl">' + (c.level ? c.level : "+") + "</span>" +
      '<span class="course-body"><span class="course-level">' + esc(tier ? tier.name : c.levelName) + "</span>" +
      "<strong>" + esc(c.title) + "</strong>" +
      '<span class="course-meta">' + (c.rating ? "რეიტინგი " + esc(c.rating) + " · " : "") + lessonWord(st.total) +
      (st.done ? " · გავლილია " + st.pct + "%" : "") + "</span></span>" +
      '<span class="course-go" aria-hidden="true">→</span></span></a></li>';
  }

  // ---------- სტატისტიკა ----------
  function statsBar() {
    var all = allLessons();
    var free = all.filter(function (x) { return x.lesson.free; }).length;
    var videoMin = all.reduce(function (n, x) { return n + (x.lesson.video ? x.lesson.minutes || 0 : 0); }, 0);
    var items = [[all.length, "გაკვეთილი"], [S.courses.length, "კურსი"], [free, "უფასო გაკვეთილი"], [(S.modules || []).length, "უნარის მოდული"]];
    if (videoMin) items.splice(1, 0, [videoMin, "წუთი ვიდეო"]);
    var students = S.stats && S.stats.students;
    if (students) items.push([students, "მოსწავლე"]);
    return '<div class="stats"><div class="wrap"><ul>' + items.map(function (it) {
      return '<li><strong data-count="' + it[0] + '">' + it[0] + "</strong><span>" + esc(it[1]) + "</span></li>";
    }).join("") + "</ul></div></div>";
  }
  function countUp(scope) {
    if (!window.Motion || !window.Motion.enabled() || !("IntersectionObserver" in window)) return;
    var els = scope.querySelectorAll("[data-count]");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, end = +el.getAttribute("data-count"), t0 = performance.now();
        (function tick(t) {
          var k = Math.min(1, (t - t0) / 900);
          el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(tick);
        })(t0);
      });
    });
    els.forEach(function (el) { io.observe(el); });
  }

  // ---------- უნარის მოდულები ----------
  var MOD_ICON = {
    footwork: '<path d="M9 4c2 0 3 2 3 5s-1 6-3 6-3-3-3-6 1-5 3-5zM7 17h4v2H7zM17 8c2 0 3 2 3 4.5S19 18 17 18s-3-3-3-5.5S15 8 17 8zM15 20h4v1.5h-4z"/>',
    positioning: '<rect x="3" y="3" width="18" height="18" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3v18M3 12h18" stroke="currentColor" stroke-width="1.4" fill="none" stroke-dasharray="2 2"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="16.5" cy="7.5" r="2"/>',
    communication: '<path d="M3 5h11a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8l-4 3v-3H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM18 9h2a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-1v3l-4-3h-4a2 2 0 0 1-2-1.5h3a4 4 0 0 0 4-4z"/>',
    tactics: '<circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="6" r="2.5"/><path d="M6.5 16 L11 10 L17 7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2.5" stroke-linecap="round"/><path d="M14 18l5-5M14 13l5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'
  };
  function modulesSection() {
    if (!S.modules || !S.modules.length) return "";
    return '<section class="band band-mid" id="skills"><div class="wrap">' + dash() +
      '<p class="eyebrow reveal">ნაბიჯი 2 · უნარები</p><h2 class="reveal">ისწავლე თემის მიხედვით</h2>' +
      '<p class="lead reveal sub-lead">დონეების გარდა, გაკვეთილები დალაგებულია უნარებადაც.</p><ul class="modules">' +
      S.modules.map(function (m) {
        return '<li class="reveal"><a class="module" href="#m-' + m.id + '"><svg class="mod-ico" viewBox="0 0 24 24" aria-hidden="true">' + (MOD_ICON[m.id] || "") + "</svg>" +
          "<strong>" + esc(m.title) + "</strong><span>" + esc(m.text) + '</span><em>' + lessonWord(m.lessons.length) + " →</em></a></li>";
      }).join("") + "</ul></div></section>";
  }
  function lessonRow(l, label) {
    var side = done[l.id] ? '<span class="check" aria-label="გავლილია">✓</span>'
      : canWatch(l) ? '<span class="dur">' + (l.minutes || "–") + " წთ</span>"
      : '<span class="mini-lock" aria-label="გამოწერით"></span>';
    return '<li><a href="#l-' + l.id + '"><span class="num">' + label + "</span>" +
      '<span class="ll-title">' + esc(l.title) + (l.free ? ' <b class="free-word">უფასო</b>' : "") + "</span>" + side + "</a></li>";
  }
  function viewModule(m) {
    var html = '<section class="wrap narrow page-head"><a class="back" href="#skills">← უნარები</a>' +
      '<p class="course-level">უნარის მოდული</p><h1>' + esc(m.title) + "</h1>" +
      '<p class="lead">' + esc(m.text) + "</p></section>" +
      '<section class="wrap narrow"><ol class="lesson-list">';
    m.lessons.forEach(function (id, i) {
      var hit = findLesson(id);
      if (hit) html += lessonRow(hit.lesson, i + 1);
    });
    html += "</ol>";
    if (m.id === "positioning") html += '<p class="fine mod-link"><a href="#court">ნახე ინტერაქტიულ კორტზე →</a></p>';
    return html + "</section>";
  }

  // ---------- შენი გზა (დონე + რეიტინგი) ----------
  function pathPicker() {
    if (!S.tiers || !S.tiers.length) return "";
    return '<div class="path"><p class="path-label">იპოვე შენი გზა</p><div class="path-opts">' +
      S.tiers.map(function (t, i) {
        return '<a class="path-opt t-' + (i + 1) + '" href="#path-' + t.id + '"><b>' + esc(t.who) + "</b><span>" + esc(t.name) + " · " + esc(t.rating) + "</span></a>";
      }).join("") + '</div><a class="path-quiz" href="#quiz">არ იცი შენი დონე? გაიარე ტესტი →</a></div>';
  }
  function viewPath(t) {
    var idx = S.tiers.indexOf(t);
    var html = '<section class="wrap page-head"><a class="back" href="#">← მთავარი</a>' +
      '<p class="course-level">' + esc(t.who) + '</p><h1>' + esc(t.name) + ' <span class="rating-pill t-' + (idx + 1) + '">რეიტინგი ' + esc(t.rating) + "</span></h1>" +
      '<p class="lead">' + esc(t.text) + "</p></section>" +
      '<section class="wrap"><ol class="courses">';
    t.courses.forEach(function (id) { var c = findCourse(id); if (c) html += courseCard(c); });
    var drills = findCourse("drills");
    if (drills) html += courseCard(drills);
    html += '</ol><div class="tier-scale">' + S.tiers.map(function (x, i) {
      return '<a class="t-' + (i + 1) + (x === t ? " on" : "") + '" href="#path-' + x.id + '"><b>' + esc(x.rating) + "</b>" + esc(x.name) + "</a>";
    }).join("") + "</div></section>";
    return html;
  }

  // ---------- კვირის გამოწვევა ----------
  function weekIndex() {
    // 2024-01-01 ორშაბათი იყო; კვირა იწყება ორშაბათს, ადგილობრივი დროით
    var now = new Date();
    var d = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.floor((d - Date.UTC(2024, 0, 1)) / 6048e5);
  }
  function challengeSection() {
    var list = S.challenges || [];
    if (!list.length) return "";
    var w = weekIndex(), ch = list[w % list.length];
    var hit = findLesson(ch.lesson);
    var doneW = !!loadJson(CH_KEY, {})[w];
    var dow = (new Date().getDay() + 6) % 7, left = 7 - dow;
    return '<section class="band band-dark" id="challenge"><div class="wrap">' + dash() +
      '<p class="eyebrow reveal">ყოველ კვირას · გამოწვევა</p><h2 class="reveal">კვირის გამოწვევა</h2>' +
      '<div class="challenge reveal' + (doneW ? " is-done" : "") + '"><div class="ch-top"><span class="ch-ball" aria-hidden="true"></span>' +
      "<div><strong>" + esc(ch.title) + "</strong><p>" + esc(ch.text) + "</p></div></div>" +
      '<div class="ch-foot"><button id="chDone" class="btn ' + (doneW ? "ghost" : "primary") + '" type="button">' + (doneW ? "✓ შესრულებულია" : "შევასრულე") + "</button>" +
      (hit ? '<a class="ch-link" href="#l-' + hit.lesson.id + '">გაკვეთილი: ' + esc(hit.lesson.title) + "</a>" : "") +
      '<span class="ch-left">ახალი გამოწვევა ' + (left === 1 ? "ხვალ" : left + " დღეში") + "</span></div></div>" +
      '<a class="journal-teaser reveal" href="#journal"><b>სავარჯიშოს და მატჩის დღიური</b><span>ჩაიწერე, რა ივარჯიშე და როგორ ითამაშე →</span></a>' +
      "</div></section>";
  }

  // ---------- დღიური (ინახება მხოლოდ ამ ბრაუზერში) ----------
  function viewJournal() {
    var items = loadJson(JOURNAL_KEY, []);
    var today = new Date();
    var iso = today.getFullYear() + "-" + ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2);
    var month = iso.slice(0, 7);
    var monthItems = items.filter(function (e) { return (e.date || "").slice(0, 7) === month; });
    var mins = monthItems.reduce(function (n, e) { return n + (+e.minutes || 0); }, 0);
    var matches = items.filter(function (e) { return e.type === "match"; });
    var won = matches.filter(function (e) { return e.outcome === "win"; }).length;
    var html = '<section class="wrap narrow page-head"><a class="back" href="#">← მთავარი</a><h1>ჩემი დღიური</h1>' +
      '<p class="lead">ჩაიწერე ვარჯიში და მატჩი. ჩანაწერები ინახება მხოლოდ ამ მოწყობილობაზე.</p></section>' +
      '<section class="wrap narrow"><ul class="j-stats"><li><strong>' + monthItems.length + "</strong><span>ჩანაწერი ამ თვეში</span></li>" +
      "<li><strong>" + mins + "</strong><span>წუთი ამ თვეში</span></li>" +
      "<li><strong>" + won + " / " + matches.length + "</strong><span>მოგებული მატჩი</span></li></ul>" +
      '<form id="jForm" class="j-form">' +
      '<div class="seg" role="radiogroup" aria-label="ტიპი"><label><input type="radio" name="type" value="training" checked><span>ვარჯიში</span></label>' +
      '<label><input type="radio" name="type" value="match"><span>მატჩი</span></label></div>' +
      '<div class="j-row"><label>თარიღი<input type="date" name="date" value="' + iso + '" required></label>' +
      '<label>წუთი<input type="number" name="minutes" min="0" max="600" inputmode="numeric" placeholder="60"></label></div>' +
      '<label>რაზე იმუშავე<input type="text" name="focus" maxlength="120" placeholder="მაგ.: ბანდეხა, უკანა კედელი"></label>' +
      '<div class="j-row match-only"><label>ანგარიში<input type="text" name="score" maxlength="40" placeholder="6-4 3-6 7-5"></label>' +
      '<label>შედეგი<select name="outcome"><option value="">—</option><option value="win">მოგება</option><option value="loss">წაგება</option></select></label></div>' +
      '<fieldset class="feel"><legend>როგორ იყო?</legend>' + [1, 2, 3, 4, 5].map(function (n) {
        return '<label><input type="radio" name="feel" value="' + n + '"' + (n === 3 ? " checked" : "") + "><span>" + n + "</span></label>";
      }).join("") + "</fieldset>" +
      '<label>შენიშვნა<textarea name="notes" rows="3" maxlength="600" placeholder="რა გამოგივიდა კარგად, რა უნდა გააუმჯობესო"></textarea></label>' +
      '<button class="btn primary" type="submit">შენახვა</button></form>';
    if (items.length) {
      html += '<ol class="j-list">' + items.map(function (e) {
        var isMatch = e.type === "match";
        return '<li class="' + (isMatch ? "is-match" : "") + '"><div class="j-head"><b>' + (isMatch ? "მატჩი" : "ვარჯიში") + "</b>" +
          "<span>" + esc(e.date) + (e.minutes ? " · " + esc(e.minutes) + " წთ" : "") + "</span>" +
          '<span class="j-feel" aria-label="შეფასება ' + esc(e.feel) + '">' + "●".repeat(+e.feel || 0) + "</span>" +
          '<button class="j-del" type="button" data-del="' + esc(e.id) + '" aria-label="წაშლა">×</button></div>' +
          (e.focus ? "<p>" + esc(e.focus) + "</p>" : "") +
          (isMatch && (e.score || e.outcome) ? '<p class="j-score">' + esc(e.score || "") + (e.outcome ? " · " + (e.outcome === "win" ? "მოგება" : "წაგება") : "") + "</p>" : "") +
          (e.notes ? '<p class="j-notes">' + esc(e.notes) + "</p>" : "") + "</li>";
      }).join("") + "</ol>";
    } else {
      html += '<p class="fine j-empty">ჯერ ჩანაწერი არ გაქვს. დაიწყე დღევანდელით.</p>';
    }
    return html + "</section>";
  }
  function bindJournal() {
    var f = document.getElementById("jForm");
    if (!f) return;
    function syncType() { f.classList.toggle("is-match", f.type.value === "match"); }
    f.addEventListener("change", syncType);
    syncType();
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var d = new FormData(f), items = loadJson(JOURNAL_KEY, []);
      var e = { id: String(Date.now()), type: d.get("type"), date: d.get("date"), minutes: d.get("minutes"), focus: (d.get("focus") || "").trim(),
        feel: d.get("feel"), notes: (d.get("notes") || "").trim() };
      if (e.type === "match") { e.score = (d.get("score") || "").trim(); e.outcome = d.get("outcome"); }
      items.push(e);
      items.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : +b.id - +a.id; });
      saveJson(JOURNAL_KEY, items);
      render(true);
    });
    document.querySelectorAll("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-del");
        saveJson(JOURNAL_KEY, loadJson(JOURNAL_KEY, []).filter(function (e) { return e.id !== id; }));
        render(true);
      });
    });
  }

  // ---------- დამწყების გზამკვლევი + ელფოსტა ----------
  function newsletterHtml() {
    var action = S.newsletter && S.newsletter.action;
    return '<form class="news" id="newsForm"' + (action ? ' action="' + esc(action) + '" method="post"' : "") + ">" +
      '<label class="sr" for="newsEmail">ელფოსტა</label>' +
      '<input id="newsEmail" type="email" name="email" required autocomplete="email" placeholder="შენი ელფოსტა"' + (action ? "" : " disabled") + ">" +
      '<button class="btn primary" type="submit"' + (action ? "" : " disabled") + ">" + (action ? "გამოწერა" : "მალე ჩაირთვება") + "</button>" +
      '<p class="fine news-msg" aria-live="polite">' + (action ? "ახალ გაკვეთილებს და კვირის გამოწვევას ელფოსტაზე მიიღებ." : "ელფოსტის გამოწერა მალე დაემატება.") + "</p></form>";
  }
  function bindNewsletter() {
    var f = document.getElementById("newsForm");
    if (!f || !f.getAttribute("action")) return;
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var msg = f.querySelector(".news-msg"), btn = f.querySelector("button");
      btn.disabled = true;
      fetch(f.action, { method: "POST", body: new FormData(f), headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw 0; f.reset(); msg.textContent = "მადლობა! შეამოწმე ელფოსტა."; })
        .catch(function () { msg.textContent = "ვერ გაიგზავნა. სცადე თავიდან."; })
        .then(function () { btn.disabled = false; });
    });
  }
  function guideSection() {
    return '<section class="band band-mid" id="free-guide"><div class="wrap guide-cta">' + dash() +
      '<p class="eyebrow reveal">უფასოდ</p><h2 class="reveal">დამწყების გზამკვლევი</h2>' +
      '<p class="lead reveal sub-lead">7 ნაბიჯი პირველ მატჩამდე: რა ნახო, რა ივარჯიშო და რაზე არ იდარდო.</p>' +
      '<div class="cta-row reveal"><a class="btn primary" href="#guide">გახსენი გზამკვლევი</a><a class="btn on-dark" href="#quiz">გაიგე შენი დონე</a></div>' +
      '<div class="reveal news-wrap"><p class="news-title">მიიღე ახალი გაკვეთილები ელფოსტაზე</p>' + newsletterHtml() + "</div></div></section>";
  }
  function viewGuide() {
    var html = '<section class="wrap narrow page-head"><a class="back" href="#">← მთავარი</a><p class="course-level">უფასო</p>' +
      "<h1>დამწყების გზამკვლევი</h1><p class=\"lead\">7 ნაბიჯი პირველ მატჩამდე. თითო ნაბიჯს მიჰყევი თანმიმდევრობით.</p></section>" +
      '<section class="wrap narrow"><ol class="guide-steps">';
    (S.guide || []).forEach(function (g, i) {
      html += '<li><span class="g-num">' + (i + 1) + "</span><div><strong>" + esc(g.title) + "</strong><p>" + esc(g.text) + '</p><div class="g-links">' +
        g.lessons.map(function (id) {
          var hit = findLesson(id);
          return hit ? '<a href="#l-' + id + '">' + (done[id] ? "✓ " : "") + esc(hit.lesson.title) + "</a>" : "";
        }).join("") + "</div></div></li>";
    });
    html += '</ol><div class="cta-row g-actions"><button id="printGuide" class="btn ghost" type="button">შენახვა PDF-ად</button>' +
      '<a class="btn primary" href="#c-intro">დაიწყე პირველი კურსი</a></div>' +
      '<div class="news-wrap light"><p class="news-title">მიიღე ახალი გაკვეთილები ელფოსტაზე</p>' + newsletterHtml() + "</div></section>";
    return html;
  }

  function viewHome() {
    var all = allLessons();
    var doneN = all.filter(function (x) { return done[x.lesson.id]; }).length;
    var next = all.filter(function (x) { return !done[x.lesson.id]; })[0];
    var words = ["ისწავლე", "პადელი", "ონლაინ"];
    function heroMedia() {
      var motion = !window.Motion || window.Motion.enabled();
      if (S.heroVideo && motion) {
        return '<video class="hero-video" src="' + esc(S.heroVideo) + '"' + (S.heroPoster ? ' poster="' + esc(S.heroPoster) + '"' : "") +
          ' autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video><span class="hero-shade" aria-hidden="true"></span>';
      }
      if (S.heroPoster) return '<img class="hero-video" src="' + esc(S.heroPoster) + '" alt="" aria-hidden="true"><span class="hero-shade" aria-hidden="true"></span>';
      return "";
    }

    var html = '<section class="hero">' +
      heroMedia() +
      '<svg class="hero-court" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<rect x="2" y="2" width="196" height="96" class="h-line" pathLength="1"/><line x1="100" y1="0" x2="100" y2="100" class="h-line net"/>' +
      '<line x1="30.5" y1="2" x2="30.5" y2="98" class="h-line" pathLength="1"/><line x1="169.5" y1="2" x2="169.5" y2="98" class="h-line" pathLength="1"/>' +
      '<line x1="30.5" y1="50" x2="169.5" y2="50" class="h-line" pathLength="1"/>' +
      '<g class="h-ball"><ellipse class="h-shadow" cx="0" cy="0" rx="3" ry="1.2"/><circle class="h-dot" cx="0" cy="0" r="2.6"/></g></svg>' +
      '<div class="wrap hero-inner"><h1 class="words">' + words.map(function (w, i) {
        return '<span style="--i:' + i + '">' + esc(w) + "</span>";
      }).join(" ") + "</h1>" +
      '<p class="lead">ვიდეო-გაკვეთილები ქართულად, სრული დამწყებიდან Advanced-მდე. ისწავლე შენი ტემპით, პირველი კურსი უფასოა.</p>' +
      pathPicker() +
      (doneN && next ? '<a class="btn primary" href="#l-' + next.lesson.id + '">გაგრძელება: ' + esc(next.lesson.title) + "</a>" : "") +
      "</div></section>" + statsBar();

    html += '<section class="band band-dark" id="courses"><div class="wrap">' + dash() +
      '<p class="eyebrow reveal">ნაბიჯი 1 · აირჩიე დონე</p><h2 class="reveal">კურსები</h2><ol class="courses">';
    S.courses.forEach(function (c) { html += courseCard(c); });
    html += "</ol></div></section>";
    html += modulesSection();
    html += courtExplorer();
    html += challengeSection();
    html += guideSection();
    return html;
  }

  // ---------- დონის ტესტი ----------
  var QUIZ = [
    { q: "რამდენ ხანია, რაც პადელს თამაშობ?", a: ["ჯერ არასდროს მითამაშია", "6 თვემდე", "6 თვიდან 2 წლამდე", "2 წელზე მეტი"] },
    { q: "უკანა კედლიდან აისხლიტებულ ბურთს როგორ აბრუნებ?", a: ["ჯერ ვერ ვაბრუნებ", "ზოგჯერ გამომდის", "ჩვეულებრივ ვაბრუნებ", "ადვილად და შეტევით"] },
    { q: "ბანდეხა და ვიბორა?", a: ["არ ვიცი, რა არის", "ვიცი, მაგრამ ვერ ვასრულებ", "ბანდეხა გამომდის", "ორივე გამომდის, x3 სმეშიც"] }
  ];
  var quizState = { step: 0, score: 0 };

  function viewQuiz() {
    var html = '<section class="wrap narrow page-head quiz"><a class="back" href="#">← მთავარი</a>';
    if (quizState.step < QUIZ.length) {
      var item = QUIZ[quizState.step];
      html += '<p class="course-level">კითხვა ' + (quizState.step + 1) + " / " + QUIZ.length + "</p>" +
        '<div class="quiz-bar"><span style="width:' + (quizState.step / QUIZ.length * 100) + '%"></span></div>' +
        '<h1 class="swap">' + esc(item.q) + '</h1><div class="answers">' +
        item.a.map(function (t, i) { return '<button class="answer" type="button" data-score="' + i + '">' + esc(t) + "</button>"; }).join("") +
        "</div>";
    } else {
      var lvl = Math.min(5, Math.floor(quizState.score / 2) + 1);
      var c = S.courses.filter(function (x) { return x.level === lvl; })[0] || S.courses[0];
      var tier = tierOfCourse(c);
      html += '<p class="course-level">შენი დონე' + (tier ? " · რეიტინგი " + esc(c.rating || tier.rating) : "") + '</p><h1 class="swap">' + esc(tier ? tier.name : c.levelName) + "</h1>" +
        '<p class="lead">გირჩევ, დაიწყო კურსით „' + esc(c.title) + "“.</p>" +
        '<div class="cta-row"><a class="btn primary" href="#c-' + c.id + '">კურსზე გადასვლა</a>' +
        (tier ? '<a class="btn ghost" href="#path-' + tier.id + '">ჩემი გზა</a>' : "") +
        '<button id="quizAgain" class="btn ghost" type="button">თავიდან</button></div>';
    }
    return html + "</section>";
  }

  function viewCourse(c) {
    var html = '<section class="wrap narrow page-head"><a class="back" href="#courses">← კურსები</a>' +
      '<p class="course-level">' + esc(tierOfCourse(c) ? tierOfCourse(c).name : c.levelName) + (c.rating ? " · რეიტინგი " + esc(c.rating) : "") + "</p><h1>" + esc(c.title) + "</h1>" +
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
      '<div class="player-wrap">' + videoHtml(l) + '<span class="wipe" aria-hidden="true"></span></div>' +
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
    } else if (h.indexOf("m-") === 0 && findModule(h.slice(2))) {
      var m = findModule(h.slice(2));
      html = viewModule(m);
      document.title = m.title + " · " + S.name;
    } else if (h.indexOf("path-") === 0 && findTier(h.slice(5))) {
      var tr = findTier(h.slice(5));
      html = viewPath(tr);
      document.title = tr.name + " · " + S.name;
    } else if (h === "journal") {
      html = viewJournal();
      document.title = "დღიური · " + S.name;
    } else if (h === "guide") {
      html = viewGuide();
      document.title = "დამწყების გზამკვლევი · " + S.name;
    } else if (h === "quiz") {
      html = viewQuiz();
      document.title = "დონის ტესტი · " + S.name;
    } else if (h === "subscribe") {
      html = viewSubscribe();
      document.title = "გამოწერა · " + S.name;
    } else if (h === "glossary") {
      html = viewGlossary();
      document.title = "ლექსიკონი · " + S.name;
    } else {
      html = viewHome();
      document.title = S.name;
      if (["courses", "skills", "court", "challenge", "free-guide"].indexOf(h) >= 0) scrollTo = h;
    }
    app.innerHTML = html;
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + h || (h.indexOf("c-") === 0 || h.indexOf("l-") === 0) && a.getAttribute("href") === "#courses");
    });
    document.querySelectorAll("[data-spot]").forEach(function (el) {
      el.addEventListener("click", function () { selectSpot(el.getAttribute("data-spot")); });
    });
    if (document.getElementById("spotInfo")) selectSpot("net");
    document.querySelectorAll(".answer").forEach(function (b) {
      b.addEventListener("click", function () {
        quizState.score += +b.getAttribute("data-score");
        quizState.step++;
        render(true);
      });
    });
    var qa = document.getElementById("quizAgain");
    if (qa) qa.addEventListener("click", function () { quizState = { step: 0, score: 0 }; render(true); });
    if (h !== "quiz" && quizState.step >= QUIZ.length) quizState = { step: 0, score: 0 };
    if (window.Motion) window.Motion.afterRender(app);
    countUp(app);
    bindJournal();
    bindNewsletter();
    var cd = document.getElementById("chDone");
    if (cd) cd.addEventListener("click", function () {
      var all = loadJson(CH_KEY, {}), w = weekIndex();
      if (all[w]) delete all[w]; else all[w] = Date.now();
      saveJson(CH_KEY, all);
      render(true);
    });
    var pg = document.getElementById("printGuide");
    if (pg) pg.addEventListener("click", function () { window.print(); });
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
  var mt = document.getElementById("motionToggle");
  if (mt && window.Motion) mt.addEventListener("click", function () { window.Motion.toggle(); render(true); });
  render();

  // ---------- ტელეფონზე დაყენება (PWA) ----------
  var installBtn = document.getElementById("installApp");
  var installHint = document.getElementById("installHint");
  var deferred = null;
  var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    if (installBtn) installBtn.hidden = false;
  });
  if (installBtn && ios && !standalone) installBtn.hidden = false;
  if (installBtn) installBtn.addEventListener("click", function () {
    if (deferred) {
      deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; installBtn.hidden = true; });
    } else if (installHint) {
      installHint.hidden = !installHint.hidden;
    }
  });
  window.addEventListener("appinstalled", function () { if (installBtn) installBtn.hidden = true; });
  if ("serviceWorker" in navigator && location.protocol === "https:" && !/claude|claudeusercontent/.test(location.hostname)) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* offline mode unavailable */ });
    });
  }
})();
