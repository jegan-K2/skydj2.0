/* ==========================================================================
   product-details.js — Single Equipment Detail Page
   Fetches from Express REST API
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const pid = new URLSearchParams(window.location.search).get("id");
  const detailsSection = document.getElementById("productDetailsSection");

  if (!pid) {
    detailsSection.innerHTML = notFound("No product ID specified.");
    return;
  }

  detailsSection.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div><span class="spinner-text">Loading product details…</span></div>`;

  try {
    const resp = await fetch(`/api/equipment/${pid}`);
    const data = await resp.json();

    if (!data.success || !data.data) {
      detailsSection.innerHTML = notFound("Product not found. It may have been removed.");
      return;
    }

    renderProductDetails(data.data, detailsSection);

  } catch (err) {
    console.error("product-details:", err);
    detailsSection.innerHTML = notFound(err.message);
  }
});

function renderProductDetails(p, container) {
  const imgSrc = p.imageUrl || "";

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;" class="product-detail-grid">
      <div>
        <div style="border-radius:var(--r-lg);overflow:hidden;height:380px;background:var(--black-surface);border:1px solid rgba(212,160,23,0.1);">
          ${imgSrc
            ? `<img src="${escHtml(imgSrc)}" alt="${escHtml(p.name)}" style="width:100%;height:100%;object-fit:cover;">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem;color:var(--text-dim);">🎛</div>`
          }
        </div>
      </div>

      <div>
        <h1 style="font-size:2rem;margin-bottom:14px;">${escHtml(p.name)}</h1>

        ${p.description ? `
          <p style="color:var(--text-muted);line-height:1.75;margin-bottom:24px;">${escHtml(p.description)}</p>
        ` : ""}

        <div style="display:flex;flex-direction:column;gap:12px;margin-top:24px;">
          <a href="enquiry.html?item=${encodeURIComponent(p.name)}" class="btn btn-gold btn-lg">Request Quote for This Equipment</a>
          <a href="products.html" class="btn btn-ghost btn-lg">← Back to Catalogue</a>
        </div>
      </div>
    </div>

    <style>
      @media (max-width: 768px) {
        .product-detail-grid { grid-template-columns: 1fr !important; }
      }
    </style>
  `;
}

function notFound(msg) {
  return `
    <div class="empty-state" style="max-width:480px;margin:60px auto;">
      <div class="empty-icon">🔍</div>
      <h3 class="empty-title">Product Not Found</h3>
      <p class="empty-desc">${escHtml(msg)}</p>
      <a href="products.html" class="btn btn-outline-gold">← Back to Catalogue</a>
    </div>
  `;
}

function escHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
