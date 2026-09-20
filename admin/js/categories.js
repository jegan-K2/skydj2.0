/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT - CATEGORIES MODULE (categories.js)
   CRUD operations for equipment categories in Firestore
   ========================================================================== */

import { 
  db, 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp, 
  isFirebaseConfigured 
} from "../../js/firebase-config.js";
import { escapeHtml } from "../../js/app.js";

let categoriesCache = [];
let editingCategoryId = null;

document.addEventListener("DOMContentLoaded", () => {
  loadCategoriesTable();
  initCategoryModal();
});

async function loadCategoriesTable() {
  const tbody = document.getElementById("categoriesTableBody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">
        Loading categories...
      </td>
    </tr>
  `;

  if (!isFirebaseConfigured() || !db) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">
          No categories found. Connect Firebase to start organizing rental items.
        </td>
      </tr>
    `;
    return;
  }

  try {
    const q = query(collection(db, "categories"), orderBy("name"));
    const snap = await getDocs(q);

    if (snap.empty) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 30px; color: var(--text-muted);">
            No categories created yet. Click "+ Add Category" to create your first category.
          </td>
        </tr>
      `;
      return;
    }

    categoriesCache = [];
    snap.forEach(d => {
      categoriesCache.push({ id: d.id, ...d.data() });
    });

    tbody.innerHTML = categoriesCache.map(cat => `
      <tr>
        <td><strong>${escapeHtml(cat.name)}</strong></td>
        <td>${escapeHtml(cat.description || '—')}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon btn-edit" data-id="${cat.id}" title="Edit Category">✏️</button>
            <button class="btn-icon btn-delete" data-id="${cat.id}" title="Delete Category">🗑️</button>
          </div>
        </td>
      </tr>
    `).join("");

    // Attach actions
    tbody.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        openEditModal(id);
      });
    });

    tbody.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        deleteCategory(id);
      });
    });

  } catch (err) {
    console.error("Error loading categories:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 24px; color: #ef4444;">
          Failed to load categories: ${escapeHtml(err.message)}
        </td>
      </tr>
    `;
  }
}

function initCategoryModal() {
  const modal = document.getElementById("categoryModal");
  const form = document.getElementById("categoryForm");
  const openBtn = document.getElementById("addCategoryBtn");
  const closeBtn = document.getElementById("categoryModalClose");
  const cancelBtn = document.getElementById("categoryModalCancel");

  if (!modal || !form) return;

  const closeModal = () => {
    modal.classList.remove("active");
    form.reset();
    editingCategoryId = null;
    document.getElementById("categoryModalTitle").textContent = "Add Equipment Category";
  };

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      form.reset();
      editingCategoryId = null;
      document.getElementById("categoryModalTitle").textContent = "Add Equipment Category";
      modal.classList.add("active");
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.categoryName.value.trim();
    const description = form.categoryDescription.value.trim();
    const submitBtn = form.querySelector("button[type='submit']");

    if (!name) {
      alert("Please provide a category name.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    try {
      if (editingCategoryId) {
        // Update
        await updateDoc(doc(db, "categories", editingCategoryId), {
          name,
          description,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create
        await addDoc(collection(db, "categories"), {
          name,
          description,
          createdAt: serverTimestamp()
        });
      }

      closeModal();
      loadCategoriesTable();

    } catch (err) {
      alert("Error saving category: " + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Save Category";
    }
  });
}

function openEditModal(id) {
  const cat = categoriesCache.find(c => c.id === id);
  if (!cat) return;

  editingCategoryId = id;
  const modal = document.getElementById("categoryModal");
  const form = document.getElementById("categoryForm");

  form.categoryName.value = cat.name || "";
  form.categoryDescription.value = cat.description || "";
  document.getElementById("categoryModalTitle").textContent = "Edit Category";

  modal.classList.add("active");
}

async function deleteCategory(id) {
  const cat = categoriesCache.find(c => c.id === id);
  if (!cat) return;

  if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
    return;
  }

  try {
    await deleteDoc(doc(db, "categories", id));
    loadCategoriesTable();
  } catch (err) {
    alert("Could not delete category: " + err.message);
  }
}
