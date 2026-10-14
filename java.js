/* ═══════════════════════════════════════════════
   VERTEX — CINEMATIC PRESENTATION ENGINE
   ═══════════════════════════════════════════════ */
(function(){
"use strict";

/* ── STATE ─────────────────────────────────── */
let curIdx = 0, isAnim = false;
const DUR = 1300; // slide transition ms

const slides = document.querySelectorAll('.presentation-section');
const N = slides.length;

/* ── PRELOADER ─────────────────────────────── */
const preEl  = document.getElementById('preloader');
const preBar = document.getElementById('pre-bar');
const prePct = document.getElementById('pre-pct');
let pct = 0;

const preIv = setInterval(() => {
  pct += Math.random() * 14 + 4;
  if (pct >= 100) { pct = 100; clearInterval(preIv); }
  preBar.style.width = pct + '%';
  prePct.textContent = 'Loading · ' + Math.floor(pct) + '%';
  if (pct >= 100) setTimeout(boot, 350);
}, 80);

function boot() {
  preEl.classList.add('out');
  initCanvas();
  initSlides();
  initDots();
  initCursor();
  initHeroParallax();
  initDragScroll();
  initNavLinks();
  initMobileMenu();
  initCounters();
  slides[0].classList.add('active-slide');
  updateUI();
}

/* ── CANVAS PARTICLES ──────────────────────── */
function initCanvas() {
  const cv = document.getElementById('bg-canvas');
  const cx = cv.getContext('2d');
  let W, H, pts = [];

  function resize() {
    W = cv.width = window.innerWidth;
    H = cv.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  let mx = W/2, my = H/2;
  document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; });

  class Pt {
    constructor() { this.init(); }
    init() {
      this.x = Math.random()*W; this.y = Math.random()*H;
      this.vx = (Math.random()-.5)*.25; this.vy = (Math.random()-.5)*.25;
      this.r  = Math.random()*.9+.3;
      this.base = Math.random()*.2+.03;
      this.a = this.base;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x<0||this.x>W||this.y<0||this.y>H) this.init();
      const dx=mx-this.x, dy=my-this.y, d=Math.sqrt(dx*dx+dy*dy);
      if (d < 160) {
        this.x += dx*.007; this.y += dy*.007;
        this.a = Math.min(.9, this.a+.06);
      } else {
        this.a = Math.max(this.base, this.a-.012);
      }
    }
    draw() {
      cx.beginPath();
      cx.arc(this.x,this.y,this.r,0,Math.PI*2);
      cx.fillStyle = `rgba(200,169,110,${this.a})`;
      cx.fill();
    }
  }

  for (let i=0; i<90; i++) pts.push(new Pt());

  function drawLines() {
    for (let i=0;i<pts.length;i++) {
      for (let j=i+1;j<pts.length;j++) {
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if (d < 110) {
          cx.beginPath();
          cx.moveTo(pts[i].x,pts[i].y);
          cx.lineTo(pts[j].x,pts[j].y);
          cx.strokeStyle = `rgba(200,169,110,${.07*(1-d/110)})`;
          cx.lineWidth = .5; cx.stroke();
        }
      }
    }
  }

  (function loop(){
    cx.clearRect(0,0,W,H);
    pts.forEach(p=>{p.update();p.draw()});
    drawLines();
    requestAnimationFrame(loop);
  })();
}

/* ── SLIDES ────────────────────────────────── */
function initSlides() {
  slides.forEach((s,i) => {
    s.dataset.index = i;
  });
}

function goTo(next) {
  if (isAnim || next<0 || next>=N || next===curIdx) return;
  isAnim = true;

  // flash
  const flash = document.getElementById('trans-flash');
  flash.classList.add('show');
  setTimeout(() => flash.classList.remove('show'), 200);

  const prev = slides[curIdx];
  const nxt  = slides[next];

  prev.classList.remove('active-slide');
  prev.classList.add('prev-slide');

  nxt.classList.remove('prev-slide');
  nxt.classList.add('active-slide');

  curIdx = next;
  updateUI();
  triggerCounters();

  setTimeout(() => {
    prev.classList.remove('prev-slide');
    isAnim = false;
  }, DUR + 100);
}

