/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT - ENQUIRIES MODULE (enquiries.js)
   Customer enquiry pipeline: status workflow, details modal, WhatsApp direct chat
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

let allEnquiries = [];
let activeStatusFilter = "all";
let viewingEnquiry = null;

document.addEventListener("DOMContentLoaded", () => {
  loadEnquiries();
  initFilter();
  initDetailsModal();
});

function initFilter() {
  const select = document.getElementById("enquiryStatusFilter");
  if (select) {
    select.addEventListener("change", (e) => {
      activeStatusFilter = e.target.value;
      renderFilteredEnquiries();
    });
  }
}

async function loadEnquiries() {
  const tbody = document.getElementById("enquiriesTableBody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
        Loading customer enquiries...
      </td>
    </tr>
  `;

  if (!isFirebaseConfigured() || !db) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
          No enquiries found. Connect Firebase to receive event booking requests.
        </td>
      </tr>
    `;
    return;
  }

  try {
    const q = query(collection(db, "enquiries"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);">
            No customer enquiries received yet.
          </td>
        </tr>
      `;
      return;
    }

    allEnquiries = [];
    snap.forEach(d => {
      allEnquiries.push({ id: d.id, ...d.data() });
    });

    renderFilteredEnquiries();

  } catch (err) {
    console.error("Error loading enquiries:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 24px; color: #ef4444;">
          Failed to load enquiries: ${escapeHtml(err.message)}
        </td>
      </tr>
    `;
  }
}

function renderFilteredEnquiries() {
  const tbody = document.getElementById("enquiriesTableBody");
  if (!tbody) return;

  const filtered = allEnquiries.filter(e => {
    if (activeStatusFilter === "all") return true;
    return (e.status || "Pending").toLowerCase() === activeStatusFilter.toLowerCase();
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);">
          No enquiries matching filter "${activeStatusFilter}".
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(enq => {
    const status = enq.status || "Pending";
    const statusClass = getStatusBadgeClass(status);

    return `
      <tr>
        <td><strong>${escapeHtml(enq.name)}</strong></td>
        <td>
          <a href="tel:${escapeHtml(enq.phone.replace(/[^0-9+]/g, ''))}" style="color: var(--accent-gold);">
            ${escapeHtml(enq.phone)}
          </a>
        </td>
        <td>${escapeHtml(enq.eventType || 'Event')}</td>
        <td>${escapeHtml(enq.eventDate || '—')}</td>
        <td>${formatDate(enq.createdAt)}</td>
        <td><span class="status-pill ${statusClass}">${escapeHtml(status)}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-secondary btn-sm" onclick="window.openEnquiryDetails('${enq.id}')" style="padding: 4px 10px; font-size: 0.8rem;">
              View Details
            </button>
            <button class="btn-icon btn-delete" onclick="window.deleteEnquiry('${enq.id}')" title="Delete Enquiry">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function initDetailsModal() {
  const modal = document.getElementById("enquiryDetailsModal");
  const closeBtn = document.getElementById("enquiryModalClose");
  const updateBtn = document.getElementById("updateStatusBtn");

  if (!modal) return;

  const closeModal = () => modal.classList.remove("active");

  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  if (updateBtn) {
    updateBtn.addEventListener("click", async () => {
      if (!viewingEnquiry) return;
      const newStatus = document.getElementById("modalStatusSelect").value;
      
      updateBtn.disabled = true;
      updateBtn.textContent = "Updating...";

      try {
        await updateDoc(doc(db, "enquiries", viewingEnquiry.id), {
          status: newStatus
        });
        viewingEnquiry.status = newStatus;
        closeModal();
        loadEnquiries();
      } catch (err) {
        alert("Status update failed: " + err.message);
      } finally {
        updateBtn.disabled = false;
        updateBtn.textContent = "Save Status";
      }
    });
  }
}

window.openEnquiryDetails = function(id) {
  const enq = allEnquiries.find(e => e.id === id);
  if (!enq) return;

  viewingEnquiry = enq;
  const modal = document.getElementById("enquiryDetailsModal");
  const content = document.getElementById("enquiryModalDetailsContent");
  const statusSelect = document.getElementById("modalStatusSelect");

  if (!modal || !content) return;

  statusSelect.value = enq.status || "Pending";

  const cleanPhone = enq.phone ? enq.phone.replace(/[^0-9]/g, "") : "";
  const waUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${enq.name}, thank you for your enquiry with SKY DJ & EVENT MANAGEMENT regarding your ${enq.eventType || 'event'}.`)}`
    : "#";

  const services = Array.isArray(enq.requiredServices) && enq.requiredServices.length > 0 
    ? enq.requiredServices.join(", ") 
    : "None specified";

  const items = Array.isArray(enq.requiredItems) && enq.requiredItems.length > 0 
    ? enq.requiredItems.join(", ") 
    : "None specified";

  content.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
      <div>
        <label style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Customer Name</label>
        <p style="font-size: 1.1rem; font-weight: 700; color: #fff;">${escapeHtml(enq.name)}</p>
      </div>
      <div>
        <label style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Contact Channels</label>
        <p>
          <a href="tel:${cleanPhone}" style="color: var(--accent-gold); font-weight: 600;">📞 ${escapeHtml(enq.phone)}</a>
          ${cleanPhone ? ` | <a href="${waUrl}" target="_blank" rel="noopener" style="color: #25d366; font-weight: 600;">💬 WhatsApp</a>` : ''}
        </p>
        ${enq.email ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">✉️ ${escapeHtml(enq.email)}</p>` : ''}
      </div>
      <div>
        <label style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Event Type & Date</label>
        <p style="color: #fff; font-weight: 600;">${escapeHtml(enq.eventType || 'N/A')} on ${escapeHtml(enq.eventDate || 'N/A')}</p>
      </div>
      <div>
        <label style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Venue Location</label>
        <p style="color: #fff;">${escapeHtml(enq.eventLocation || 'N/A')}</p>
      </div>
    </div>

    <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-surface); border-radius: var(--radius-sm);">
      <label style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Requested Services</label>
      <p style="color: #fff; font-size: 0.95rem; margin-top: 4px;">${escapeHtml(services)}</p>
    </div>

    <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-surface); border-radius: var(--radius-sm);">
      <label style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Requested Rental Items</label>
      <p style="color: #fff; font-size: 0.95rem; margin-top: 4px;">${escapeHtml(items)}</p>
    </div>

    <div style="padding: 12px; background: var(--bg-surface); border-radius: var(--radius-sm);">
      <label style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Customer Message / Notes</label>
      <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 4px; line-height: 1.6;">${escapeHtml(enq.message || 'No additional message.')}</p>
    </div>
  `;

  modal.classList.add("active");
};

window.deleteEnquiry = async function(id) {
  if (!confirm("Are you sure you want to delete this enquiry record?")) return;
  try {
    await deleteDoc(doc(db, "enquiries", id));
    loadEnquiries();
  } catch (err) {
    alert("Could not delete enquiry: " + err.message);
  }
};

function getStatusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "pending") return "status-pending";
  if (s === "contacted") return "status-contacted";
  if (s === "confirmed" || s === "completed") return "status-confirmed";
  if (s === "cancelled") return "status-cancelled";
  return "status-pending";
}
