/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT - PRODUCTS MANAGEMENT (products.js)
   CRUD operations, multi-image Firebase Storage upload & thumbnail manager
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
  query, 
  orderBy, 
  serverTimestamp, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  formatPrice, 
  isFirebaseConfigured 
} from "../../js/firebase-config.js";
import { escapeHtml } from "../../js/app.js";

let productsCache = [];
let categoriesList = [];
let editingProductId = null;
let currentItemImages = []; // Array of URL strings

document.addEventListener("DOMContentLoaded", () => {
  loadCategoriesSelect();
  loadProductsTable();
  initProductModal();
});

async function loadCategoriesSelect() {
  const select = document.getElementById("itemCategorySelect");
  if (!select || !isFirebaseConfigured() || !db) return;

  try {
    const q = query(collection(db, "categories"), orderBy("name"));
    const snap = await getDocs(q);
    
    categoriesList = [];
    let opts = '<option value="">Select Category</option>';
    snap.forEach(d => {
      const data = d.data();
      categoriesList.push({ id: d.id, name: data.name });
      opts += `<option value="${d.id}">${escapeHtml(data.name)}</option>`;
    });
    select.innerHTML = opts;
  } catch (err) {
    console.warn("Could not load categories dropdown:", err);
  }
}

async function loadProductsTable() {
  const tbody = document.getElementById("productsTableBody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
        Loading rental items...
      </td>
    </tr>
  `;

  if (!isFirebaseConfigured() || !db) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
          No items found. Connect Firebase to manage your equipment catalogue.
        </td>
      </tr>
    `;
    return;
  }

  try {
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">
            No rental items added yet. Click "+ Add Equipment" to publish your first item.
          </td>
        </tr>
      `;
      return;
    }

    productsCache = [];
    snap.forEach(d => {
      productsCache.push({ id: d.id, ...d.data() });
    });

    tbody.innerHTML = productsCache.map(item => {
      const thumb = item.images && item.images.length > 0 ? item.images[0] : '';
      const priceFormatted = formatPrice(item.price, item.priceType);
      const avail = item.availability || "available";
      const badgeClass = avail === "available" ? "status-available" : avail === "limited" ? "status-pending" : "status-rejected";

      return `
        <tr>
          <td style="width: 70px;">
            ${thumb ? `<img src="${escapeHtml(thumb)}" class="thumb-preview" alt="item">` : '<div class="thumb-preview" style="display:flex;align-items:center;justify-content:center;font-size:1.2rem;">📦</div>'}
          </td>
          <td><strong>${escapeHtml(item.name)}</strong></td>
          <td>${escapeHtml(item.categoryName || '—')}</td>
          <td><span style="font-weight: 700; color: var(--accent-gold);">${priceFormatted}</span></td>
          <td><span class="status-pill ${badgeClass}">${avail.toUpperCase()}</span></td>
          <td>${item.images ? item.images.length : 0} photo(s)</td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon btn-edit" data-id="${item.id}" title="Edit Product">✏️</button>
              <button class="btn-icon btn-delete" data-id="${item.id}" title="Delete Product">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Attach actions
    tbody.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        openEditProductModal(btn.getAttribute("data-id"));
      });
    });

    tbody.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        deleteProduct(btn.getAttribute("data-id"));
      });
    });

  } catch (err) {
    console.error("Error loading products:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 24px; color: #ef4444;">
          Failed to load products: ${escapeHtml(err.message)}
        </td>
      </tr>
    `;
  }
}

function initProductModal() {
  const modal = document.getElementById("productModal");
  const form = document.getElementById("productForm");
  const openBtn = document.getElementById("addProductBtn");
  const closeBtn = document.getElementById("productModalClose");
  const cancelBtn = document.getElementById("productModalCancel");
  const imgInput = document.getElementById("itemImageUpload");

  if (!modal || !form) return;

  const closeModal = () => {
    modal.classList.remove("active");
    form.reset();
    editingProductId = null;
    currentItemImages = [];
    renderImagePreviews();
    document.getElementById("productModalTitle").textContent = "Add Rental Equipment";
  };

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      form.reset();
      editingProductId = null;
      currentItemImages = [];
      renderImagePreviews();
      document.getElementById("productModalTitle").textContent = "Add Rental Equipment";
      modal.classList.add("active");
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.itemName.value.trim();
    const categoryId = form.itemCategory.value;
    const catObj = categoriesList.find(c => c.id === categoryId);
    const categoryName = catObj ? catObj.name : "";

    const priceRaw = form.itemPrice.value.trim();
    const price = priceRaw ? parseFloat(priceRaw) : null;
    const priceType = form.itemPriceType.value;
    const availability = form.itemAvailability.value;
    const description = form.itemDescription.value.trim();
    const featuresRaw = form.itemFeatures.value.trim();
    const features = featuresRaw ? featuresRaw.split("\n").map(f => f.trim()).filter(Boolean) : [];

    const submitBtn = form.querySelector("button[type='submit']");

    if (!name) {
      alert("Please enter equipment name.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading & Saving...";

    try {
      // Handle newly selected files upload to Firebase Storage
      if (imgInput && imgInput.files && imgInput.files.length > 0) {
        for (let i = 0; i < imgInput.files.length; i++) {
          const file = imgInput.files[i];
          if (!file.type.startsWith("image/")) continue;
          if (file.size > 5 * 1024 * 1024) continue;

          const fileRef = ref(storage, `items/${Date.now()}_${file.name}`);
          const uploadRes = await uploadBytes(fileRef, file);
          const dlUrl = await getDownloadURL(uploadRes.ref);
          currentItemImages.push(dlUrl);
        }
      }

      const payload = {
        name,
        categoryId: categoryId || "",
        categoryName: categoryName || "Equipment",
        price,
        priceType,
        availability,
        description,
        features,
        images: currentItemImages,
        updatedAt: serverTimestamp()
      };

      if (editingProductId) {
        await updateDoc(doc(db, "items", editingProductId), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "items"), payload);
      }

      closeModal();
      loadProductsTable();

    } catch (err) {
      console.error("Failed to save product:", err);
      alert("Error: " + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Save Equipment";
    }
  });
}

function openEditProductModal(id) {
  const item = productsCache.find(p => p.id === id);
  if (!item) return;

  editingProductId = id;
  const modal = document.getElementById("productModal");
  const form = document.getElementById("productForm");

  form.itemName.value = item.name || "";
  form.itemCategory.value = item.categoryId || "";
  form.itemPrice.value = item.price !== null && item.price !== undefined ? item.price : "";
  form.itemPriceType.value = item.priceType || "per day";
  form.itemAvailability.value = item.availability || "available";
  form.itemDescription.value = item.description || "";
  form.itemFeatures.value = Array.isArray(item.features) ? item.features.join("\n") : "";

  currentItemImages = Array.isArray(item.images) ? [...item.images] : [];
  renderImagePreviews();

  document.getElementById("productModalTitle").textContent = "Edit Rental Equipment";
  modal.classList.add("active");
}

function renderImagePreviews() {
  const grid = document.getElementById("itemImagePreviews");
  if (!grid) return;

  if (currentItemImages.length === 0) {
    grid.innerHTML = '<p style="color: var(--text-dim); font-size: 0.85rem;">No images uploaded yet.</p>';
    return;
  }

  grid.innerHTML = currentItemImages.map((url, idx) => `
    <div class="image-preview-item">
      <img src="${escapeHtml(url)}" alt="preview">
      <button type="button" class="image-remove-btn" data-idx="${idx}" title="Remove Image">&times;</button>
    </div>
  `).join("");

  grid.querySelectorAll(".image-remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-idx"), 10);
      currentItemImages.splice(idx, 1);
      renderImagePreviews();
    });
  });
}

async function deleteProduct(id) {
  const item = productsCache.find(p => p.id === id);
  if (!item) return;

  if (!confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
    return;
  }

  try {
    await deleteDoc(doc(db, "items", id));
    loadProductsTable();
  } catch (err) {
    alert("Could not delete item: " + err.message);
  }
}
