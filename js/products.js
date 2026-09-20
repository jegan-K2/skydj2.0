/* ==========================================================================
   products.js — Equipment Rental Catalogue (Customer Side)
   Real Firestore items/equipment, search, category filter, clean empty state
   ========================================================================== */

import { db, collection, getDocs, query, orderBy, where, isFirebaseConfigured, formatPrice } from "./firebase-config.js";
import { escapeHtml } from "./app.js";

let allProductsCache = [];
let activeCategory = "all";

document.addEventListener("DOMContentLoaded", () => {
  const gridFull = document.getElementById("fullProductsGrid");
  if (gridFull) {
    loadCategoryChips();
    loadAllProducts(gridFull);
    initSearch();
  }
});

/* ── Load Dynamic Category Filter Chips ── */
async function loadCategoryChips() {
  const container = document.getElementById("categoryChips");
  if (!container || !db || !isFirebaseConfigured()) return;

  try {
    const snap = await getDocs(query(collection(db, "categories"), orderBy("name")));
    if (snap.empty) return;

    let html = `<button class="chip-btn active" data-category="all">All Items</button>`;
    snap.forEach(d => {
      const cat = d.data();
      html += `<button class="chip-btn" data-category="${escapeHtml(d.id)}">${escapeHtml(cat.name)}</button>`;
    });

    container.innerHTML = html;

    // Attach click events
    container.querySelectorAll(".chip-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".chip-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeCategory = btn.getAttribute("data-category");
        filterAndRenderProducts();
      });
    });

  } catch (err) {
    console.warn("Could not load categories chips:", err);
  }
}

/* ── Load Real Equipment From Firestore ── */
export async function loadAllProducts(container) {
  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
      <div class="spinner" style="margin: 0 auto 16px auto;"></div>
      Loading equipment catalogue...
    </div>
  `;

  if (!isFirebaseConfigured() || !db) {
    container.innerHTML = emptyStateHTML("No equipment available at the moment.");
    return;
  }

  try {
    let snap = await getDocs(query(collection(db, "equipment"), orderBy("createdAt", "desc")));
    if (snap.empty) {
      snap = await getDocs(query(collection(db, "items"), orderBy("createdAt", "desc")));
    }

    if (snap.empty) {
      container.innerHTML = emptyStateHTML("No equipment available at the moment.");
      return;
    }

    allProductsCache = [];
    snap.forEach(d => {
      allProductsCache.push({ id: d.id, ...d.data() });
    });

    filterAndRenderProducts();

  } catch (err) {
    console.error("loadAllProducts error:", err);
    container.innerHTML = emptyStateHTML("No equipment available at the moment.");
  }
}

function initSearch() {
  const searchInput = document.getElementById("productSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      filterAndRenderProducts();
    });
  }
}

function filterAndRenderProducts() {
  const container = document.getElementById("fullProductsGrid");
  const searchInput = document.getElementById("productSearch");
  const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : "";

  if (!container) return;

  const filtered = allProductsCache.filter(item => {
    // Category match
    const matchCat = activeCategory === "all" || item.categoryId === activeCategory || (item.categoryName && item.categoryName.toLowerCase() === activeCategory.toLowerCase());
    if (!matchCat) return false;

    // Search query match
    if (searchVal) {
      const matchName = (item.name || "").toLowerCase().includes(searchVal);
      const matchDesc = (item.description || "").toLowerCase().includes(searchVal);
      const matchCatName = (item.categoryName || "").toLowerCase().includes(searchVal);
      return matchName || matchDesc || matchCatName;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = emptyStateHTML("No equipment available at the moment.");
    return;
  }

  container.innerHTML = "";
  filtered.forEach(p => container.appendChild(buildProductCard(p)));
}

/* ── Build Single Equipment Card ── */
function buildProductCard(p) {
  const card = document.createElement("div");
  card.className = "card reveal revealed";
  card.style.cssText = "display:flex; flex-direction:column; justify-content:space-between;";

  const avail = p.availability || "available";
  const statusClass = avail === "rented" ? "badge-rented" : avail === "available" ? "badge-available" : "badge-limited";
  const statusLabel = avail === "rented" ? "Rented Out" : avail === "available" ? "Available" : "Limited";
  const priceFormatted = formatPrice(p.price, p.priceType);
  const imgSrc = p.imageUrl || (p.images && p.images[0]) || "";
  const catName = p.categoryName || "Equipment";

  card.innerHTML = `
    <div>
      <div class="card-media">
        ${imgSrc
          ? `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(p.name)}" loading="lazy">`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-dim);font-size:3rem;background:#0d0e14;">🎛</div>`
        }
        <span class="card-badge ${statusClass}">${statusLabel}</span>
      </div>

      <div class="card-body">
        <span class="card-category">${escapeHtml(catName)}</span>
        <h3 class="card-title">${escapeHtml(p.name)}</h3>
        ${p.description ? `<p class="card-desc">${escapeHtml(p.description)}</p>` : ''}
        
        ${Array.isArray(p.features) && p.features.length > 0 ? `
          <ul class="card-features" style="margin-top:12px; font-size:0.84rem; color:var(--text-muted); list-style:none;">
            ${p.features.slice(0, 3).map(f => `<li style="display:flex; gap:6px; margin-bottom:4px;"><span style="color:var(--gold-primary);">✓</span> ${escapeHtml(f)}</li>`).join("")}
          </ul>
        ` : ''}
      </div>
    </div>

    <div class="card-footer" style="margin-top:20px; padding:16px 20px; border-top:1px solid rgba(212,160,23,0.1); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
      <div>
        <span class="card-price-label" style="font-size:0.75rem; color:var(--text-dim); text-transform:uppercase; display:block;">Rate</span>
        <span class="card-price" style="font-weight:700; color:var(--gold-bright); font-size:1.05rem;">${priceFormatted}</span>
      </div>
      <a href="enquiry.html?item=${encodeURIComponent(p.name)}" class="btn btn-gold btn-sm">
        Request Quote →
      </a>
    </div>
  `;

  return card;
}

function emptyStateHTML(message = "No equipment available at the moment.") {
  return `
    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; border: 1px dashed rgba(212,160,23,0.25); border-radius: var(--r-lg); background: rgba(0,0,0,0.3); max-width: 500px; margin: 40px auto;">
      <div style="font-size: 2.4rem; margin-bottom: 12px;">🎛</div>
      <h3 style="font-family: var(--font-display); color: var(--gold-bright); font-size: 1.25rem; margin-bottom: 8px;">
        ${escapeHtml(message)}
      </h3>
      <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px;">
        The business owner will add real sound systems and event gear from the admin portal.
      </p>
      <a href="enquiry.html" class="btn btn-outline-gold btn-sm">Request a Custom Quotation</a>
    </div>
  `;
}
