/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT - ADMIN UNIFIED DASHBOARD SCRIPT (dashboard.js)
   Single-page Tab Navigation, Equipment CRUD, Categories, Quotations,
   Reviews Moderation (with Event Photos), and Business Profile
   ========================================================================== */

import { 
  db, 
  storage, 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  formatDate, 
  formatPrice, 
  isFirebaseConfigured
} from "../../js/firebase-config.js";
import { escapeHtml } from "../../js/app.js";


// Global in-memory caches
let categoriesList = [];
let equipmentList = [];
let quotationsList = [];
let reviewsList = [];
let currentEditingEquipmentId = null;
let currentEquipmentImages = [];
let activeReviewTab = "pending";

document.addEventListener("DOMContentLoaded", () => {
  initTabNavigation();
  loadAllAdminData();
  initBusinessSection();
  initEquipmentSection();
  initCategoriesSection();
  initQuotationsSection();
  initReviewsSection();
  initSettingsSection();
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

  // Handle URL hash navigation on load
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
      business: "Business & Homepage About Us",
      equipment: "Equipment Management",
      categories: "Categories Management",
      quotations: "Quotation Requests",
      reviews: "Client Reviews Moderation",
      settings: "System & Security Settings"
    };
    headerTitle.textContent = titles[tabName] || "Admin Portal";
  }

  // Close mobile sidebar if open
  const sidebar = document.querySelector(".admin-sidebar");
  if (sidebar) sidebar.classList.remove("open");
};

/* ── Master Data Loader ── */
async function loadAllAdminData() {
  if (!isFirebaseConfigured() || !db) {
    console.warn("Firebase not configured in admin portal.");
    return;
  }
  await Promise.allSettled([
    loadDashboardStats(),
    loadCategories(),
    loadEquipment(),
    loadQuotations(),
    loadReviews(),
    loadBusinessData()
  ]);
}

/* ── 1. Dashboard Stats ── */
async function loadDashboardStats() {
  const statItems = document.getElementById("statTotalItems");
  const statCats = document.getElementById("statTotalCategories");
  const statPendingReviews = document.getElementById("statPendingReviews");
  const statTotalQuotations = document.getElementById("statTotalQuotations");
  const statPendingQuotations = document.getElementById("statPendingQuotations");

  try {
    // Equipment count (checks 'equipment' collection or 'items')
    let equipSnap = await getDocs(collection(db, "equipment"));
    if (equipSnap.empty) {
      equipSnap = await getDocs(collection(db, "items"));
    }
    if (statItems) statItems.textContent = equipSnap.size;

    // Categories count
    const catSnap = await getDocs(collection(db, "categories"));
    if (statCats) statCats.textContent = catSnap.size;

    // Pending Reviews
    const revSnap = await getDocs(query(collection(db, "reviews"), where("status", "==", "pending")));
    if (statPendingReviews) statPendingReviews.textContent = revSnap.size;
    const revBadge = document.getElementById("navPendingReviewsBadge");
    if (revBadge) {
      revBadge.textContent = revSnap.size;
      revBadge.style.display = revSnap.size > 0 ? "inline-block" : "none";
    }

    // Quotations count
    let quotSnap = await getDocs(collection(db, "quotations"));
    if (quotSnap.empty) {
      quotSnap = await getDocs(collection(db, "enquiries"));
    }
    if (statTotalQuotations) statTotalQuotations.textContent = quotSnap.size;

    let pendingCount = 0;
    quotSnap.forEach(d => {
      const st = (d.data().status || "").toLowerCase();
      if (st === "pending" || !st) pendingCount++;
    });
    if (statPendingQuotations) statPendingQuotations.textContent = pendingCount;
    const quotBadge = document.getElementById("navPendingQuotationsBadge");
    if (quotBadge) {
      quotBadge.textContent = pendingCount;
      quotBadge.style.display = pendingCount > 0 ? "inline-block" : "none";
    }

  } catch (err) {
    console.error("Dashboard stats error:", err);
  }
}

