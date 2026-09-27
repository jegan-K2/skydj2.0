/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT - ADMIN UNIFIED DASHBOARD SCRIPT (dashboard.js)
   Single-page Tab Navigation, Equipment CRUD, Quotations,
   Reviews Moderation (with Event Photos) — All via REST API

   Depends on api-config.js (provides window.apiFetch and window.resolveUploadUrl)
   and app.js (provides auth helpers).
   ========================================================================== */

// Safe wrappers in case api-config.js is somehow not yet loaded
function _apiFetch(path, opts) {
  return (typeof window.apiFetch === 'function')
    ? window.apiFetch(path, opts)
    : fetch((window.API_BASE_URL || window.API_BASE || 'http://localhost:5000/api') + path, opts);
}
function _resolveUpload(url) {
  return (typeof window.resolveUploadUrl === 'function')
    ? window.resolveUploadUrl(url)
    : url;
}

// Global in-memory caches
let equipmentList = [];
let quotationsList = [];
let reviewsList = [];
let currentEditingEquipmentId = null;
let currentEquipmentImageUrl = "";
let activeReviewTab = "pending";

function getToken() {
  return localStorage.getItem("sky_auth_token") || "";
}

function authHeaders() {
  return { "Authorization": "Bearer " + getToken() };
}

function authJsonHeaders() {
  return { "Content-Type": "application/json", "Authorization": "Bearer " + getToken() };
}

function esc(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function fmtDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return ""; }
}

document.addEventListener("DOMContentLoaded", () => {
  initTabNavigation();
  loadAllAdminData();
  initEquipmentSection();
  initQuotationsSection();
  initReviewsSection();
  initContactSection();
});

/* ── Tab Switcher ── */
function initTabNavigation() {
  const navItems = document.querySelectorAll(".admin-sidebar-nav .admin-nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      const tab = item.getAttribute("data-tab");
      if (tab) {
        e.preventDefault();
        switchAdminTab(tab);
      }
    });
  });

  const hash = window.location.hash.replace("#", "");
  if (hash) {
    switchAdminTab(hash);
  }
}

window.switchAdminTab = function(tabName) {
  const views = document.querySelectorAll(".admin-tab-view");
  const navItems = document.querySelectorAll(".admin-sidebar-nav .admin-nav-item");

  let targetView = document.getElementById(`view-${tabName}`);
  if (!targetView) {
    tabName = "dashboard";
    targetView = document.getElementById("view-dashboard");
  }

  views.forEach(v => v.style.display = "none");
  if (targetView) targetView.style.display = "block";

  navItems.forEach(n => {
    if (n.getAttribute("data-tab") === tabName) {
      n.classList.add("active");
    } else {
      n.classList.remove("active");
    }
  });

  const headerTitle = document.getElementById("adminHeaderTitle");
  if (headerTitle) {
    const titles = {
      dashboard: "Dashboard Overview",
      equipment: "Equipment Management",
      quotations: "Quotation Requests",
      reviews: "Client Reviews Moderation",
      contact: "Contact Details",
      settings: "System Settings"
    };
    headerTitle.textContent = titles[tabName] || "Admin Portal";
  }

  const sidebar = document.querySelector(".admin-sidebar");
  if (sidebar) sidebar.classList.remove("open");
};

/* ── Master Data Loader ── */
async function loadAllAdminData() {
  await Promise.allSettled([
    loadDashboardStats(),
    loadEquipment(),
    loadQuotations(),
    loadReviews()
  ]);
}

