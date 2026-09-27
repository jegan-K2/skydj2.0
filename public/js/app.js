/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT — SHARED APP MODULE (app.js)
   Navbar, Mobile drawer, Toast, Scroll reveal, Auth tracking (JWT-based)
   ========================================================================== */

// Auth state stored in memory (loaded from localStorage token)
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initNavScroll();
  initScrollReveal();
  initAuthTracker();
  initContactTriggers();
});

/* ── Mobile Nav ── */
function initMobileNav() {
  const hamburger  = document.getElementById("hamburgerBtn");
  const drawer     = document.getElementById("mobileNavDrawer");
  const overlay    = document.getElementById("mobileNavOverlay");
  const closeBtn   = document.getElementById("mobileNavClose");
  if (!hamburger || !drawer || !overlay) return;

  const open  = () => { drawer.classList.add("open");  overlay.classList.add("open");  document.body.style.overflow = "hidden"; };
  const close = () => { drawer.classList.remove("open"); overlay.classList.remove("open"); document.body.style.overflow = ""; };

  hamburger.addEventListener("click",  open);
  overlay.addEventListener("click",   close);
  if (closeBtn) closeBtn.addEventListener("click", close);
  drawer.querySelectorAll(".mobile-nav-link, .btn").forEach(l => l.addEventListener("click", close));
}

/* ── Navbar Scroll ── */
function initNavScroll() {
  const header = document.getElementById("siteHeader");
  if (!header) return;
  const check = () => header.classList.toggle("scrolled", window.scrollY > 60);
  check();
  window.addEventListener("scroll", check, { passive: true });
}

/* ── Scroll Reveal ── */
function initScrollReveal() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach(el => el.classList.add("revealed"));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("revealed");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.10 });

  document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
}

/* ── Toast ── */
function showToast(msg, type = "info") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type === "success" ? "toast-success" : type === "error" ? "toast-error" : ""}`;
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
  toast.innerHTML = `<span style="font-weight:800;font-size:1.1rem;">${icon}</span><span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/* ── HTML Escape ── */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ── Auth Helpers ── */
function getAuthToken() {
  return localStorage.getItem("sky_auth_token");
}

function getAuthHeaders() {
  const token = getAuthToken();
  if (!token) return { "Content-Type": "application/json" };
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  };
}

function setAuth(token, user) {
  localStorage.setItem("sky_auth_token", token);
  localStorage.setItem("sky_auth_user", JSON.stringify(user));
  currentUser = user;
}

function clearAuth() {
  localStorage.removeItem("sky_auth_token");
  localStorage.removeItem("sky_auth_user");
  currentUser = null;
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem("sky_auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function isLoggedIn() {
  return !!getAuthToken();
}

function isAdmin() {
  const user = getStoredUser();
  return user && user.role === "admin";
}

/* ── Auth Tracker in Header ── */
async function initAuthTracker() {
  const loginLinks = document.querySelectorAll(".nav-login-btn, .mobile-nav-login-btn");
  if (loginLinks.length === 0) return;

  const token = getAuthToken();
  if (!token) {
    currentUser = null;
    loginLinks.forEach(link => {
      link.textContent = "LOGIN";
      link.href = "login.html";
      link.onclick = null;
    });
    return;
  }

  // Verify token with backend
  try {
    // Use apiFetch if available (loaded from api-config.js), else fall back to fetch with /api
    const fetchFn = (typeof window.apiFetch === 'function') ? window.apiFetch : null;
    const resp = fetchFn
      ? await fetchFn("/auth/me", { headers: { "Authorization": "Bearer " + token } })
      : await fetch((window.API_BASE_URL || window.API_BASE || "http://localhost:5000/api") + "/auth/me", { headers: { "Authorization": "Bearer " + token } });

    if (!resp.ok) {
      clearAuth();
      loginLinks.forEach(link => {
        link.textContent = "LOGIN";
        link.href = "login.html";
        link.onclick = null;
      });
      return;
    }

    const data = await resp.json();
    currentUser = data.user;
    localStorage.setItem("sky_auth_user", JSON.stringify(data.user));

    loginLinks.forEach(link => {
      if (data.user.role === "admin") {
        link.innerHTML = `<span>🛡️ Admin Portal</span>`;
        link.href = "admin-dashboard.html";
        link.onclick = null;
      } else {
        const displayName = data.user.name ? data.user.name.split(" ")[0] : data.user.email.split("@")[0];
        link.innerHTML = `<span>👤 Hi, ${escapeHtml(displayName)}</span>`;
        link.href = "#";
        link.onclick = (e) => {
          e.preventDefault();
          if (confirm(`Signed in as ${data.user.name || data.user.email}.\n\nDo you want to sign out?`)) {
            clearAuth();
            showToast("Signed out successfully", "info");
            window.location.reload();
          }
        };
      }
    });
  } catch (err) {
    console.warn("Auth check failed:", err);
    clearAuth();
  }
}


/* ── Format Date ── */
function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return "";
  }
}

/* ── Global WhatsApp Contact Trigger ── */
let _cachedWaNumber = null;

async function getAdminWhatsAppNumber() {
  if (_cachedWaNumber) return _cachedWaNumber;
  try {
    const fetchFn = (typeof window.apiFetch === 'function') ? window.apiFetch : null;
    const resp = fetchFn
      ? await fetchFn('/contact')
      : await fetch((window.API_BASE_URL || window.API_BASE || 'http://localhost:5000/api') + '/contact');
    const data = await resp.json();
    if (data.success && data.contact && data.contact.whatsapp) {
      _cachedWaNumber = data.contact.whatsapp.trim().replace(/\D/g, '');
      return _cachedWaNumber;
    }
  } catch (err) {
    console.warn('Could not fetch WhatsApp contact:', err);
  }
  return '';
}

async function openSkyContactWhatsApp() {
  const waNumber = await getAdminWhatsAppNumber();
  if (!waNumber) {
    const msg = window.SKY_i18n ? window.SKY_i18n.t('contact_not_set') : 'Contact number is not configured yet.';
    if (typeof showToast === 'function') {
      showToast(msg, 'info');
    } else {
      alert(msg);
    }
    return;
  }
  const text = encodeURIComponent('Hello SKY DJ & EVENT MANAGEMENT, I am interested in your services!');
  window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank', 'noopener,noreferrer');
}

function initContactTriggers() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.contact-whatsapp-trigger, #topNavContactBtn, #mobileNavContactBtn');
    if (trigger) {
      if (trigger.id === 'whatsappContactBtn') return; // Handled specifically by section button
      e.preventDefault();
      openSkyContactWhatsApp();
    }
  });
}

// Make functions available globally for inline scripts and other modules
window.escapeHtml = escapeHtml;
window.showToast = showToast;
window.getAuthToken = getAuthToken;
window.getAuthHeaders = getAuthHeaders;
window.setAuth = setAuth;
window.clearAuth = clearAuth;
window.getStoredUser = getStoredUser;
window.isLoggedIn = isLoggedIn;
window.isAdmin = isAdmin;
window.formatDate = formatDate;
window.initScrollReveal = initScrollReveal;
window.openSkyContactWhatsApp = openSkyContactWhatsApp;
window.getAdminWhatsAppNumber = getAdminWhatsAppNumber;
