/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT - BUSINESS SETTINGS MODULE (business.js)
   Firestore business profile management & Firebase Storage logo upload
   ========================================================================== */

import { 
  db, 
  storage, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  isFirebaseConfigured 
} from "../../js/firebase-config.js";
import { escapeHtml } from "../../js/app.js";

document.addEventListener("DOMContentLoaded", () => {
  loadBusinessData();
  initBusinessForm();
});

async function loadBusinessData() {
  const form = document.getElementById("businessSettingsForm");
  const logoPreview = document.getElementById("currentLogoPreview");

  if (!form || !isFirebaseConfigured() || !db) return;

  try {
    const docRef = doc(db, "businessSettings", "main");
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      form.businessName.value = data.businessName || "";
      form.tagline.value = data.tagline || "";
      form.description.value = data.description || "";
      form.phone.value = data.phone || "";
      form.whatsapp.value = data.whatsapp || "";
      form.email.value = data.email || "";
      form.address.value = data.address || "";
      form.googleMapsUrl.value = data.googleMapsUrl || "";
      form.openingHours.value = data.openingHours || "";
      form.aboutUs.value = data.aboutUs || "";
      form.instagram.value = data.instagram || "";
      form.facebook.value = data.facebook || "";
      form.youtube.value = data.youtube || "";

      if (data.logoUrl && logoPreview) {
        logoPreview.innerHTML = `
          <img src="${escapeHtml(data.logoUrl)}" alt="Logo" style="height: 60px; width: auto; object-fit: contain; border-radius: 8px; border: 1px solid var(--border-light);">
        `;
      }
    }
  } catch (err) {
    console.error("Error loading business profile:", err);
  }
}

function initBusinessForm() {
  const form = document.getElementById("businessSettingsForm");
  const logoInput = document.getElementById("logoFileInput");
  const saveBtn = document.getElementById("saveBusinessBtn");
  const statusNotice = document.getElementById("businessSaveNotice");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!isFirebaseConfigured() || !db) {
      alert("Firebase is not connected yet. Please check js/firebase-config.js.");
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving Changes...";

    try {
      let logoUrl = null;

      // Check if new logo file selected
      if (logoInput && logoInput.files && logoInput.files[0]) {
        const file = logoInput.files[0];
        // Validate type
        if (!file.type.startsWith("image/")) {
          throw new Error("Logo file must be an image (PNG, JPG, WEBP).");
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Logo file size must be under 5MB.");
        }

        const logoStorageRef = ref(storage, `business/logo_${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(logoStorageRef, file);
        logoUrl = await getDownloadURL(uploadResult.ref);
      }

      const updatePayload = {
        businessName: form.businessName.value.trim(),
        tagline: form.tagline.value.trim(),
        description: form.description.value.trim(),
        phone: form.phone.value.trim(),
        whatsapp: form.whatsapp.value.trim(),
        email: form.email.value.trim(),
        address: form.address.value.trim(),
        googleMapsUrl: form.googleMapsUrl.value.trim(),
        openingHours: form.openingHours.value.trim(),
        aboutUs: form.aboutUs.value.trim(),
        instagram: form.instagram.value.trim(),
        facebook: form.facebook.value.trim(),
        youtube: form.youtube.value.trim(),
        updatedAt: serverTimestamp()
      };

      if (logoUrl) {
        updatePayload.logoUrl = logoUrl;
      }

      await setDoc(doc(db, "businessSettings", "main"), updatePayload, { merge: true });

      if (statusNotice) {
        statusNotice.style.display = "block";
        statusNotice.textContent = "✓ Business settings updated successfully!";
        setTimeout(() => statusNotice.style.display = "none", 4000);
      }

      // Reload fresh data
      loadBusinessData();

    } catch (err) {
      console.error("Failed to save business settings:", err);
      alert("Error saving settings: " + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Business Information";
    }
  });
}
