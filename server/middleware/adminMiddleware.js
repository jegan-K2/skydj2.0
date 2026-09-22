/* ==========================================================================
   Admin Middleware — Role Authorization
   ========================================================================== */

const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '403 Forbidden — Admin access required.' });
  }
  next();
};

module.exports = adminMiddleware;