/* ── 1. Dashboard Stats ── */
async function loadDashboardStats() {
  const statItems = document.getElementById("statTotalItems");
  const statPendingReviews = document.getElementById("statPendingReviews");
  const statTotalQuotations = document.getElementById("statTotalQuotations");
  const statPendingQuotations = document.getElementById("statPendingQuotations");

  try {
    // Equipment count
    const eqResp = await _apiFetch("/equipment");
    const eqData = await eqResp.json();
    if (statItems) statItems.textContent = eqData.success ? eqData.data.length : 0;

    // Reviews (all)
    const revResp = await _apiFetch("/reviews/all", { headers: authHeaders() });
    const revData = await revResp.json();
    let pendingRevCount = 0;
    if (revData.success && revData.data) {
      pendingRevCount = revData.data.filter(r => r.status === "pending").length;
    }
    if (statPendingReviews) statPendingReviews.textContent = pendingRevCount;
    const revBadge = document.getElementById("navPendingReviewsBadge");
    if (revBadge) {
      revBadge.textContent = pendingRevCount;
      revBadge.style.display = pendingRevCount > 0 ? "inline-block" : "none";
    }

    // Quotations
    const quotResp = await _apiFetch("/quotations", { headers: authHeaders() });
    const quotData = await quotResp.json();
    let totalQuot = 0, pendingQuot = 0;
    if (quotData.success && quotData.data) {
      totalQuot = quotData.data.length;
      pendingQuot = quotData.data.filter(q => (q.status || "pending") === "pending").length;
    }
    if (statTotalQuotations) statTotalQuotations.textContent = totalQuot;
    if (statPendingQuotations) statPendingQuotations.textContent = pendingQuot;
    const quotBadge = document.getElementById("navPendingQuotationsBadge");
    if (quotBadge) {
      quotBadge.textContent = pendingQuot;
      quotBadge.style.display = pendingQuot > 0 ? "inline-block" : "none";
    }

  } catch (err) {
    console.error("Dashboard stats error:", err);
  }
}

/* ── 2. Equipment Management ── */
async function loadEquipment() {
  const tbody = document.getElementById("equipmentTableBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:24px; color:var(--text-muted);">Loading equipment...</td></tr>`;

  try {
    const resp = await _apiFetch("/equipment");
    const data = await resp.json();

    if (!data.success || !data.data || data.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-muted);">No equipment added yet. Click "+ Add Equipment" to add real items.</td></tr>`;
      equipmentList = [];
      return;
    }

    equipmentList = data.data;

    tbody.innerHTML = equipmentList.map(item => {
      const thumbRaw = item.imageUrl || "";
      const thumb = _resolveUpload(thumbRaw);
      const desc = item.description ? item.description.substring(0, 80) + (item.description.length > 80 ? '...' : '') : '—';

      return `
        <tr>
          <td style="width:64px;">
            ${thumb ? `<img src="${esc(thumb)}" class="thumb-preview" alt="equipment photo">` : '<div class="thumb-preview" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;">📦</div>'}
          </td>
          <td><strong>${esc(item.name)}</strong></td>
          <td style="max-width:280px; font-size:0.88rem; color:var(--text-muted);">${esc(desc)}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon" onclick="window.openEditEquipmentModal('${item._id}')" title="Edit Equipment">✏️</button>
              <button class="btn-icon btn-delete" onclick="window.deleteEquipmentItem('${item._id}')" title="Delete Equipment">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    console.error("loadEquipment error:", err);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:24px; color:#ef4444;">Error loading equipment: ${esc(err.message)}</td></tr>`;
  }
}

function initEquipmentSection() {
  const openBtn = document.getElementById("addEquipmentBtn");
  const modal = document.getElementById("equipmentModal");
  const closeBtn = document.getElementById("equipmentModalClose");
  const cancelBtn = document.getElementById("equipmentModalCancel");
  const form = document.getElementById("equipmentForm");

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      currentEditingEquipmentId = null;
      currentEquipmentImageUrl = "";
      form.reset();
      renderEquipmentImagePreviews();
      document.getElementById("equipmentModalTitle").textContent = "ADD EQUIPMENT";
      const saveBtn = document.getElementById("saveEquipmentBtn");
      if (saveBtn) saveBtn.textContent = "ADD EQUIPMENT";
      modal.classList.add("active");
    });
  }

  const closeModal = () => {
    modal.classList.remove("active");
    form.reset();
    currentEditingEquipmentId = null;
    currentEquipmentImageUrl = "";
    renderEquipmentImagePreviews();
  };

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById("saveEquipmentBtn");
      saveBtn.disabled = true;
      saveBtn.textContent = "Uploading & Saving...";

      try {
        const name = form.name.value.trim();
        const description = form.description.value.trim();

        if (!name || !description) {
          throw new Error("Please enter equipment name and description.");
        }

        const imgInput = document.getElementById("equipmentImageInput");
        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);

        if (imgInput && imgInput.files && imgInput.files.length > 0) {
          const file = imgInput.files[0];
          if (!file.type.startsWith("image/")) {
            throw new Error("Please select an image file (JPG, PNG, WEBP).");
          }
          if (file.size > 5 * 1024 * 1024) {
            throw new Error("Image size must be less than 5MB.");
          }
          formData.append("image", file);
        } else if (!currentEditingEquipmentId) {
          throw new Error("Please choose an equipment image.");
        }

        let apiPath = "/equipment";
        let method = "POST";
        if (currentEditingEquipmentId) {
          apiPath = `/equipment/${currentEditingEquipmentId}`;
          method = "PUT";
        }

        const resp = await _apiFetch(apiPath, {
          method,
          headers: authHeaders(),
          body: formData
        });

        const data = await resp.json();
        if (!data.success) throw new Error(data.message || "Failed to save equipment.");

        closeModal();
        loadEquipment();
        loadDashboardStats();
      } catch (err) {
        alert("Could not save equipment: " + err.message);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = currentEditingEquipmentId ? "SAVE EQUIPMENT" : "ADD EQUIPMENT";
      }
    });
  }
}