/* ── UPDATE UI ─────────────────────────────── */
const sectionIds = ['hero','about','projects','reel','values','contact'];
const sectionNames = ['Home','About','Projects','Showcase','Values','Contact'];

function updateUI() {
  // counter
  document.getElementById('cur-num').textContent = String(curIdx+1).padStart(2,'0');
  document.getElementById('tot-num').textContent = String(N).padStart(2,'0');

  // dots
  document.querySelectorAll('.pdot').forEach((d,i) => {
    d.classList.toggle('active', i===curIdx);
  });

  // nav links
  document.querySelectorAll('.navbar__link').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === '#'+sectionIds[curIdx]);
  });

  // navbar solid after hero
  const nav = document.getElementById('navbar');
  nav.classList.toggle('solid', curIdx > 0);
}

/* ── PROGRESS DOTS ─────────────────────────── */
function initDots() {
  const wrap = document.getElementById('progress-dots');
  for (let i=0; i<N; i++) {
    const d = document.createElement('div');
    d.className = 'pdot';
    d.title = sectionNames[i];
    d.innerHTML = `<span class="pdot-label">${sectionNames[i]}</span>`;
    d.addEventListener('click', () => goTo(i));
    wrap.appendChild(d);
  }
}

/* ── WHEEL + TOUCH ─────────────────────────── */
let wTimer = 0;
window.addEventListener('wheel', e => {
  if (Math.abs(e.deltaY) < 30) return;
  clearTimeout(wTimer);
  wTimer = setTimeout(() => {
    goTo(e.deltaY > 0 ? curIdx+1 : curIdx-1);
  }, 40);
}, {passive:true});

let ty = 0;
window.addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, {passive:true});
window.addEventListener('touchend', e => {
  const diff = ty - e.changedTouches[0].clientY;
  if (Math.abs(diff) > 55) goTo(diff>0 ? curIdx+1 : curIdx-1);
}, {passive:true});

/* keyboard */
window.addEventListener('keydown', e => {
  if (e.key==='ArrowDown'||e.key==='PageDown') goTo(curIdx+1);
  if (e.key==='ArrowUp'||e.key==='PageUp') goTo(curIdx-1);
});

/* ── CURSOR ────────────────────────────────── */
function initCursor() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-circle');
  let cx=0,cy=0,rx=0,ry=0;

  document.addEventListener('mousemove', e => {
    cx=e.clientX; cy=e.clientY;
    dot.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
  });

  (function trackRing(){
    rx += (cx-rx)*.1; ry += (cy-ry)*.1;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(trackRing);
  })();

  const hovEls = document.querySelectorAll('a,button,.project-card,.value-card,.pdot,.stat-item');
  hovEls.forEach(el => {
    el.addEventListener('mouseenter', ()=>document.body.classList.add('cursor-grow'));
    el.addEventListener('mouseleave', ()=>document.body.classList.remove('cursor-grow'));
  });
}

/* ── HERO PARALLAX ─────────────────────────── */
function initHeroParallax() {
  const hero = document.getElementById('hero');
  const bgW  = document.getElementById('hero-bg-word');
  const content = hero.querySelector('.hero__content');

  hero.addEventListener('mousemove', e => {
    const r=hero.getBoundingClientRect();
    const dx=(e.clientX-r.left-r.width/2)/r.width;
    const dy=(e.clientY-r.top-r.height/2)/r.height;
    if (content) content.style.transform = `translate(${dx*-18}px,${dy*-10}px)`;
    if (bgW)     bgW.style.transform = `translateY(-50%) translate(${dx*25}px,${dy*12}px) scale(1.02)`;
  });
  hero.addEventListener('mouseleave', ()=>{
    if (content) content.style.transform = '';
    if (bgW)     bgW.style.transform = 'translateY(-50%)';
  });
}

