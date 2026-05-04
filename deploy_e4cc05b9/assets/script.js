// ======= Mobile menu, smooth scroll, form, gallery, animations =======
document.addEventListener('DOMContentLoaded', function() {
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
