// ======= Mobile menu, smooth scroll, form, gallery, animations =======

const REDUCED_MOTION = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Real "is touch primary" — devices that report touch capability but have a
// fine-pointer mouse (Windows touch laptops) should still get hover effects.
const IS_TOUCH = window.matchMedia &&
  window.matchMedia('(pointer: coarse)').matches;

// ----- Scroll choreography: stagger reveal of items inside sections ---------
function initScrollReveal() {
  if (REDUCED_MOTION || !('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll(
    'section h2, .card, .adv-card, .testimonial-card, .service-card, ' +
    '.stat, #faq li, #news .card, #about_us p, #about_us img, ' +
    '#contact form, #contact iframe'
  );
  targets.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.setProperty('--reveal-delay', (i % 6) * 60 + 'ms');
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal-in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  targets.forEach(t => io.observe(t));
}

// ----- Magnetic buttons -----------------------------------------------------
function initMagnetic() {
  if (REDUCED_MOTION || IS_TOUCH) return;
  document.querySelectorAll('[data-magnetic], .btn-hero, #contact .btn').forEach(el => {
    const strength = 0.25;
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

// ----- Tilt cards (global, not just one variant) ----------------------------
function initTilt() {
  if (REDUCED_MOTION || IS_TOUCH) return;
  document.querySelectorAll('.service-card, .testimonial-card, .news-card, #news .card').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${-y * 5}deg) rotateY(${x * 7}deg)`;
      el.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
      el.style.setProperty('--my', `${(y + 0.5) * 100}%`);
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

// ----- Ripple on click (buttons) --------------------------------------------
function initRipple() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('button, .btn, .btn-hero');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = (e.clientX - r.left) + 'px';
    ripple.style.top = (e.clientY - r.top) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
}

// ----- Animated counters ----------------------------------------------------
function initCounters() {
  if (!('IntersectionObserver' in window)) return;
  const els = document.querySelectorAll('[data-counter-to]');
  if (!els.length) return;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const animate = (el) => {
    const to = parseFloat(el.dataset.counterTo);
    const prefix = el.dataset.counterPrefix || '';
    const suffix = el.dataset.counterSuffix || '';
    const dur = 1500;
    const start = performance.now();
    const isFloat = to % 1 !== 0;
    const fmt = (v) => {
      if (isFloat) return v.toFixed(2);
      if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString();
      return Math.round(v).toString();
    };
    function step(t) {
      const p = Math.min(1, (t - start) / dur);
      const v = to * easeOut(p);
      el.textContent = prefix + fmt(v) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.classList.add('is-counted');
    }
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animate(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  els.forEach(el => io.observe(el));
}

// ----- Custom cursor --------------------------------------------------------
function initCursor() {
  if (REDUCED_MOTION || IS_TOUCH) return;
  const cursor = document.getElementById('customCursor');
  if (!cursor) return;
  let x = 0, y = 0, tx = 0, ty = 0;
  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  function tick() {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    cursor.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  }
  tick();
  document.querySelectorAll('a, button, [data-magnetic], .service-card, .testimonial-card, .adv-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor-active'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-active'));
  });
}

// ----- Hero typewriter ------------------------------------------------------
function initTypewriter() {
  const heads = document.querySelectorAll('.hero-title-typewriter');
  if (!heads.length) return;
  if (REDUCED_MOTION) return; // leave the SSR-rendered full text in place
  heads.forEach(t => {
    const text = t.dataset.text || '';
    const tgt = t.querySelector('.hero-typewriter-target');
    if (!tgt) return;
    tgt.textContent = '';
    let i = 0;
    const speed = Math.max(20, Math.min(60, 1500 / Math.max(text.length, 1)));
    function step() {
      tgt.textContent = text.slice(0, i++);
      if (i <= text.length) setTimeout(step, speed);
    }
    step();
  });
}

// ----- Mesh gradient hero (canvas, no WebGL dep) ----------------------------
function initMesh() {
  const c = document.getElementById('hero-mesh-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const accent = css.getPropertyValue('--accent').trim() || '#03e9f4';
  const primary = css.getPropertyValue('--primary').trim() || '#0A2540';
  const dark = css.getPropertyValue('--dark-bg').trim() || '#0b1020';
  let w, h, t = 0, mx = 0.5, my = 0.5;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = c.width = c.offsetWidth * dpr;
    h = c.height = c.offsetHeight * dpr;
  }
  function blob(cx, cy, r, color, alpha) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, color + Math.round(alpha * 255).toString(16).padStart(2, '0'));
    g.addColorStop(1, color + '00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  function tick() {
    t += REDUCED_MOTION ? 0 : 0.004;
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, w, h);
    const r = Math.max(w, h) * 0.55;
    blob(w * (0.3 + Math.sin(t) * 0.15 + (mx - 0.5) * 0.1),
         h * (0.4 + Math.cos(t * 1.3) * 0.15 + (my - 0.5) * 0.1),
         r, accent, 0.55);
    blob(w * (0.7 + Math.cos(t * 0.7) * 0.18 - (mx - 0.5) * 0.1),
         h * (0.6 + Math.sin(t * 1.1) * 0.18 - (my - 0.5) * 0.1),
         r, primary, 0.6);
    blob(w * (0.5 + Math.sin(t * 0.5) * 0.2),
         h * (0.3 + Math.cos(t * 0.9) * 0.2),
         r * 0.8, accent, 0.35);
    requestAnimationFrame(tick);
  }
  c.addEventListener('mousemove', e => {
    const r = c.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width;
    my = (e.clientY - r.top) / r.height;
  });
  resize();
  tick();
  window.addEventListener('resize', resize, { passive: true });
}

// ----- Interactive particles hero canvas ------------------------------------
function initInteractiveCanvas() {
  const c = document.getElementById('hero-interactive-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const accent = css.getPropertyValue('--accent').trim() || '#03e9f4';
  const dark = css.getPropertyValue('--dark-bg').trim() || '#0b1020';
  let w, h, parts;
  let mx = -1e6, my = -1e6;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = c.width = c.offsetWidth * dpr;
    h = c.height = c.offsetHeight * dpr;
    const N = window.innerWidth < 768 ? 60 : 120;
    parts = Array.from({ length: N }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3 * dpr,
      vy: (Math.random() - 0.5) * 0.3 * dpr,
      r: (Math.random() * 1.6 + 0.6) * dpr,
    }));
  }
  function tick() {
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, w, h);
    parts.forEach(p => {
      const dx = mx - p.x, dy = my - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 22500) {
        const f = (1 - d2 / 22500) * 0.6;
        p.vx -= dx * f * 0.0006;
        p.vy -= dy * f * 0.0006;
      }
      p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 0.12; ctx.strokeStyle = accent; ctx.lineWidth = 1;
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const dx = parts[i].x - parts[j].x, dy = parts[i].y - parts[j].y;
      if (dx * dx + dy * dy < 16000) {
        ctx.beginPath(); ctx.moveTo(parts[i].x, parts[i].y); ctx.lineTo(parts[j].x, parts[j].y); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }
  document.addEventListener('mousemove', e => {
    const r = c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    mx = (e.clientX - r.left) * dpr;
    my = (e.clientY - r.top) * dpr;
  });
  document.addEventListener('mouseleave', () => { mx = -1e6; my = -1e6; });
  resize();
  tick();
  window.addEventListener('resize', resize, { passive: true });
}

// ----- Hero spotlight: soft glow that follows the cursor across the hero ----
function initHeroSpotlight() {
  if (REDUCED_MOTION || IS_TOUCH) return;
  const hero = document.getElementById('hero');
  if (!hero) return;
  hero.classList.add('has-spotlight');
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--sx', ((e.clientX - r.left) / r.width * 100) + '%');
    hero.style.setProperty('--sy', ((e.clientY - r.top) / r.height * 100) + '%');
  });
  hero.addEventListener('mouseleave', () => {
    hero.style.setProperty('--sx', '50%');
    hero.style.setProperty('--sy', '50%');
  });
}

// ----- Hero parallax: background image moves slower than scrollable content -
function initHeroParallax() {
  if (REDUCED_MOTION) return;
  const hero = document.getElementById('hero');
  if (!hero) return;
  let raf;
  function tick() {
    const y = window.scrollY;
    if (y < window.innerHeight * 1.2) {
      hero.style.backgroundPosition = `center ${50 + y * 0.04}%`;
    }
    raf = null;
  }
  window.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
}

// ----- Newsletter footer subscribe (graceful fallback) ----------------------
function handleSubscribe(e) {
  e.preventDefault();
  const form = e.target;
  const email = (form.elements.email && form.elements.email.value || '').trim();
  if (!email) return false;
  const fd = new FormData();
  fd.append('email', email);
  fetch('/api/subscribe', { method: 'POST', body: fd })
    .catch(() => {})
    .finally(() => {
      form.reset();
      try {
        const m = new bootstrap.Modal(document.getElementById('subscribeModal'));
        m.show();
      } catch (_) {}
    });
  return false;
}
window.handleSubscribe = handleSubscribe;

document.addEventListener('DOMContentLoaded', function() {
  initScrollReveal();
  initMagnetic();
  initTilt();
  initRipple();
  initCounters();
  initCursor();
  initTypewriter();
  initMesh();
  initInteractiveCanvas();
  initHeroSpotlight();
  initHeroParallax();

  // Mobile menu toggle (for .menu-toggle / .nav-menu)
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu     = document.querySelector('.nav-menu');
  
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    // Close menu on link click
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });

    // Close menu on outside click
    document.addEventListener('click', e => {
      if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
      }
    });
  }

  // Smooth scroll to anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== Contact form submission (shows #successModal) =====
  window.handleSubmit = function(event) {
    event.preventDefault();
    const form     = document.getElementById('contactForm');
    const formData = new FormData(form);

    fetch('https://formspree.io/f/mldbzjyw', {
      method: 'POST',
      body:   formData,
      headers:{ 'Accept': 'application/json' }
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(() => {
      const modalEl = document.getElementById('successModal');
      const bsModal = new bootstrap.Modal(modalEl);
      bsModal.show();
      form.reset();
    })
    .catch(error => {
      console.error('Form submission error:', error);
      alert('Произошла ошибка при отправке формы. Пожалуйста, попробуйте позже.');
    });
  };

  // ===== Newsletter subscription (shows same #successModal) =====
  window.handleSubscribe = function(event) {
    event.preventDefault();
    const form     = document.getElementById('newsletterForm');
    const formData = new FormData(form);

    fetch('https://formspree.io/f/mldbzjyw', {
      method: 'POST',
      body:   formData,
      headers:{ 'Accept': 'application/json' }
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(() => {
      const modalEl = document.getElementById('successModal');
      const bsModal = new bootstrap.Modal(modalEl);
      bsModal.show();
      form.reset();
    })
    .catch(error => {
      console.error('Subscription error:', error);
      alert('Не удалось оформить подписку. Пожалуйста, попробуйте позже.');
    });
  };

  // Scroll-in animation for cards and images
  const animatedEls = document.querySelectorAll(
    '.card, .adv-card, .testimonial-card, .news-card, .section-image img, .about-image img'
  );
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-on-scroll');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  animatedEls.forEach(el => observer.observe(el));

  // Initialize image galleries
  initImageGalleries();
});

// ===== Gallery initialization =====
function initImageGalleries() {
  document.querySelectorAll('.section-gallery').forEach(gallery => {
    const images       = Array.from(gallery.querySelectorAll('.gallery-img'));
    const dots         = Array.from(gallery.querySelectorAll('.gallery-dot'));
    let   currentIndex = 0;
    let   intervalId   = null;

    if (images.length < 2) return;

    function showSlide(idx) {
      images.forEach(img => img.style.display = 'none');
      dots.forEach(dot   => dot.style.backgroundColor = 'rgba(255,255,255,0.5)');
      images[idx].style.display = 'block';
      dots[idx].style.backgroundColor = '#ffffff';
      currentIndex = idx;
    }

    function startAutoScroll() {
      clearInterval(intervalId);
      intervalId = setInterval(() => {
        showSlide((currentIndex + 1) % images.length);
      }, 3000);
    }

    // Dot clicks
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        clearInterval(intervalId);
        showSlide(idx);
        startAutoScroll();
      });
    });

    // Pause on hover
    gallery.addEventListener('mouseenter', () => clearInterval(intervalId));
    gallery.addEventListener('mouseleave', () => startAutoScroll());

    // Touch swipe
    let touchStartX = 0;
    gallery.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, false);
    gallery.addEventListener('touchend', e => {
      const touchEndX = e.changedTouches[0].screenX;
      if (touchEndX < touchStartX - 40) {
        showSlide((currentIndex + 1) % images.length);
      } else if (touchEndX > touchStartX + 40) {
        showSlide((currentIndex - 1 + images.length) % images.length);
      }
      startAutoScroll();
    }, false);

    // Start
    showSlide(0);
    startAutoScroll();
  });
}
