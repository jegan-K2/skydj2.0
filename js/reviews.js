/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT - REVIEWS MODULE (reviews.js)
   Approved reviews display, star calculation, submission with status='pending'
   ========================================================================== */

import { 
  db, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  formatDate,
  isFirebaseConfigured 
} from "./firebase-config.js";
import { escapeHtml, showToast } from "./app.js";

document.addEventListener("DOMContentLoaded", () => {
  initReviewsPage();
});

function initReviewsPage() {
  loadApprovedReviews();
  initReviewForm();
}

async function loadApprovedReviews() {
  const container = document.getElementById("reviewsList");
  const avgRatingEl = document.getElementById("avgRatingNumber");
  const avgStarsEl = document.getElementById("avgRatingStars");
  const totalCountEl = document.getElementById("totalReviewsCount");

  if (!container) return;

  container.innerHTML = `
    <div class="spinner-container" style="grid-column: 1 / -1;">
      <div class="spinner"></div>
      <p style="color: var(--text-muted); font-size: 0.95rem;">Loading verified reviews...</p>
    </div>
  `;

  if (!isFirebaseConfigured() || !db) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">⭐</div>
        <h3 class="empty-title">No approved reviews yet</h3>
        <p class="empty-desc">Be the first to share your experience with SKY DJ & EVENT MANAGEMENT!</p>
      </div>
    `;
    if (avgRatingEl) avgRatingEl.textContent = "0.0";
    if (totalCountEl) totalCountEl.textContent = "0 reviews";
    return;
  }

  try {
    const q = query(
      collection(db, "reviews"), 
      where("status", "==", "approved"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">⭐</div>
          <h3 class="empty-title">No approved reviews yet</h3>
          <p class="empty-desc">Customer testimonials will appear here once approved by our team.</p>
        </div>
      `;
      if (avgRatingEl) avgRatingEl.textContent = "0.0";
      if (avgStarsEl) avgStarsEl.innerHTML = renderStars(0);
      if (totalCountEl) totalCountEl.textContent = "0 verified reviews";
      return;
    }

    const reviews = [];
    let sumRating = 0;

    snap.forEach(doc => {
      const data = doc.data();
      const rating = Number(data.rating) || 5;
      sumRating += rating;
      reviews.push({ id: doc.id, ...data, rating });
    });

    const avg = (sumRating / reviews.length).toFixed(1);
    if (avgRatingEl) avgRatingEl.textContent = avg;
    if (avgStarsEl) avgStarsEl.innerHTML = renderStars(Math.round(avg));
    if (totalCountEl) totalCountEl.textContent = `Based on ${reviews.length} verified review${reviews.length === 1 ? '' : 's'}`;

    container.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <div>
            <h4 class="review-author">${escapeHtml(r.customerName)}</h4>
            <span class="review-date">${formatDate(r.createdAt || r.date)}</span>
          </div>
          <div class="star-rating">${renderStars(r.rating)}</div>
        </div>
        ${r.eventType ? `<span class="review-event">${escapeHtml(r.eventType)}</span>` : ''}
        <p class="review-comment">"${escapeHtml(r.comment)}"</p>
      </div>
    `).join("");

  } catch (err) {
    console.error("Error loading reviews:", err);
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">⭐</div>
        <h3 class="empty-title">No approved reviews yet</h3>
        <p class="empty-desc">Submit your event experience using the form below!</p>
      </div>
    `;
    if (avgRatingEl) avgRatingEl.textContent = "0.0";
    if (totalCountEl) totalCountEl.textContent = "0 reviews";
  }
}

function initReviewForm() {
  const form = document.getElementById("reviewSubmissionForm");
  if (!form) return;

  // Star selector logic
  const starInputs = form.querySelectorAll(".star-select-btn");
  let selectedRating = 5;

  starInputs.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedRating = parseInt(btn.getAttribute("data-val"), 10);
      updateStarUI(starInputs, selectedRating);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.customerName.value.trim();
    const eventType = form.eventType.value.trim();
    const comment = form.comment.value.trim();
    const submitBtn = form.querySelector("button[type='submit']");

    if (!name || !comment) {
      showToast("Please enter your name and comments.", "error");
      return;
    }

    if (!isFirebaseConfigured() || !db) {
      showToast("Firebase is not connected yet. Please configure Firebase to submit reviews.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      await addDoc(collection(db, "reviews"), {
        customerName: name,
        rating: selectedRating,
        eventType: eventType || "Event",
        comment: comment,
        status: "pending", // strictly pending until owner approval
        createdAt: serverTimestamp()
      });

      form.reset();
      updateStarUI(starInputs, 5);
      selectedRating = 5;

      showToast("Thank you! Your review has been submitted for verification.", "success");
      
      const successNotice = document.getElementById("reviewSuccessNotice");
      if (successNotice) {
        successNotice.style.display = "block";
        setTimeout(() => successNotice.style.display = "none", 8000);
      }

    } catch (err) {
      console.error("Failed to submit review:", err);
      showToast("Failed to submit review: " + err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Review";
    }
  });
}

function updateStarUI(buttons, rating) {
  buttons.forEach(btn => {
    const val = parseInt(btn.getAttribute("data-val"), 10);
    if (val <= rating) {
      btn.style.color = "var(--accent-gold)";
    } else {
      btn.style.color = "var(--text-dim)";
    }
  });
}

function renderStars(count) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars += i <= count ? "★" : "☆";
  }
  return stars;
}