function renderEquipmentImagePreviews() {
  const container = document.getElementById("equipmentImagePreviews");
  if (!container) return;

  if (!currentEquipmentImageUrl) {
    container.innerHTML = `<span style="font-size:0.8rem; color:var(--text-dim);">No image selected yet.</span>`;
    return;
  }

  container.innerHTML = `
    <div style="position:relative; display:inline-block; margin-top:8px;">
      <img src="${esc(currentEquipmentImageUrl)}" alt="preview" style="width:100px; height:100px; object-fit:cover; border-radius:8px; border:1px solid var(--gold-primary);">
      <button type="button" onclick="window.removeEquipmentImage()" title="Remove image" style="position:absolute; top:-6px; right:-6px; background:#ef4444; color:#fff; border:none; border-radius:50%; width:22px; height:22px; cursor:pointer; font-weight:bold;">&times;</button>
    </div>
  `;
}

window.removeEquipmentImage = function() {
  currentEquipmentImageUrl = "";
  renderEquipmentImagePreviews();
};

window.openEditEquipmentModal = function(id) {
  const item = equipmentList.find(e => e._id === id);
  if (!item) return;

  currentEditingEquipmentId = id;
  currentEquipmentImageUrl = _resolveUpload(item.imageUrl || "");

  const modal = document.getElementById("equipmentModal");
  const form = document.getElementById("equipmentForm");

  form.name.value = item.name || "";
  form.description.value = item.description || "";

  renderEquipmentImagePreviews();
  document.getElementById("equipmentModalTitle").textContent = "EDIT EQUIPMENT";
  const saveBtn = document.getElementById("saveEquipmentBtn");
  if (saveBtn) saveBtn.textContent = "SAVE EQUIPMENT";
  modal.classList.add("active");
};