/* ── 2. Business Profile & About Us ── */
async function loadBusinessData() {
  const form = document.getElementById("businessSettingsForm");
  if (!form || !db) return;

  try {
    const snap = await getDoc(doc(db, "businessSettings", "main"));
    if (snap.exists()) {
      const d = snap.data();
      form.businessName.value = d.businessName || "SKY DJ & EVENT MANAGEMENT";
      form.tagline.value = d.tagline || "DJ • Sound • Lighting • Stage • Events";
      form.description.value = d.description || "";
      form.aboutUs.value = d.aboutUs || "";
      form.phone.value = d.phone || "";
      form.whatsapp.value = d.whatsapp || "";
      form.email.value = d.email || "";
      form.address.value = d.address || "";
      form.instagram.value = d.instagram || "";
    }
  } catch (err) {
    console.error("loadBusinessData error:", err);
  }
}

function initBusinessSection() {
  const form = document.getElementById("businessSettingsForm");
  const alertBox = document.getElementById("businessAlertBox");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("saveBusinessBtn");
    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
      const payload = {
        businessName: form.businessName.value.trim(),
        tagline: form.tagline.value.trim(),
        description: form.description.value.trim(),
        aboutUs: form.aboutUs.value.trim(),
        phone: form.phone.value.trim(),
        whatsapp: form.whatsapp.value.trim(),
        email: form.email.value.trim(),
        address: form.address.value.trim(),
        instagram: form.instagram.value.trim(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, "businessSettings", "main"), payload, { merge: true });

      if (alertBox) {
        alertBox.textContent = "✓ Business profile and About Us information updated successfully!";
        alertBox.className = "alert-box alert-success";
        alertBox.style.display = "block";
        setTimeout(() => alertBox.style.display = "none", 5000);
      }
    } catch (err) {
      alert("Error saving business profile: " + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Save Business Profile";
    }
  });
}

/* ── 3. Categories Management ── */
async function loadCategories() {
  const tbody = document.getElementById("categoriesTableBody");
  const select = document.getElementById("equipmentCategorySelect");
  if (!tbody || !db) return;

  try {
    const snap = await getDocs(query(collection(db, "categories"), orderBy("name")));
    categoriesList = [];
    let opts = '<option value="">Select Category</option>';

    snap.forEach(d => {
      const data = d.data();
      categoriesList.push({ id: d.id, name: data.name });
      opts += `<option value="${d.id}">${escapeHtml(data.name)}</option>`;
    });

    if (select) select.innerHTML = opts;

    if (categoriesList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:20px; color:var(--text-muted);">No categories created yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = categoriesList.map(c => `
      <tr>
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td>
          <button class="btn-icon btn-delete" onclick="window.deleteCategoryItem('${c.id}')" title="Delete Category">🗑️</button>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("loadCategories error:", err);
  }
}

function initCategoriesSection() {
  const form = document.getElementById("addCategoryForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("newCategoryName");
    const name = input.value.trim();
    if (!name) return;

    try {
      await addDoc(collection(db, "categories"), {
        name,
        createdAt: serverTimestamp()
      });
      input.value = "";
      loadCategories();
      loadDashboardStats();
    } catch (err) {
      alert("Could not add category: " + err.message);
    }
  });
}

