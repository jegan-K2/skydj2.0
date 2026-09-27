/* ==========================================================================
   products.js — Equipment Catalogue (Customer Side)
   Fetches equipment from Express REST API
   Depends on api-config.js (window.apiFetch, window.resolveUploadUrl)
   ========================================================================== */

let allProductsCache = [];

document.addEventListener("DOMContentLoaded", () => {
  const gridFull = document.getElementById("fullProductsGrid");
  if (gridFull) {
    loadAllProducts(gridFull);
    initSearch();
  }
});

/* ── Load Equipment From API ── */
async function loadAllProducts(container) {
  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
      <div class="spinner" style="margin: 0 auto 16px auto;"></div>
      Loading equipment catalogue...
    </div>
  `;

  try {
    const resp = await (typeof window.apiFetch === 'function'
      ? window.apiFetch("/equipment")
      : fetch((window.API_BASE_URL || window.API_BASE || "http://localhost:5000/api") + "/equipment"));
    const data = await resp.json();

    if (!data.success || !data.data || data.data.length === 0) {
      container.innerHTML = emptyStateHTML("No equipment available at the moment.");
      return;
    }

    allProductsCache = data.data;
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
    if (searchVal) {
      const matchName = (item.name || "").toLowerCase().includes(searchVal);
      const matchDesc = (item.description || "").toLowerCase().includes(searchVal);
      return matchName || matchDesc;
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

  const rawImg = p.imageUrl || "";
  const imgSrc = (typeof window.resolveUploadUrl === 'function')
    ? window.resolveUploadUrl(rawImg)
    : rawImg;

  card.innerHTML = `
    <div>
      <div class="card-media">
        ${imgSrc
          ? `<img src="${window.escapeHtml(imgSrc)}" alt="${window.escapeHtml(p.name)}" loading="lazy">`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-dim);font-size:3rem;background:#0d0e14;">🎛</div>`
        }
      </div>

      <div class="card-body">
        <h3 class="card-title">${window.escapeHtml(p.name)}</h3>
        ${p.description ? `<p class="card-desc">${window.escapeHtml(p.description)}</p>` : ''}
      </div>
    </div>

    <div class="card-footer" style="margin-top:20px; padding:16px 20px; border-top:1px solid rgba(212,160,23,0.1); display:flex; align-items:center; justify-content:flex-end;">
      <a href="enquiry.html?item=${encodeURIComponent(p.name)}" class="btn btn-gold btn-sm">
        Request Quote →
      </a>
    </div>
  `;

  return card;
}

function emptyStateHTML(message) {
  return `
    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; border: 1px dashed rgba(212,160,23,0.25); border-radius: var(--r-lg); background: rgba(0,0,0,0.3); max-width: 500px; margin: 40px auto;">
      <div style="font-size: 2.4rem; margin-bottom: 12px;">🎛</div>
      <h3 style="font-family: var(--font-display); color: var(--gold-bright); font-size: 1.25rem; margin-bottom: 8px;">
        ${window.escapeHtml(message)}
      </h3>
      <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px;">
        The business owner will add real sound systems and event gear from the admin portal.
      </p>
      <a href="enquiry.html" class="btn btn-outline-gold btn-sm">Request a Custom Quotation</a>
    </div>
  `;
}
