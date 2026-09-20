/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT - ADMIN AUTH MODULE (auth.js)
   Firebase Authentication Guard, Admin Verification, Sign-in, Sign-out, Route Protection
   ========================================================================== */

import { 
  auth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  isFirebaseConfigured,
  checkUserIsAdmin
} from "../../js/firebase-config.js";

// Check authentication state on all admin pages
export function initAuthGuard() {
  const isLoginPage = window.location.pathname.endsWith("admin-login.html") || 
                      window.location.pathname.endsWith("admin-login") ||
                      window.location.pathname.endsWith("login.html");

  if (!auth) {
    if (!isLoginPage) {
      window.location.href = "admin-login.html";
    }
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const isAdmin = await checkUserIsAdmin(user);
      if (!isAdmin && !isLoginPage) {
        console.warn("Unauthorized account attempt:", user.email);
        await signOut(auth);
        alert("Access Denied. Your account does not have administrator privileges.");
        window.location.href = "admin-login.html";
        return;
      }

      if (isLoginPage && isAdmin) {
        window.location.href = "admin-dashboard.html";
      } else {
        injectAdminEmail(user.email);
      }
    } else {
      if (!isLoginPage) {
        window.location.href = "admin-login.html";
      }
    }
  });

  // Setup logout buttons
  document.querySelectorAll(".admin-logout-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await signOut(auth);
        window.location.href = "admin-login.html";
      } catch (err) {
        alert("Logout failed: " + err.message);
      }
    });
  });

  // Setup sidebar mobile toggle
  const sidebarToggle = document.getElementById("adminSidebarToggle");
  const sidebar = document.querySelector(".admin-sidebar");
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }
}

function injectAdminEmail(email) {
  const el = document.getElementById("adminUserEmail");
  if (el && email) {
    el.textContent = email;
  }
}

// Login form handler
export function initLoginForm() {
  const form = document.getElementById("adminLoginForm");
  const errorBox = document.getElementById("loginErrorBox");
  const resetBtn = document.getElementById("forgotPasswordBtn");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    const submitBtn = form.querySelector("button[type='submit']");

    if (errorBox) errorBox.style.display = "none";

    if (!isFirebaseConfigured()) {
      if (errorBox) {
        errorBox.textContent = "Firebase project configuration required. Please configure your Firebase credentials in js/firebase-config.js.";
        errorBox.style.display = "block";
      }
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Verifying & Signing in...";

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      const isAdmin = await checkUserIsAdmin(cred.user);
      if (!isAdmin) {
        await signOut(auth);
        throw new Error("Access Denied: Account does not have administrative permissions.");
      }

      window.location.href = "admin-dashboard.html";
    } catch (err) {
      console.error("Admin Login error:", err);
      if (errorBox) {
        let msg = "Invalid email or password.";
        if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
          msg = "Invalid admin credentials. Please verify your email and password.";
        } else if (err.code === "auth/too-many-requests") {
          msg = "Access temporarily blocked due to multiple failed login attempts. Try again later.";
        } else {
          msg = err.message;
        }
        errorBox.textContent = msg;
        errorBox.style.display = "block";
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign In to Admin Portal";
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      const email = form.email.value.trim().toLowerCase();
      if (!email) {
        alert("Please enter your admin email address first.");
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        alert(`Password reset instructions sent to ${email}`);
      } catch (err) {
        alert("Could not send password reset: " + err.message);
      }
    });
  }
}

// Auto-run auth guard
document.addEventListener("DOMContentLoaded", () => {
  initAuthGuard();
});