window.deleteCategoryItem = async function(id) {
  if (!confirm("Are you sure you want to delete this category?")) return;
  try {
    await deleteDoc(doc(db, "categories", id));
    loadCategories();
    loadDashboardStats();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
};

/* ── 4. Equipment Management ── */
async function loadEquipment() {
  const tbody = document.getElementById("equipmentTableBody");
  if (!tbody || !db) return;

  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:24px; color:var(--text-muted);">Loading equipment...</td></tr>`;

  try {
    let snap = await getDocs(query(collection(db, "equipment"), orderBy("createdAt", "desc")));
    let isLegacyCollection = false;
    if (snap.empty) {
      snap = await getDocs(query(collection(db, "items"), orderBy("createdAt", "desc")));
      if (!snap.empty) isLegacyCollection = true;
    }

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-muted);">No equipment added yet. Click "+ Add Equipment" to add real items.</td></tr>`;
      return;
    }

    equipmentList = [];
    snap.forEach(d => {
      equipmentList.push({ id: d.id, _collection: isLegacyCollection ? "items" : "equipment", ...d.data() });
    });

    tbody.innerHTML = equipmentList.map(item => {
      const thumb = (item.images && item.images.length > 0) ? item.images[0] : (item.imageUrl || "");
      const desc = item.description ? item.description.substring(0, 80) + (item.description.length > 80 ? '...' : '') : '—';

      return `
        <tr>
          <td style="width:64px;">
            ${thumb ? `<img src="${escapeHtml(thumb)}" class="thumb-preview" alt="equipment photo">` : '<div class="thumb-preview" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;">📦</div>'}
          </td>
          <td><strong>${escapeHtml(item.name)}</strong></td>
          <td style="max-width:280px; font-size:0.88rem; color:var(--text-muted);">${escapeHtml(desc)}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon" onclick="window.openEditEquipmentModal('${item.id}')" title="Edit Equipment">✏️</button>
              <button class="btn-icon btn-delete" onclick="window.deleteEquipmentItem('${item.id}', '${item._collection || 'equipment'}')" title="Delete Equipment">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    console.error("loadEquipment error:", err);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:24px; color:#ef4444;">Error loading equipment: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function initEquipmentSection() {
  const openBtn = document.getElementById("addEquipmentBtn");
  const modal = document.getElementById("equipmentModal");
  const closeBtn = document.getElementById("equipmentModalClose");
  const cancelBtn = document.getElementById("equipmentModalCancel");
  const form = document.getElementById("equipmentForm");
  const imgInput = document.getElementById("equipmentImageInput");

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      currentEditingEquipmentId = null;
      currentEquipmentImages = [];
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
    currentEquipmentImages = [];
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

        // Handle uploaded image file
        if (imgInput && imgInput.files && imgInput.files.length > 0) {
          const file = imgInput.files[0];
          if (!file.type.startsWith("image/")) {
            throw new Error("Please select an image file (JPG, PNG, WEBP).");
          }
          if (file.size > 5 * 1024 * 1024) {
            throw new Error("Image size must be less than 5MB.");
          }
          const fileRef = ref(storage, `equipment/${Date.now()}_${file.name}`);
          const res = await uploadBytes(fileRef, file);
          const dl = await getDownloadURL(res.ref);
          currentEquipmentImages = [dl];
        }

        if (currentEquipmentImages.length === 0 && !currentEditingEquipmentId) {
          throw new Error("Please choose an equipment image.");
        }

        const primaryImg = currentEquipmentImages[0] || "";

        const payload = {
          name,
          description,
          imageUrl: primaryImg,
          images: currentEquipmentImages,
          updatedAt: serverTimestamp()
        };

        if (currentEditingEquipmentId) {
          await updateDoc(doc(db, "equipment", currentEditingEquipmentId), payload);
        } else {
          payload.createdAt = serverTimestamp();
          await addDoc(collection(db, "equipment"), payload);
        }

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

  if (currentEquipmentImages.length === 0) {
    container.innerHTML = `<span style="font-size:0.8rem; color:var(--text-dim);">No image selected yet.</span>`;
    return;
  }

  container.innerHTML = currentEquipmentImages.map((url, idx) => `
    <div class="img-preview-item" style="position:relative; display:inline-block; margin-top:8px;">
      <img src="${escapeHtml(url)}" alt="preview" style="width:100px; height:100px; object-fit:cover; border-radius:8px; border:1px solid var(--gold-primary);">
      <button type="button" class="img-remove-btn" onclick="window.removeEquipmentImage(${idx})" title="Remove image" style="position:absolute; top:-6px; right:-6px; background:#ef4444; color:#fff; border:none; border-radius:50%; width:22px; height:22px; cursor:pointer; font-weight:bold;">&times;</button>
    </div>
  `).join("");
}

window.removeEquipmentImage = function(idx) {
  currentEquipmentImages.splice(idx, 1);
  renderEquipmentImagePreviews();
};

window.openEditEquipmentModal = function(id) {
  const item = equipmentList.find(e => e.id === id);
  if (!item) return;

  currentEditingEquipmentId = id;
  currentEquipmentImages = item.imageUrl ? [item.imageUrl] : (Array.isArray(item.images) ? [...item.images] : []);

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

window.deleteEquipmentItem = async function(id, col = "equipment") {
  if (!confirm("Are you sure you want to delete this equipment item permanently?")) return;
  try {
    await deleteDoc(doc(db, col, id));
    loadEquipment();
    loadDashboardStats();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
};

/* ── 5. Quotations Management ── */
async function loadQuotations() {
  const tbody = document.getElementById("quotationsTableBody");
  const recentTbody = document.getElementById("recentQuotationsTableBody");
  if (!tbody || !db) return;

  try {
    let snap = await getDocs(query(collection(db, "quotations"), orderBy("createdAt", "desc")));
    let isLegacy = false;
    if (snap.empty) {
      snap = await getDocs(query(collection(db, "enquiries"), orderBy("createdAt", "desc")));
      if (!snap.empty) isLegacy = true;
    }

    quotationsList = [];
    snap.forEach(d => {
      quotationsList.push({ id: d.id, _collection: isLegacy ? "enquiries" : "quotations", ...d.data() });
    });

    renderQuotationsTable();
    renderRecentQuotations(recentTbody);

  } catch (err) {
    console.error("loadQuotations error:", err);
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
    const status = q.status || "Pending";
    const stClass = getQuotationStatusClass(status);
    const name = q.customerName || q.name || "Customer";
    const fType = q.functionType || q.eventType || "Event";
    const fDate = q.functionDate || q.eventDate || "—";
    const loc = q.location || q.eventLocation || "—";

    return `
      <tr>
        <td><strong>${escapeHtml(name)}</strong></td>
        <td>${escapeHtml(q.phone || "—")}</td>
        <td>${escapeHtml(fType)}</td>
        <td>${escapeHtml(fDate)}</td>
        <td>${escapeHtml(loc)}</td>
        <td><span class="status-pill ${stClass}">${status.toUpperCase()}</span></td>
        <td>
          <button class="btn btn-outline-gold btn-sm" style="padding:4px 8px; font-size:0.78rem;" onclick="window.viewQuotationDetails('${q.id}')">View Details</button>
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
    return (q.status || "Pending").toLowerCase() === filter.toLowerCase();
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No quotations matching filter "${filter}".</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(q => {
    const status = q.status || "Pending";
    const stClass = getQuotationStatusClass(status);
    const name = q.customerName || q.name || "Customer";
    const fType = q.functionType || q.eventType || "Event";
    const fDate = q.functionDate || q.eventDate || "—";
    const loc = q.location || q.eventLocation || "—";
    const eqList = Array.isArray(q.selectedEquipment) ? q.selectedEquipment.join(", ") : (q.requiredItems ? q.requiredItems.join(", ") : (q.requiredEquipment || "—"));

    return `
      <tr>
        <td><strong>${escapeHtml(name)}</strong></td>
        <td>
          <div>${escapeHtml(q.phone || "—")}</div>
          ${q.whatsapp ? `<a href="https://wa.me/${q.whatsapp.replace(/[^0-9]/g, "")}" target="_blank" style="color:#25d366; font-size:0.78rem;">Chat on WhatsApp →</a>` : ''}
        </td>
        <td>${escapeHtml(fType)}</td>
        <td>${escapeHtml(fDate)}</td>
        <td>${escapeHtml(loc)}</td>
        <td style="max-width:200px; font-size:0.85rem;">${escapeHtml(eqList)}</td>
        <td><span class="status-pill ${stClass}">${status.toUpperCase()}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-outline-gold btn-sm" style="padding:4px 8px; font-size:0.78rem;" onclick="window.viewQuotationDetails('${q.id}')">Manage</button>
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
  if (s === "quoted" || s === "confirmed") return "status-confirmed";
  if (s === "completed") return "status-completed";
  if (s === "cancelled") return "status-cancelled";
  return "status-pending";
}

window.viewQuotationDetails = function(id) {
  const q = quotationsList.find(x => x.id === id);
  if (!q) return;

  const modal = document.getElementById("quotationDetailsModal");
  const content = document.getElementById("quotationModalContent");

  const name = q.customerName || q.name || "Customer";
  const phone = q.phone || "—";
  const email = q.email || "—";
  const fType = q.functionType || q.eventType || "Event";
  const fDate = q.functionDate || q.eventDate || "—";
  const loc = q.location || q.eventLocation || "—";
  const msg = q.message || "No specific message provided.";
  const eqList = Array.isArray(q.selectedEquipment) ? q.selectedEquipment.join(", ") : (q.requiredItems ? q.requiredItems.join(", ") : (q.requiredEquipment || "None specified"));

  content.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
      <div>
        <label class="admin-form-label">Customer Name</label>
        <div style="font-size:1.05rem; font-weight:700;">${escapeHtml(name)}</div>
      </div>
      <div>
        <label class="admin-form-label">Contact Phone</label>
        <div>${escapeHtml(phone)}</div>
      </div>
      <div>
        <label class="admin-form-label">Email</label>
        <div>${escapeHtml(email)}</div>
      </div>
      <div>
        <label class="admin-form-label">Function Type</label>
        <div>${escapeHtml(fType)}</div>
      </div>
      <div>
        <label class="admin-form-label">Function Date</label>
        <div>${escapeHtml(fDate)}</div>
      </div>
      <div>
        <label class="admin-form-label">Location</label>
        <div>${escapeHtml(loc)}</div>
      </div>
    </div>

    <div style="margin-bottom:20px;">
      <label class="admin-form-label">Requested Equipment</label>
      <div style="padding:12px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(212,160,23,0.15);">${escapeHtml(eqList)}</div>
    </div>

    <div style="margin-bottom:24px;">
      <label class="admin-form-label">Customer Message / Vision</label>
      <div style="padding:12px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.08); font-style:italic;">"${escapeHtml(msg)}"</div>
    </div>

    <div style="padding-top:16px; border-top:1px solid rgba(212,160,23,0.15); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <label class="admin-form-label" style="margin-bottom:0;">Change Status:</label>
        <select id="updateQuotationStatusSelect" class="admin-form-control" style="width:auto;">
          <option value="Pending" ${q.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Contacted" ${q.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
          <option value="Quoted" ${q.status === 'Quoted' ? 'selected' : ''}>Quoted</option>
          <option value="Confirmed" ${q.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="Completed" ${q.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Cancelled" ${q.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
        <button type="button" class="btn btn-gold btn-sm" onclick="window.saveQuotationStatus('${q.id}', '${q._collection || 'quotations'}')">Save</button>
      </div>

      <div>
        <button type="button" class="btn btn-outline-gold btn-sm" style="color:#ef4444; border-color:#ef4444;" onclick="window.deleteQuotationItem('${q.id}', '${q._collection || 'quotations'}')">Delete Request</button>
      </div>
    </div>
  `;

  modal.classList.add("active");
};

window.saveQuotationStatus = async function(id, col = "quotations") {
  const sel = document.getElementById("updateQuotationStatusSelect");
  if (!sel) return;
  const newStatus = sel.value;

  try {
    await updateDoc(doc(db, col, id), {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    alert("Quotation status updated to " + newStatus);
    document.getElementById("quotationDetailsModal").classList.remove("active");
    loadQuotations();
    loadDashboardStats();
  } catch (err) {
    alert("Update failed: " + err.message);
  }
};

window.deleteQuotationItem = async function(id, col = "quotations") {
  if (!confirm("Are you sure you want to delete this quotation request?")) return;
  try {
    await deleteDoc(doc(db, col, id));
    document.getElementById("quotationDetailsModal").classList.remove("active");
    loadQuotations();
    loadDashboardStats();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
};

/* ── 6. Reviews Moderation (With Event Photos) ── */
async function loadReviews() {
  const tbody = document.getElementById("reviewsTableBody");
  if (!tbody || !db) return;

  try {
    const snap = await getDocs(query(collection(db, "reviews"), orderBy("createdAt", "desc")));
    reviewsList = [];
    let pendingCount = 0;

    snap.forEach(d => {
      const data = d.data();
      reviewsList.push({ id: d.id, ...data });
      if ((data.status || "pending") === "pending") pendingCount++;
    });

    const badge = document.getElementById("pendingTabBadge");
    if (badge) badge.textContent = pendingCount;

    renderReviewsTable();
  } catch (err) {
    console.error("loadReviews error:", err);
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
    const photo = r.imageUrl || r.image || r.eventPhoto || "";
    const customer = r.name || r.customerName || "Client";
    const fType = r.functionType || r.eventType || "Event";
    const reviewText = r.feedback || r.review || r.comment || "";
    const statusClass = r.status === "approved" ? "status-approved" : r.status === "rejected" ? "status-rejected" : "status-pending";

    return `
      <tr>
        <td style="width:68px;">
          ${photo ? `
            <a href="${escapeHtml(photo)}" target="_blank" title="View full event photo">
              <img src="${escapeHtml(photo)}" class="thumb-preview" alt="Event photo" style="border:1px solid var(--gold-primary);">
            </a>
          ` : '<div class="thumb-preview" style="font-size:0.8rem; color:var(--text-dim);">No Photo</div>'}
        </td>
        <td><strong>${escapeHtml(customer)}</strong></td>
        <td>${escapeHtml(fType)}</td>
        <td style="max-width:260px; font-size:0.88rem;">"${escapeHtml(reviewText)}"</td>
        <td>${formatDate(r.createdAt || r.date)}</td>
        <td><span class="status-pill ${statusClass}">${(r.status || "pending").toUpperCase()}</span></td>
        <td>
          <div class="action-buttons">
            ${r.status !== "approved" ? `
              <button class="btn btn-sm" style="background:rgba(16,185,129,0.2); color:#10b981; border:1px solid rgba(16,185,129,0.3); padding:4px 8px; font-size:0.75rem;" onclick="window.setReviewApproval('${r.id}', 'approved')">
                Approve
              </button>
            ` : ''}
            ${r.status !== "rejected" ? `
              <button class="btn btn-sm" style="background:rgba(239,68,68,0.2); color:#ef4444; border:1px solid rgba(239,68,68,0.3); padding:4px 8px; font-size:0.75rem;" onclick="window.setReviewApproval('${r.id}', 'rejected')">
                Reject
              </button>
            ` : ''}
            <button class="btn-icon btn-delete" onclick="window.deleteReviewItem('${r.id}')" title="Delete Review">🗑️</button>
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

window.setReviewApproval = async function(id, newStatus) {
  try {
    await updateDoc(doc(db, "reviews", id), {
      status: newStatus,
      reviewedAt: serverTimestamp()
    });
    loadReviews();
    loadDashboardStats();
  } catch (err) {
    alert("Could not update review status: " + err.message);
  }
};

window.deleteReviewItem = async function(id) {
  if (!confirm("Are you sure you want to delete this review permanently?")) return;
  try {
    await deleteDoc(doc(db, "reviews", id));
    loadReviews();
    loadDashboardStats();
  } catch (err) {
    alert("Could not delete review: " + err.message);
  }
};

/* ── 7. Settings ── */
function initSettingsSection() {
  const statusEl = document.getElementById("settingsConnectionStatus");
  if (!statusEl) return;

  if (isFirebaseConfigured()) {
    statusEl.innerHTML = `
      <div style="padding:12px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:8px; color:#10b981;">
        ✓ Firebase is configured and active. Firestore &amp; Storage live.
      </div>
    `;
  } else {
    statusEl.innerHTML = `
      <div style="padding:12px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:8px; color:#ef4444;">
        ⚠️ Firebase credentials need configuration in js/firebase-config.js.
      </div>
    `;
  }
}
