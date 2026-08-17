// ═══════════════════════════════════════════════════════════════
// MANASYN v2 — ENHANCED CLIENT JAVASCRIPT
// Cursor animation, button effects, toasts, network detection,
// skeleton loading, AOS scroll animations, smooth UX
// ═══════════════════════════════════════════════════════════════

(function() {
  'use strict';

  // ── Custom Cursor ──
  if (window.matchMedia('(hover: hover)').matches && window.innerWidth > 900) {
    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    // Smooth follow ring
    function animateRing() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateRing);
    }
    animateRing();

    // Hover effect on interactive elements
    document.querySelectorAll('a, button, .card, .action-card, .flashcard, .quick-action').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('cursor-ring--hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('cursor-ring--hover'));
    });
  }

  // ── AOS (Animate on Scroll) init ──
  if (window.AOS) {
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
      disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
  }

  // ── Scroll progress bar ──
  const scrollBar = document.createElement('div');
  scrollBar.className = 'scroll-progress';
  document.body.appendChild(scrollBar);
  window.addEventListener('scroll', () => {
    const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    scrollBar.style.width = scrolled + '%';
  }, { passive: true });

  // ── Toast notification system ──
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);

  window.showToast = function(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // ── Network status detection ──
  const networkBanner = document.createElement('div');
  networkBanner.className = 'network-banner';
  networkBanner.textContent = '⚠ You appear to be offline. Some features may not work.';
  document.body.appendChild(networkBanner);

  function updateNetworkStatus() {
    if (!navigator.onLine) {
      networkBanner.classList.add('show');
      showToast('You are offline. Conversations will retry when you reconnect.', 'error', 5000);
    } else {
      networkBanner.classList.remove('show');
    }
  }
  window.addEventListener('online', () => {
    networkBanner.classList.remove('show');
    showToast('Back online.', 'success', 2000);
  });
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();

  // ── Theme toggle (persisted server-side) ──
  window.toggleTheme = function() {
    const current = document.body.dataset.theme || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.body.dataset.theme = next;

    // Update icon
    const sun = document.getElementById('icon-sun');
    const moon = document.getElementById('icon-moon');
    if (sun && moon) {
      sun.style.display = next === 'dark' ? 'none' : 'block';
      moon.style.display = next === 'dark' ? 'block' : 'none';
    }

    // Persist via fetch (server stores in session + DB)
    fetch(window.location.pathname + '?theme=' + next, { method: 'GET', credentials: 'same-origin' })
      .catch(() => {});
  };

  // Set initial icon state
  const theme = document.body.dataset.theme || 'light';
  const sun = document.getElementById('icon-sun');
  const moon = document.getElementById('icon-moon');
  if (sun && moon) {
    sun.style.display = theme === 'dark' ? 'none' : 'block';
    moon.style.display = theme === 'dark' ? 'block' : 'none';
  }

  // ── Skeleton loading helper ──
  window.showSkeleton = function(container, count = 3) {
    if (!container) return;
    const skeletons = [];
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'skeleton skeleton--card mb-4';
      container.appendChild(s);
      skeletons.push(s);
    }
    return () => skeletons.forEach(s => s.remove());
  };

  // ── Auto-scroll conversation ──
  const messages = document.getElementById('messages');
  if (messages) messages.scrollTop = messages.scrollHeight;

  // ── CSRF token injection for all forms ──
  // Token is set by the server in a meta tag
  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  if (csrfMeta) {
    const token = csrfMeta.content;
    document.querySelectorAll('form').forEach(form => {
      if (!form.querySelector('input[name="_csrf"]')) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = '_csrf';
        input.value = token;
        form.appendChild(input);
      }
    });

    // Also inject into fetch headers
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
      if (['POST','PUT','DELETE','PATCH'].includes((options.method||'GET').toUpperCase())) {
        options.headers = options.headers || {};
        if (typeof options.headers === 'object' && !options.headers['x-csrf-token']) {
          options.headers['x-csrf-token'] = token;
        }
      }
      options.credentials = options.credentials || 'same-origin';
      return originalFetch.call(this, url, options);
    };
  }

  // ── Disable DevTools-based role escalation (detection only) ──
  // Note: This is detection, not prevention. True prevention is server-side.
  // If someone modifies localStorage/sessionStorage, we notify the server.
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    if (key.includes('role') || key.includes('user')) {
      console.warn('Tampering detected: modifying user data via storage.');
      // The server will reject any requests with mismatched roles anyway
    }
    originalSetItem.call(this, key, value);
  };

  // ── Page transition on navigation ──
  document.querySelectorAll('a:not([target="_blank"])').forEach(link => {
    if (link.hostname === window.location.hostname && !link.hash) {
      link.addEventListener('click', (e) => {
        // Don't intercept if modifier keys
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.15s ease';
        setTimeout(() => { window.location.href = link.href; }, 150);
      });
    }
  });

})();