/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT - SETTINGS MODULE (settings.js)
   Firebase connection tester, password update, and custom config manager
   ========================================================================== */

import { 
  auth, 
  db, 
  storage, 
  updatePassword, 
  collection, 
  getDocs, 
  limit, 
  query, 
  firebaseConfig, 
  isFirebaseConfigured 
} from "../../js/firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {
  displayCurrentConfig();
  initTestConnection();
  initPasswordForm();
  initConfigOverrideForm();
});

function displayCurrentConfig() {
  const statusEl = document.getElementById("connectionStatusIndicator");
  const projectIdEl = document.getElementById("configProjectId");
  const authDomainEl = document.getElementById("configAuthDomain");
  const storageBucketEl = document.getElementById("configStorageBucket");

  if (projectIdEl) projectIdEl.textContent = firebaseConfig.projectId || "Not configured";
  if (authDomainEl) authDomainEl.textContent = firebaseConfig.authDomain || "Not configured";
  if (storageBucketEl) storageBucketEl.textContent = firebaseConfig.storageBucket || "Not configured";

  if (statusEl) {
    if (isFirebaseConfigured()) {
      statusEl.innerHTML = `<span class="status-pill status-approved">CONNECTED / CONFIGURED</span>`;
    } else {
      statusEl.innerHTML = `<span class="status-pill status-pending">SETUP REQUIRED</span>`;
    }
  }
}

function initTestConnection() {
  const btn = document.getElementById("testConnectionBtn");
  const output = document.getElementById("connectionTestOutput");

  if (!btn || !output) return;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Testing Services...";
    output.style.display = "block";
    output.innerHTML = "<div>Running Firebase diagnostics...</div>";

    let log = [];

    // 1. Check Config
    if (isFirebaseConfigured()) {
      log.push("<div style='color: #10b981;'>✓ Configuration keys present.</div>");
    } else {
      log.push("<div style='color: #f59e0b;'>⚠️ Default placeholder keys detected in js/firebase-config.js.</div>");
    }

    // 2. Test Auth
    if (auth && auth.currentUser) {
      log.push(`<div style='color: #10b981;'>✓ Firebase Auth active. Signed in as: ${auth.currentUser.email}</div>`);
    } else {
      log.push("<div style='color: #f59e0b;'>ℹ Not currently signed into Firebase Auth or session expired.</div>");
    }

    // 3. Test Firestore
    try {
      if (db) {
        const testQuery = query(collection(db, "businessSettings"), limit(1));
        await getDocs(testQuery);
        log.push("<div style='color: #10b981;'>✓ Cloud Firestore read connectivity successful.</div>");
      } else {
        log.push("<div style='color: #ef4444;'>✕ Firestore service not initialized.</div>");
      }
    } catch (err) {
      log.push(`<div style='color: #ef4444;'>✕ Firestore query returned: ${err.message}</div>`);
    }

    // 4. Test Storage
    if (storage) {
      log.push("<div style='color: #10b981;'>✓ Firebase Storage initialized.</div>");
    } else {
      log.push("<div style='color: #ef4444;'>✕ Firebase Storage not initialized.</div>");
    }

    output.innerHTML = log.join("");
    btn.disabled = false;
    btn.textContent = "Test Firebase Connection";
  });
}

function initPasswordForm() {
  const form = document.getElementById("updatePasswordForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newPass = form.newPassword.value;
    const confirmPass = form.confirmPassword.value;
    const submitBtn = form.querySelector("button[type='submit']");

    if (newPass !== confirmPass) {
      alert("New passwords do not match.");
      return;
    }

    if (newPass.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    if (!auth || !auth.currentUser) {
      alert("You must be actively signed in to change password.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Updating Password...";

    try {
      await updatePassword(auth.currentUser, newPass);
      alert("Password updated successfully! Please use your new password next time you sign in.");
      form.reset();
    } catch (err) {
      console.error("Password update error:", err);
      if (err.code === "auth/requires-recent-login") {
        alert("This operation is sensitive and requires recent authentication. Please log out and sign in again before changing your password.");
      } else {
        alert("Failed to update password: " + err.message);
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Update Password";
    }
  });
}

function initConfigOverrideForm() {
  const form = document.getElementById("configOverrideForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const raw = form.firebaseConfigJson.value.trim();
    if (!raw) {
      // Clear override
      localStorage.removeItem("sky_firebase_custom_config");
      alert("Custom Firebase configuration removed. Reverting to default configuration file.");
      window.location.reload();
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error("Configuration JSON must at least include apiKey and projectId.");
      }

      localStorage.setItem("sky_firebase_custom_config", JSON.stringify(parsed));
      alert("Firebase configuration saved successfully! Reloading application...");
      window.location.reload();

    } catch (err) {
      alert("Invalid JSON format: " + err.message);
    }
  });
}