window.deleteEquipmentItem = async function(id) {
  if (!confirm("Are you sure you want to delete this equipment item permanently?")) return;
  try {
    const resp = await _apiFetch(`/equipment/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });
    const data = await resp.json();
    if (!data.success) throw new Error(data.message);
    loadEquipment();
    loadDashboardStats();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
};

/* ── 3. Quotations Management ── */
async function loadQuotations() {
  const tbody = document.getElementById("quotationsTableBody");
  const recentTbody = document.getElementById("recentQuotationsTableBody");
  if (!tbody) return;

  try {
    const resp = await _apiFetch("/quotations", { headers: authHeaders() });
    const data = await resp.json();

    quotationsList = data.success && data.data ? data.data : [];

    renderQuotationsTable();
    renderRecentQuotations(recentTbody);

  } catch (err) {
    console.error("loadQuotations error:", err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#ef4444;">Error loading quotations: ${esc(err.message)}</td></tr>`;
  }
}

function renderRecentQuotations(recentTbody) {
  if (!recentTbody) return;
  if (quotationsList.length === 0) {
    recentTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">No quotation requests received yet.</td></tr>`;
    return;
  }

  const recents = quotationsList.slice(0, 5);
  recentTbody.innerHTML = recents.map(q => {
    const status = q.status || "pending";
    const stClass = getQuotationStatusClass(status);

    return `
      <tr>
        <td><strong>${esc(q.name)}</strong></td>
        <td>${esc(q.phone || "—")}</td>
        <td>${esc(q.functionType || "Event")}</td>
        <td>${esc(q.eventDate || "—")}</td>
        <td>${esc(q.location || "—")}</td>
        <td><span class="status-pill ${stClass}">${status.toUpperCase()}</span></td>
        <td>
          <button class="btn btn-outline-gold btn-sm" style="padding:4px 8px; font-size:0.78rem;" onclick="window.viewQuotationDetails('${q._id}')">View Details</button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderQuotationsTable() {
  const tbody = document.getElementById("quotationsTableBody");
  const filter = document.getElementById("quotationFilterSelect") ? document.getElementById("quotationFilterSelect").value : "all";
  if (!tbody) return;

  const filtered = quotationsList.filter(q => {
    if (filter === "all") return true;
    return (q.status || "pending").toLowerCase() === filter.toLowerCase();
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No quotations matching filter "${filter}".</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(q => {
    const status = q.status || "pending";
    const stClass = getQuotationStatusClass(status);

    return `
      <tr>
        <td><strong>${esc(q.name)}</strong></td>
        <td>${esc(q.phone || "—")}</td>
        <td>${esc(q.functionType || "Event")}</td>
        <td>${esc(q.eventDate || "—")}</td>
        <td>${esc(q.location || "—")}</td>
        <td style="max-width:200px; font-size:0.85rem;">${esc(q.requiredEquipment || "—")}</td>
        <td><span class="status-pill ${stClass}">${status.toUpperCase()}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-outline-gold btn-sm" style="padding:4px 8px; font-size:0.78rem;" onclick="window.viewQuotationDetails('${q._id}')">Manage</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function initQuotationsSection() {
  const filterSelect = document.getElementById("quotationFilterSelect");
  if (filterSelect) {
    filterSelect.addEventListener("change", renderQuotationsTable);
  }

  const modal = document.getElementById("quotationDetailsModal");
  const closeBtn = document.getElementById("quotationModalClose");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => modal.classList.remove("active"));
  }
}

function getQuotationStatusClass(st) {
  const s = (st || "").toLowerCase();
  if (s === "pending") return "status-pending";
  if (s === "contacted") return "status-contacted";
  if (s === "confirmed") return "status-confirmed";
  if (s === "completed") return "status-completed";
  if (s === "cancelled") return "status-cancelled";
  return "status-pending";
}

window.viewQuotationDetails = function(id) {
  const q = quotationsList.find(x => x._id === id);
  if (!q) return;

  const modal = document.getElementById("quotationDetailsModal");
  const content = document.getElementById("quotationModalContent");

  content.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
      <div>
        <label class="admin-form-label">Customer Name</label>
        <div style="font-size:1.05rem; font-weight:700;">${esc(q.name)}</div>
      </div>
      <div>
        <label class="admin-form-label">Contact Phone</label>
        <div>${esc(q.phone || "—")}</div>
      </div>
      <div>
        <label class="admin-form-label">Email</label>
        <div>${esc(q.email || "—")}</div>
      </div>
      <div>
        <label class="admin-form-label">Function Type</label>
        <div>${esc(q.functionType || "Event")}</div>
      </div>
      <div>
        <label class="admin-form-label">Event Date</label>
        <div>${esc(q.eventDate || "—")}</div>
      </div>
      <div>
        <label class="admin-form-label">Location</label>
        <div>${esc(q.location || "—")}</div>
      </div>
    </div>

    <div style="margin-bottom:20px;">
      <label class="admin-form-label">Requested Equipment</label>
      <div style="padding:12px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(212,160,23,0.15);">${esc(q.requiredEquipment || "None specified")}</div>
    </div>

    <div style="margin-bottom:24px;">
      <label class="admin-form-label">Customer Message</label>
      <div style="padding:12px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.08); font-style:italic;">"${esc(q.message || "No specific message.")}"</div>
    </div>

    <div style="padding-top:16px; border-top:1px solid rgba(212,160,23,0.15); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <label class="admin-form-label" style="margin-bottom:0;">Change Status:</label>
        <select id="updateQuotationStatusSelect" class="admin-form-control" style="width:auto;">
          <option value="pending" ${q.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="contacted" ${q.status === 'contacted' ? 'selected' : ''}>Contacted</option>
          <option value="confirmed" ${q.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="completed" ${q.status === 'completed' ? 'selected' : ''}>Completed</option>
          <option value="cancelled" ${q.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
        <button type="button" class="btn btn-gold btn-sm" onclick="window.saveQuotationStatus('${q._id}')">Save</button>
      </div>

      <div>
        <button type="button" class="btn btn-outline-gold btn-sm" style="color:#ef4444; border-color:#ef4444;" onclick="window.deleteQuotationItem('${q._id}')">Delete Request</button>
      </div>
    </div>
  `;

  modal.classList.add("active");
};

window.saveQuotationStatus = async function(id) {
  const sel = document.getElementById("updateQuotationStatusSelect");
  if (!sel) return;
  const newStatus = sel.value;

  try {
    const resp = await _apiFetch(`/quotations/${id}`, {
      method: "PUT",
      headers: authJsonHeaders(),
      body: JSON.stringify({ status: newStatus })
    });
    const data = await resp.json();
    if (!data.success) throw new Error(data.message);
    alert("Quotation status updated to " + newStatus);
    document.getElementById("quotationDetailsModal").classList.remove("active");
    loadQuotations();
    loadDashboardStats();
  } catch (err) {
    alert("Update failed: " + err.message);
  }
};

window.deleteQuotationItem = async function(id) {
  if (!confirm("Are you sure you want to delete this quotation request?")) return;
  try {
    const resp = await _apiFetch(`/quotations/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });
    const data = await resp.json();
    if (!data.success) throw new Error(data.message);
    document.getElementById("quotationDetailsModal").classList.remove("active");
    loadQuotations();
    loadDashboardStats();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
};

/* ── 4. Reviews Moderation (With Event Photos) ── */
async function loadReviews() {
  const tbody = document.getElementById("reviewsTableBody");
  if (!tbody) return;

  try {
    const resp = await _apiFetch("/reviews/all", { headers: authHeaders() });
    const data = await resp.json();

    reviewsList = data.success && data.data ? data.data : [];

    let pendingCount = reviewsList.filter(r => (r.status || "pending") === "pending").length;
    const badge = document.getElementById("pendingTabBadge");
    if (badge) badge.textContent = pendingCount;

    renderReviewsTable();
  } catch (err) {
    console.error("loadReviews error:", err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#ef4444;">Error loading reviews: ${esc(err.message)}</td></tr>`;
  }
}

function renderReviewsTable() {
  const tbody = document.getElementById("reviewsTableBody");
  if (!tbody) return;

  const filtered = reviewsList.filter(r => (r.status || "pending") === activeReviewTab);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:36px; color:var(--text-muted);">No ${activeReviewTab} reviews found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const photoRaw = r.imageUrl || r.eventPhoto || "";
    const photo = _resolveUpload(photoRaw);
    const customer = r.clientName || r.name || "Client";
    const fType = r.functionType || "Event";
    const reviewText = r.feedback || "";
    const statusClass = r.status === "approved" ? "status-approved" : r.status === "rejected" ? "status-rejected" : "status-pending";

    return `
      <tr>
        <td style="width:68px;">
          ${photo ? `
            <a href="${esc(photo)}" target="_blank" title="View full event photo">
              <img src="${esc(photo)}" class="thumb-preview" alt="Event photo" style="border:1px solid var(--gold-primary);">
            </a>
          ` : '<div class="thumb-preview" style="font-size:0.8rem; color:var(--text-dim);">No Photo</div>'}
        </td>
        <td><strong>${esc(customer)}</strong></td>
        <td>${esc(fType)}</td>
        <td style="max-width:260px; font-size:0.88rem;">"${esc(reviewText)}"</td>
        <td>${fmtDate(r.createdAt)}</td>
        <td><span class="status-pill ${statusClass}">${(r.status || "pending").toUpperCase()}</span></td>
        <td>
          <div class="action-buttons">
            ${r.status !== "approved" ? `
              <button class="btn btn-sm" style="background:rgba(16,185,129,0.2); color:#10b981; border:1px solid rgba(16,185,129,0.3); padding:4px 8px; font-size:0.75rem;" onclick="window.setReviewApproval('${r._id}', 'approve')">
                Approve
              </button>
            ` : ''}
            ${r.status !== "rejected" ? `
              <button class="btn btn-sm" style="background:rgba(239,68,68,0.2); color:#ef4444; border:1px solid rgba(239,68,68,0.3); padding:4px 8px; font-size:0.75rem;" onclick="window.setReviewApproval('${r._id}', 'reject')">
                Reject
              </button>
            ` : ''}
            <button class="btn-icon btn-delete" onclick="window.deleteReviewItem('${r._id}')" title="Delete Review">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function initReviewsSection() {
  document.querySelectorAll("[data-review-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-review-tab]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeReviewTab = btn.getAttribute("data-review-tab");
      renderReviewsTable();
    });
  });
}

window.setReviewApproval = async function(id, action) {
  try {
    const resp = await _apiFetch(`/reviews/${id}/${action}`, {
      method: "PUT",
      headers: authHeaders()
    });
    const data = await resp.json();
    if (!data.success) throw new Error(data.message);
    loadReviews();
    loadDashboardStats();
  } catch (err) {
    alert("Could not update review status: " + err.message);
  }
};

window.deleteReviewItem = async function(id) {
  if (!confirm("Are you sure you want to delete this review permanently?")) return;
  try {
    const resp = await _apiFetch(`/reviews/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });
    const data = await resp.json();
    if (!data.success) throw new Error(data.message);
    loadReviews();
    loadDashboardStats();
  } catch (err) {
    alert("Could not delete review: " + err.message);
  }
};

