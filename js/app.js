/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT — SHARED APP MODULE (app.js)
   Navbar, Mobile drawer, Toast, Scroll reveal, Business info & Client auth tracking
   ========================================================================== */

import { 
  db, 
  auth, 
  doc, 
  getDoc, 
  isFirebaseConfigured,
  onAuthStateChanged,
  signOut,
  checkUserIsAdmin
} from "./firebase-config.js";

export let businessSettings = null;
export let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initNavScroll();
  initScrollReveal();
  loadBusinessInformation();
  initAuthTracker();
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
export function initScrollReveal() {
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
export function showToast(msg, type = "info") {
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
export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ── Business Information ── */
export async function loadBusinessInformation() {
  if (!isFirebaseConfigured() || !db) {
    applyInfo({ businessName: "SKY DJ & EVENT MANAGEMENT", tagline: "DJ • Sound • Lighting • Stage • Events" });
    return null;
  }

  try {
    const snap = await getDoc(doc(db, "businessSettings", "main"));
    if (snap.exists()) {
      businessSettings = snap.data();
      applyInfo(businessSettings);
      return businessSettings;
    } else {
      applyInfo({ businessName: "SKY DJ & EVENT MANAGEMENT", tagline: "DJ • Sound • Lighting • Stage • Events" });
      return null;
    }
  } catch (err) {
    console.warn("businessSettings:", err.message);
    applyInfo({ businessName: "SKY DJ & EVENT MANAGEMENT", tagline: "DJ • Sound • Lighting • Stage • Events" });
    return null;
  }
}

function applyInfo(info) {
  if (!info) return;

  // Business name
  document.querySelectorAll(".dyn-business-name").forEach(el => {
    el.textContent = info.businessName || "SKY DJ & EVENT MANAGEMENT";
  });

  // Tagline
  document.querySelectorAll(".dyn-business-tagline").forEach(el => {
    el.textContent = info.tagline || "DJ • Sound • Lighting • Stage • Events";
  });

  // Description
  document.querySelectorAll(".dyn-business-desc").forEach(el => {
    if (info.description) {
      el.textContent = info.description;
      el.style.display = "";
    } else {
      el.style.display = "none";
    }
  });

  // WhatsApp
  const waNum = (info.whatsapp || "").replace(/[^0-9]/g, "");
  const waText = encodeURIComponent(`Hello ${info.businessName || "SKY DJ & EVENT MANAGEMENT"}, I would like to enquire about your event services and rental equipment.`);
  const waHref = waNum ? `https://wa.me/${waNum}?text=${waText}` : "#";

  document.querySelectorAll(".dyn-whatsapp-btn").forEach(btn => {
    if (waNum) {
      btn.href = waHref;
      btn.style.display = btn.tagName === "A" ? "inline-flex" : "";
    } else {
      btn.style.display = "none";
    }
  });

  // Socials
  if (info.instagram) {
    document.querySelectorAll(".dyn-instagram").forEach(el => {
      el.href = info.instagram.startsWith("http") ? info.instagram : `https://${info.instagram}`;
      el.style.display = "inline-flex";
    });
  }
}

/* ── Auth Tracker in Header ── */
function initAuthTracker() {
  if (!auth) return;

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    const loginLinks = document.querySelectorAll(".nav-login-btn, .mobile-nav-login-btn");

    for (const link of loginLinks) {
      if (user) {
        const isAdmin = await checkUserIsAdmin(user);
        if (isAdmin) {
          link.innerHTML = `<span>🛡️ Admin Portal</span>`;
          link.href = "admin-dashboard.html";
        } else {
          const displayName = user.displayName ? user.displayName.split(" ")[0] : (user.email ? user.email.split("@")[0] : "Client");
          link.innerHTML = `<span>👤 Hi, ${escapeHtml(displayName)}</span>`;
          link.href = "#";
          link.onclick = (e) => {
            e.preventDefault();
            if (confirm(`Signed in as ${user.displayName || user.email}.\n\nDo you want to sign out?`)) {
              signOut(auth).then(() => {
                showToast("Signed out successfully", "info");
                window.location.reload();
              });
            }
          };
        }
      } else {
        link.textContent = "LOGIN";
        link.href = "login.html";
        link.onclick = null;
      }
    }
  });
}
