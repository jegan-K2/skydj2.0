/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT — CENTRALIZED API CONFIGURATION (api-config.js)
   Automatically detects the correct API base URL and uploads base URL
   depending on whether the page is served from Express (5000),
   VS Code Live Server (5500/5501), or Vercel production.

   RULES:
     - Live Server (port 5500 or 5501) → API is at http://localhost:5000/api
     - Express   (port 5000)           → API is at /api  (same origin)
     - Vercel    (port empty/443)      → API is at /api  (same origin)

   This file MUST be loaded before any other script that calls the API.
   All pages include it as: <script src="./js/api-config.js"></script>
   ========================================================================== */

(function () {
  'use strict';

  /* ── Detect environment ─────────────────────────────────────────────── */
  var port         = window.location.port;        // "5000", "5500", ""
  var hostname     = window.location.hostname;    // "localhost", "127.0.0.1", "skydj.vercel.app"
  var protocol     = window.location.protocol;    // "http:", "https:", "file:"
  var isLocalHost  = (hostname === 'localhost' || hostname === '127.0.0.1' || protocol === 'file:');
  var isExpress    = (isLocalHost && port === '5000');
  var isLiveServer = (isLocalHost && !isExpress); // e.g. 5500, 5501, or any frontend dev server port

  /* ── API Base URL ───────────────────────────────────────────────────── */
  // Preferred behavior:
  //   - Live Server (127.0.0.1:5500, localhost:5500, etc.) → http://localhost:5000/api
  //   - Express     (localhost:5000, 127.0.0.1:5000)       → /api
  //   - Vercel      (production)                           → /api
  var API_BASE = isLiveServer
    ? 'http://localhost:5000/api'
    : '/api';

  /* ── Uploads Base URL ───────────────────────────────────────────────── */
  // Uploaded files (/uploads/...) are served ONLY by Express (port 5000).
  // When running on Live Server, prefix backend origin.
  var UPLOADS_BASE = isLiveServer
    ? 'http://localhost:5000'
    : '';

  /* ── Network Error Diagnostic Helper ────────────────────────────────── */
  async function diagnoseFetchFailure(url, originalErr) {
    // 1. Offline network error
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      var netErr = new Error('Network error: You appear to be offline. Please check your internet connection.');
      netErr.isNetworkError = true;
      netErr.errorType = 'network_error';
      netErr.originalError = originalErr;
      return netErr;
    }

    // 2. Health check ping to differentiate CORS error from backend down
    var healthUrl = isLiveServer ? 'http://localhost:5000/api/health' : '/api/health';
    var isAlive = false;
    try {
      // In browsers, fetch with mode: 'no-cors' resolves (opaque) when server is listening,
      // but throws TypeError if the server is offline / connection refused.
      await fetch(healthUrl, { method: 'GET', mode: 'no-cors', cache: 'no-store' });
      isAlive = true;
    } catch (e) {
      isAlive = false;
    }

    if (isAlive) {
      var corsErr = new Error('CORS error: Backend server is reachable at http://localhost:5000, but your browser blocked the request due to CORS policy. Ensure your origin is allowed.');
      corsErr.isCorsError = true;
      corsErr.errorType = 'cors_error';
      corsErr.originalError = originalErr;
      return corsErr;
    }

    // 3. Truly unreachable backend
    var msg =
      'Backend server is not running or is unreachable.\n' +
      'Please start the Express server with:\n\n  npm start\n\n' +
      'Then refresh this page.';
    var err = new Error(msg);
    err.isNetworkError = true;
    err.errorType = 'backend_unreachable';
    err.originalError = originalErr;
    return err;
  }

  /* ── apiFetch(path, options) ────────────────────────────────────────── */
  /**
   * Drop-in replacement for fetch() calls against the API.
   * Prepends the correct API base URL automatically.
   *
   * @param {string}      path    - e.g. '/auth/signup', '/auth/login', '/equipment'
   * @param {RequestInit} options - standard fetch options (optional)
   * @returns {Promise<Response>}
   */
  async function apiFetch(path, options) {
    var cleanPath = (typeof path === 'string' && path.startsWith('/')) ? path : '/' + (path || '');
    // Prevent double '/api' if caller inadvertently passed '/api/...'
    if (cleanPath.startsWith('/api/')) {
      cleanPath = cleanPath.slice(4);
    }
    var url = API_BASE + cleanPath;
    try {
      var resp = await fetch(url, options);
      return resp;
    } catch (networkErr) {
      var diagnosedErr = await diagnoseFetchFailure(url, networkErr);
      throw diagnosedErr;
    }
  }

  /* ── resolveUploadUrl(imageUrl) ─────────────────────────────────────── */
  /**
   * Ensures that upload paths (/uploads/...) always point to Express,
   * even when the frontend is being served from Live Server.
   * Absolute URLs (http/https) are returned unchanged.
   *
   * @param {string} imageUrl - URL string from the API, e.g. '/uploads/equipment/foo.jpg'
   * @returns {string}
   */
  function resolveUploadUrl(imageUrl) {
    if (!imageUrl) return '';
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    return UPLOADS_BASE + imageUrl;
  }

  /* ── Expose as globals ──────────────────────────────────────────────── */
  window.API_BASE         = API_BASE;
  window.API_BASE_URL     = API_BASE;
  window.UPLOADS_BASE     = UPLOADS_BASE;
  window.apiFetch         = apiFetch;
  window.resolveUploadUrl = resolveUploadUrl;

  // Dev/debug info (read via console: window._skyDjEnv)
  window._skyDjEnv = {
    isLiveServer : isLiveServer,
    port         : port,
    hostname     : hostname,
    API_BASE     : API_BASE,
    API_BASE_URL : API_BASE,
    UPLOADS_BASE : UPLOADS_BASE
  };

})();
