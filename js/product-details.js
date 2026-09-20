/* ==========================================================================
   product-details.js — Single Product Detail Page
   ========================================================================== */

import { db, doc, getDoc, isFirebaseConfigured } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const pid = new URLSearchParams(window.location.search).get("id");

  const detailsSection = document.getElementById("productDetailsSection");

  if (!pid) {
    detailsSection.innerHTML = notFound("No product ID specified.");
    return;
  }

  if (!isFirebaseConfigured() || !db) {
    detailsSection.innerHTML = notFound("Firebase is not configured. Set up credentials first.");
    return;
  }

  detailsSection.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div><span class="spinner-text">Loading product details…</span></div>`;

  try {
    const snap = await getDoc(doc(db, "products", pid));

    if (!snap.exists()) {
      detailsSection.innerHTML = notFound("Product not found. It may have been removed.");
      return;
    }

    const p = { id: snap.id, ...snap.data() };
    renderProductDetails(p, detailsSection);

  } catch (err) {
    console.error("product-details:", err);
    detailsSection.innerHTML = notFound(err.message);
  }
});

function renderProductDetails(p, container) {
  const images   = p.images && p.images.length > 0 ? p.images : [];
  const mainImg  = images[0] || "";
  const price    = p.price ? `₹${Number(p.price).toLocaleString("en-IN")}` : "Price on Request";
  const priceType = p.priceType || "per day";

  const statusCls = p.status === "rented" ? "badge-rented" : p.stock > 0 ? "badge-available" : "badge-limited";
  const statusLbl = p.status === "rented" ? "Rented Out" : p.stock > 0 ? "Available" : "Limited Stock";

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;" class="product-detail-grid">
      <!-- Image Gallery -->
      <div>
        <div id="mainImgWrap" style="border-radius:var(--r-lg);overflow:hidden;height:380px;background:var(--black-surface);border:1px solid rgba(212,160,23,0.1);">
          ${mainImg
            ? `<img id="mainImg" src="${mainImg}" alt="${escHtml(p.name)}" style="width:100%;height:100%;object-fit:cover;">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem;color:var(--text-dim);">🎛</div>`
          }
        </div>
        ${images.length > 1 ? `
        <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
          ${images.map((img, i) => `
            <div onclick="document.getElementById('mainImg').src='${img}'" 
                 style="width:72px;height:72px;border-radius:var(--r-sm);overflow:hidden;cursor:pointer;border:2px solid ${i===0?'rgba(212,160,23,0.5)':'rgba(212,160,23,0.1)'};transition:border-color 0.2s;"
                 onmouseover="this.style.borderColor='rgba(212,160,23,0.5)'" onmouseout="this.style.borderColor='rgba(212,160,23,0.1)'">
              <img src="${img}" alt="Photo ${i+1}" style="width:100%;height:100%;object-fit:cover;">
            </div>
          `).join("")}
        </div>
        ` : ""}
      </div>

      <!-- Details -->
      <div>
        ${p.category ? `<span class="section-eyebrow" style="margin-bottom:12px;">${escHtml(p.category)}</span>` : ""}
        <h1 style="font-size:2rem;margin-bottom:14px;">${escHtml(p.name)}</h1>
        <span class="status-pill ${statusCls}" style="margin-bottom:20px;display:inline-block;">${statusLbl}</span>

        ${p.description ? `
          <p style="color:var(--text-muted);line-height:1.75;margin-bottom:24px;">${escHtml(p.description)}</p>
        ` : ""}

        ${p.specifications ? `
          <h3 style="font-size:1rem;margin-bottom:12px;color:var(--gold-primary);">Specifications</h3>
          <div style="background:var(--black-card);border:1px solid rgba(212,160,23,0.1);border-radius:var(--r-md);padding:18px;margin-bottom:24px;">
            ${p.specifications.split("\n").map(l => l.trim() ? `<p style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);color:var(--text-muted);font-size:0.9rem;">${escHtml(l)}</p>` : "").join("")}
          </div>
        ` : ""}

        <!-- Price -->
        <div style="background:rgba(212,160,23,0.06);border:1px solid rgba(212,160,23,0.15);border-radius:var(--r-md);padding:20px;margin-bottom:24px;">
          <div class="price-label" style="margin-bottom:4px;">Rental Rate</div>
          <div class="price-value" style="font-size:2rem;">${price}</div>
          <div class="price-type">${priceType}</div>
        </div>

        ${p.stock ? `<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:20px;">🔢 Quantity Available: <strong style="color:var(--text-cream);">${p.stock}</strong></p>` : ""}

        <div style="display:flex;flex-direction:column;gap:12px;">
          <a href="enquiry.html?product=${encodeURIComponent(p.name)}" class="btn btn-gold btn-lg">Book This Equipment</a>
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
