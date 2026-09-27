/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT - ADMIN AUTH MODULE (auth.js)
   JWT-based Authentication Guard, Sign-out, Route Protection
   Works from both Express (port 5000) and VS Code Live Server (port 5500).
   Depends on api-config.js being loaded first (provides window.apiFetch).
   ========================================================================== */

// Check authentication state on all admin pages
function initAuthGuard() {
  const pathname = window.location.pathname;
  const isLoginPage = pathname.endsWith("admin-login.html") ||
                      pathname.endsWith("admin-login");

  const token = window.getAuthToken ? window.getAuthToken() : localStorage.getItem("sky_auth_token");

  if (!token) {
    if (!isLoginPage) {
      window.location.href = "admin-login.html";
    }
    return;
  }

  // apiFetch from api-config.js handles the correct base URL for any serving origin
  const doFetch = (typeof window.apiFetch === 'function')
    ? (path, opts) => window.apiFetch(path, opts)
    : (path, opts) => fetch((window.API_BASE_URL || window.API_BASE || 'http://localhost:5000/api') + path, opts);

  // Verify token and check admin role
  doFetch("/auth/me", {
    headers: { "Authorization": "Bearer " + token }
  })
  .then(resp => {
    if (!resp.ok) {
      throw new Error("Auth check failed with status " + resp.status);
    }
    return resp.json();
  })
  .then(data => {
    if (!data.success || !data.user) {
      if (!isLoginPage) {
        if (window.clearAuth) window.clearAuth();
        window.location.href = "admin-login.html";
      }
      return;
    }

    if (data.user.role !== "admin") {
      if (window.clearAuth) window.clearAuth();
      alert("Access Denied. Your account does not have administrator privileges.");
      window.location.href = "admin-login.html";
      return;
    }

    if (isLoginPage) {
      window.location.href = "admin-dashboard.html";
    } else {
      injectAdminEmail(data.user.email);
    }
  })
  .catch(err => {
    console.warn("Admin auth guard error:", err);
    if (!isLoginPage) {
      if (window.clearAuth) window.clearAuth();
      window.location.href = "admin-login.html";
    }
  });

  // Setup logout buttons
  document.querySelectorAll(".admin-logout-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.clearAuth) window.clearAuth();
      window.location.href = "admin-login.html";
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

// Auto-run auth guard
document.addEventListener("DOMContentLoaded", () => {
  initAuthGuard();
});