/* ═══════════════════════════════════════════════════════════════
   CONTACT DETAILS SECTION
   ═══════════════════════════════════════════════════════════════ */
function initContactSection() {
  const form        = document.getElementById('contactDetailsForm');
  const alertBox    = document.getElementById('contactAdminAlert');
  const waInput     = document.getElementById('adminWhatsappInput');
  const phoneInput  = document.getElementById('adminPhoneInput');
  const emailInput  = document.getElementById('adminEmailInput');
  const addrInput   = document.getElementById('adminAddressInput');
  if (!form) return;

  function showAlert(msg, type) {
    if (!alertBox) return;
    alertBox.style.display = 'block';
    alertBox.textContent = msg;
    alertBox.className = `alert-box ${type === 'success' ? 'alert-success' : 'alert-error'}`;
    setTimeout(() => { alertBox.style.display = 'none'; }, 4500);
  }

  // Load current contact details into form
  async function loadContactDetails() {
    try {
      const resp = await _apiFetch('/contact');
      const data = await resp.json();
      if (data.success && data.contact) {
        if (waInput    && data.contact.whatsapp) waInput.value   = data.contact.whatsapp;
        if (phoneInput && data.contact.phone)    phoneInput.value = data.contact.phone;
        if (emailInput && data.contact.email)    emailInput.value = data.contact.email;
        if (addrInput  && data.contact.address)  addrInput.value  = data.contact.address;
      }
    } catch (err) {
      console.warn('Could not load contact details:', err);
    }
  }

  // Auto-load when tab becomes active
  document.querySelectorAll('.admin-sidebar-nav .admin-nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === 'contact') {
      item.addEventListener('click', () => setTimeout(loadContactDetails, 100));
    }
  });

  // Save on submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveContactBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

    // Strip non-digits from WhatsApp number
    const rawWa = waInput ? waInput.value.trim() : '';
    const cleanWa = rawWa.replace(/\D/g, '');

    if (!cleanWa) {
      showAlert('WhatsApp number is required.', 'error');
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 Save Contact Details'; }
      return;
    }

    try {
      const resp = await _apiFetch('/contact', {
        method: 'PUT',
        headers: authJsonHeaders(),
        body: JSON.stringify({
          whatsapp: cleanWa,
          phone:    phoneInput ? phoneInput.value.trim() : '',
          email:    emailInput ? emailInput.value.trim() : '',
          address:  addrInput  ? addrInput.value.trim()  : ''
        })
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message || 'Failed to save.');
      if (waInput) waInput.value = cleanWa; // Normalize display
      showAlert('✅ Contact details saved successfully!', 'success');
    } catch (err) {
      showAlert('❌ Error: ' + (err.message || 'Could not save contact details.'), 'error');
    } finally {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 Save Contact Details'; }
    }
  });
}
