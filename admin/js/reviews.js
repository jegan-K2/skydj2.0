/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT - REVIEWS MODERATION (reviews.js)
   Moderate customer reviews: Pending, Approved, Rejected states
   ========================================================================== */

import { 
  db, 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  formatDate, 
  isFirebaseConfigured 
} from "../../js/firebase-config.js";
import { escapeHtml } from "../../js/app.js";

let allReviews = [];
let activeTab = "pending";

document.addEventListener("DOMContentLoaded", () => {
  initReviewTabs();
  loadReviews();
});

function initReviewTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeTab = btn.getAttribute("data-tab");
      renderFilteredReviews();
    });
  });
}

async function loadReviews() {
  const tbody = document.getElementById("reviewsTableBody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
        Loading customer reviews...
      </td>
    </tr>
  `;

  if (!isFirebaseConfigured() || !db) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
          No reviews available. Connect Firebase to moderate customer reviews.
        </td>
      </tr>
    `;
    return;
  }

  try {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    allReviews = [];
    let pendingCount = 0;

    snap.forEach(d => {
      const r = d.data();
      allReviews.push({ id: d.id, ...r });
      if (r.status === "pending") pendingCount++;
    });

    const badge = document.getElementById("pendingTabBadge");
    if (badge) badge.textContent = pendingCount;

    renderFilteredReviews();

  } catch (err) {
    console.error("Error loading reviews:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 24px; color: #ef4444;">
          Failed to load reviews: ${escapeHtml(err.message)}
        </td>
      </tr>
    `;
  }
}

function renderFilteredReviews() {
  const tbody = document.getElementById("reviewsTableBody");
  if (!tbody) return;

  const filtered = allReviews.filter(r => (r.status || "pending") === activeTab);

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);">
          No ${activeTab} reviews at this time.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const rating = Number(r.rating) || 5;
    let stars = "";
    for (let i = 1; i <= 5; i++) stars += i <= rating ? "★" : "☆";

    const statusPillClass = r.status === "approved" ? "status-approved" : r.status === "rejected" ? "status-rejected" : "status-pending";

    return `
      <tr>
        <td><strong>${escapeHtml(r.customerName)}</strong></td>
        <td><span style="color: var(--accent-gold); font-size: 1.1rem;">${stars}</span> (${rating}/5)</td>
        <td>${escapeHtml(r.eventType || '—')}</td>
        <td style="max-width: 280px; font-size: 0.88rem;">${escapeHtml(r.comment)}</td>
        <td>${formatDate(r.createdAt || r.date)}</td>
        <td><span class="status-pill ${statusPillClass}">${(r.status || 'pending').toUpperCase()}</span></td>
        <td>
          <div class="action-buttons">
            ${r.status !== "approved" ? `
              <button class="btn btn-sm" style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16,185,129,0.3); padding: 4px 8px; font-size: 0.78rem;" onclick="window.updateReviewStatus('${r.id}', 'approved')">
                Approve
              </button>
            ` : ''}
            ${r.status !== "rejected" ? `
              <button class="btn btn-sm" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 4px 8px; font-size: 0.78rem;" onclick="window.updateReviewStatus('${r.id}', 'rejected')">
                Reject
              </button>
            ` : ''}
            <button class="btn-icon btn-delete" onclick="window.deleteReview('${r.id}')" title="Delete Review">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// Global actions
window.updateReviewStatus = async function(id, newStatus) {
  try {
    await updateDoc(doc(db, "reviews", id), {
      status: newStatus
    });
    loadReviews();
  } catch (err) {
    alert("Could not update review: " + err.message);
  }
};

window.deleteReview = async function(id) {
  if (!confirm("Are you sure you want to permanently delete this review?")) return;
  try {
    await deleteDoc(doc(db, "reviews", id));
    loadReviews();
  } catch (err) {
    alert("Could not delete review: " + err.message);
  }
};
