/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT - ADMIN AUTH MODULE (auth.js)
   JWT-based Authentication Guard, Sign-out, Route Protection
   ========================================================================== */

// Check authentication state on all admin pages
function initAuthGuard() {
  const isLoginPage = window.location.pathname.endsWith("admin-login.html") || 
                      window.location.pathname.endsWith("admin-login");

  const token = window.getAuthToken ? window.getAuthToken() : localStorage.getItem("sky_auth_token");

  if (!token) {
    if (!isLoginPage) {
      window.location.href = "admin-login.html";
    }
    return;
  }

  // Verify token and check admin role
  fetch("/api/auth/me", {
    headers: { "Authorization": "Bearer " + token }
  })
  .then(resp => resp.json())
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
  .catch(() => {
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
