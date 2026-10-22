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
  // კორტის ნაწილები ინტერაქტიული სექციისთვის (კოორდინატები 200 × 100 კორტზე, ბადე შუაშია)
  var COURT_SPOTS = [
    { id: "net", x: 100, y: 50, name: "ბადე", text: "ბადე კორტს ორ 10 × 10 მეტრიან ნაწილად ყოფს. სიმაღლე ცენტრში 88 სმ-ია, კიდეებთან 92 სმ.", lesson: "i02" },
    { id: "serve", x: 65.25, y: 25, name: "მოწოდების ხაზი", text: "ბადიდან 6,95 მეტრზეა. მოწოდება სრულდება ამ ხაზის უკნიდან, წელის ქვემოთ და დიაგონალზე.", lesson: "b03" },
    { id: "center", x: 135, y: 50, name: "ცენტრალური ხაზი", text: "მოწოდების ზონას მარჯვენა და მარცხენა ნაწილებად ყოფს. მოწოდება ყოველთვის მეტოქის დიაგონალურ ზონაში უნდა მოხვდეს.", lesson: "i09" },
    { id: "back", x: 192, y: 72, name: "უკანა მინა", text: "3 მეტრი სიმაღლის შუშის კედელი. ბურთი შეგიძლია დააბრუნო მას შემდეგ, რაც მიწაზე დაეცემა და მინიდან აისხლიტება.", lesson: "b08" },
    { id: "side", x: 40, y: 95, name: "გვერდითი კედელი", text: "ნაწილი შუშაა, ნაწილი ლითონის ბადე. შუშიდან ბურთი თანაბრად აისხლიტება, ლითონის ბადიდან კი არაპროგნოზირებადად.", lesson: "w01" }
  ];

  function courtExplorer() {
    var html = '<section class="wrap explore reveal" id="court"><h2>გაიცანი კორტი</h2>' +
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
    return html + '</div><div class="spot-info" id="spotInfo" aria-live="polite"></div></section>';
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

  function viewHome() {
    var all = allLessons();
    var doneN = all.filter(function (x) { return done[x.lesson.id]; }).length;
    var next = all.filter(function (x) { return !done[x.lesson.id]; })[0];
    var words = ["ისწავლე", "პადელი", "ონლაინ"];

    var html = '<section class="hero">' +
      (S.heroVideo ? '<video class="hero-video" src="' + esc(S.heroVideo) + '" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>' : "") +
      '<svg class="hero-court" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<rect x="2" y="2" width="196" height="96" class="h-line" pathLength="1"/><line x1="100" y1="0" x2="100" y2="100" class="h-line net"/>' +
      '<line x1="30.5" y1="2" x2="30.5" y2="98" class="h-line" pathLength="1"/><line x1="169.5" y1="2" x2="169.5" y2="98" class="h-line" pathLength="1"/>' +
      '<line x1="30.5" y1="50" x2="169.5" y2="50" class="h-line" pathLength="1"/>' +
      '<g class="h-ball"><ellipse class="h-shadow" cx="0" cy="0" rx="3" ry="1.2"/><circle class="h-dot" cx="0" cy="0" r="2.6"/></g></svg>' +
      '<div class="wrap hero-inner"><h1 class="words">' + words.map(function (w, i) {
        return '<span style="--i:' + i + '">' + esc(w) + "</span>";
      }).join(" ") + "</h1>" +
      '<p class="lead">ვიდეო-გაკვეთილები ქართულად, სრული დამწყებიდან Advanced-მდე. ისწავლე შენი ტემპით, პირველი კურსი უფასოა.</p>' +
      '<div class="cta-row">' +
      (next ? '<a class="btn primary" href="#l-' + next.lesson.id + '">' + (doneN ? "გაგრძელება" : "დაიწყე უფასოდ") + "</a>" : "") +
      '<a class="btn on-dark" href="#quiz">გაიგე შენი დონე</a></div></div></section>';

    html += '<div class="court-divider" aria-hidden="true"><svg viewBox="0 0 400 20" preserveAspectRatio="none"><line x1="0" y1="10" x2="400" y2="10" class="reveal draw-line"/></svg></div>';

    html += '<section class="wrap" id="courses"><h2 class="reveal">კურსები</h2><ol class="courses">';
    S.courses.forEach(function (c) {
      var st = courseStats(c);
      var allFree = c.lessons.every(function (l) { return l.free; });
      html += '<li class="reveal"><a class="course" href="#c-' + c.id + '">' +
        '<span class="lvl' + (c.level ? "" : " side") + '">' + (c.level ? c.level : "+") + "</span>" +
        '<span class="course-body"><span class="course-level">' + esc(c.levelName) + "</span>" +
        "<strong>" + esc(c.title) + "</strong>" +
        '<span class="course-meta">' + lessonWord(st.total) + (allFree ? ' · <b class="free-word">უფასო</b>' : "") +
        (st.done ? " · გავლილია " + st.pct + "%" : "") + "</span></span>" +
        '<span class="course-go" aria-hidden="true">→</span></a></li>';
    });
    html += "</ol></section>";
    return html + courtExplorer();
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
      html += '<p class="course-level">შენი დონე</p><h1 class="swap">' + esc(c.levelName) + "</h1>" +
        '<p class="lead">გირჩევ, დაიწყო კურსით „' + esc(c.title) + "“.</p>" +
        '<div class="cta-row"><a class="btn primary" href="#c-' + c.id + '">კურსზე გადასვლა</a>' +
        '<button id="quizAgain" class="btn ghost" type="button">თავიდან</button></div>';
    }
    return html + "</section>";
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
      if (h === "courses") scrollTo = "courses";
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
})();
