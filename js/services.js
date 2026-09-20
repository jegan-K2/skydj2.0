/* ==========================================================================
   services.js — Event Services (Customer Side)
   ========================================================================== */

import { db, collection, getDocs, query, orderBy, isFirebaseConfigured } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {
  const gridHome = document.getElementById("servicesGrid");
  if (gridHome) loadServicesHome(gridHome);

  const gridFull = document.getElementById("fullServicesGrid");
  if (gridFull)  loadAllServices(gridFull);
});

async function loadServicesHome(container) {
  container.innerHTML = spinnerHTML();

  if (!isFirebaseConfigured() || !db) {
    container.innerHTML = emptyStateHTML("🎵", "Configure Firebase", "Add Firebase credentials to display services.");
    return;
  }

  try {
    const q    = query(collection(db, "services"), orderBy("order"));
    const snap = await getDocs(q);

    const docs = snap.docs.slice(0, 6);
    if (docs.length === 0) {
      container.innerHTML = emptyStateHTML("🎵", "No Services Listed", "Services will appear here once added from the admin dashboard.");
      return;
    }

    container.innerHTML = "";
    docs.forEach(d => container.appendChild(buildServiceCard({ id: d.id, ...d.data() })));
    revealCards(container);
  } catch (err) {
    console.error("loadServicesHome:", err);
    container.innerHTML = emptyStateHTML("⚠️", "Could Not Load Services", err.message);
  }
}

async function loadAllServices(container) {
  container.innerHTML = spinnerHTML();

  if (!isFirebaseConfigured() || !db) {
    container.innerHTML = emptyStateHTML("🎵", "Configure Firebase", "Add Firebase credentials to display services.");
    return;
  }

  try {
    const q    = query(collection(db, "services"), orderBy("order"));
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = emptyStateHTML("🎵", "No Services Listed", "The admin hasn't added any services yet.");
      return;
    }

    container.innerHTML = "";
    snap.docs.forEach(d => container.appendChild(buildServiceCard({ id: d.id, ...d.data() }, true)));
    revealCards(container);
  } catch (err) {
    console.error("loadAllServices:", err);
    container.innerHTML = emptyStateHTML("⚠️", "Could Not Load Services", err.message);
  }
}

function buildServiceCard(s, detailed = false) {
  const card = document.createElement("div");
  card.className = "card reveal";
  card.style.cssText = "display:flex;flex-direction:column;";

  const img = (s.images && s.images[0]) ? s.images[0] : "";
  const price = s.price ? `₹${Number(s.price).toLocaleString("en-IN")}` : "";

  card.innerHTML = `
    ${img
      ? `<div class="card-media"><img src="${img}" alt="${escHtml(s.name)}" loading="lazy"></div>`
      : `<div style="background:rgba(212,160,23,0.07);padding:28px;text-align:center;font-size:3rem;">${s.icon || "🎵"}</div>`
    }
    <div class="card-content">
      <h3 class="card-title">${escHtml(s.name)}</h3>
      ${s.description ? `<p class="card-desc">${escHtml(s.description)}</p>` : ""}
      ${price ? `<div class="card-footer"><div><div class="price-label">Starting at</div><div class="price-value">${price}</div></div></div>` : ""}
      <div style="margin-top:auto;padding-top:16px;">
        <a href="enquiry.html?service=${encodeURIComponent(s.name)}" class="btn btn-gold btn-sm" style="width:100%;">Book This Service</a>
      </div>
    </div>
  `;
  return card;
}

function revealCards(container) {
  if (!("IntersectionObserver" in window)) {
    container.querySelectorAll(".reveal").forEach(el => el.classList.add("revealed"));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("revealed"); obs.unobserve(e.target); }});
  }, { threshold: 0.1 });
  container.querySelectorAll(".reveal").forEach(el => obs.observe(el));
}

function spinnerHTML(txt = "Loading services…") {
  return `<div class="spinner-wrap"><div class="spinner"></div><span class="spinner-text">${txt}</span></div>`;
}

function emptyStateHTML(icon, title, desc) {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><h3 class="empty-title">${title}</h3><p class="empty-desc">${desc}</p><a href="enquiry.html" class="btn btn-outline-gold">Send an Enquiry</a></div>`;
}

function escHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