/* ── DRAG SCROLL ───────────────────────────── */
function initDragScroll() {
  const track = document.getElementById('proj-track');
  if (!track) return;
  let down=false, sx=0, sl=0;
  track.addEventListener('mousedown', e => {
    down=true; sx=e.pageX-track.offsetLeft; sl=track.scrollLeft;
    track.classList.add('dragging');
  });
  document.addEventListener('mouseup', ()=>{ down=false; track.classList.remove('dragging'); });
  track.addEventListener('mousemove', e => {
    if (!down) return; e.preventDefault();
    const x=e.pageX-track.offsetLeft;
    track.scrollLeft = sl-(x-sx)*1.6;
  });
  // 3D tilt on cards
  track.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r=card.getBoundingClientRect();
      const dx=(e.clientX-r.left-r.width/2)/(r.width/2);
      const dy=(e.clientY-r.top-r.height/2)/(r.height/2);
      card.style.transform=`perspective(1000px) rotateY(${dx*7}deg) rotateX(${-dy*5}deg) scale(1.02)`;
      card.style.zIndex='5';
    });
    card.addEventListener('mouseleave', ()=>{ card.style.transform=''; card.style.zIndex=''; });
  });
}

/* ── NAV LINKS ─────────────────────────────── */
function initNavLinks() {
  document.querySelectorAll('[data-nav]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      const id   = href.replace('#','');
      const idx  = sectionIds.indexOf(id);
      if (idx !== -1 && idx !== curIdx) {
        e.preventDefault();
        goTo(idx);
      }
    });
  });
}

/* ── MOBILE MENU ───────────────────────────── */
function initMobileMenu() {
  const burger = document.getElementById('burger');
  const links  = document.getElementById('nav-links');
  burger.addEventListener('click', () => {
    const open = links.classList.contains('open');
    if (open) {
      links.classList.remove('open');
      links.removeAttribute('style');
    } else {
      links.classList.add('open');
      Object.assign(links.style,{
        display:'flex', flexDirection:'column',
        position:'fixed', top:'0', left:'0', right:'0', bottom:'0',
        background:'rgba(6,10,15,.97)', justifyContent:'center',
        alignItems:'center', gap:'2.5rem', zIndex:'99',
        backdropFilter:'blur(20px)'
      });
    }
  });
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', ()=>{
      links.classList.remove('open');
      links.removeAttribute('style');
    });
  });
}

/* ── COUNTERS (fire when about slide activates) ── */
let countersRun = false;
function initCounters() { /* setup only */ }

function triggerCounters() {
  if (curIdx !== 1 || countersRun) return;
  countersRun = true;
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = +el.dataset.count;
    const suf    = el.dataset.suf || '';
    const dur    = 1800, start = performance.now();
    (function tick(now){
      const p = Math.min((now-start)/dur, 1);
      const e = 1 - Math.pow(2, -10*p);
      el.textContent = Math.floor(e*target) + suf;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target + suf;
    })(start);
  });
}

/* ── VALUE CARD GLOW ───────────────────────── */
document.querySelectorAll('.value-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r=card.getBoundingClientRect();
    const x=((e.clientX-r.left)/r.width*100).toFixed(1);
    const y=((e.clientY-r.top)/r.height*100).toFixed(1);
    card.style.setProperty('--mx',x+'%');
    card.style.setProperty('--my',y+'%');
  });
});

/* ── MAGNETIC BUTTONS ──────────────────────── */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r=btn.getBoundingClientRect();
    const dx=e.clientX-r.left-r.width/2;
    const dy=e.clientY-r.top-r.height/2;
    btn.style.transform=`translate(${dx*.3}px,${dy*.3}px)`;
  });
  btn.addEventListener('mouseleave', ()=>{ btn.style.transform=''; });
});

/* ── FORM ──────────────────────────────────── */
window.handleForm = function(e) {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  btn.textContent='Sending...'; btn.disabled=true;
  setTimeout(()=>{
    btn.textContent='✓ Message Received';
    btn.style.background='rgba(200,169,110,.2)';
    btn.style.color='var(--gold)';
    e.target.reset();
    setTimeout(()=>{
      btn.textContent='Initiate Briefing →';
      btn.style.background='';btn.style.color='';btn.disabled=false;
    },4000);
  },1400);
};

})();