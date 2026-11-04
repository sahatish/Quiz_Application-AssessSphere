const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the JWT from the Authorization header (Bearer <token>).
 * Attaches req.currentUser if valid, otherwise leaves it null.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'assesssphere_jwt_secret');
        const user = await User.findById(decoded.id).populate('createdBy');
        req.currentUser = user || null;
      }
    } else {
      req.currentUser = null;
    }
  } catch {
    req.currentUser = null;
  }
  next();
};

/**
 * Hard-require an authenticated user. Returns 401 if missing.
 */
const requireAuth = (req, res, next) => {
  if (!req.currentUser) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

/**
 * Hard-require an ADMIN user. Returns 403 if not admin.
 */
const requireAdmin = (req, res, next) => {
  if (!req.currentUser || req.currentUser.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Forbidden — Admin only' });
  }
  next();
};

module.exports = { authMiddleware, requireAuth, requireAdmin };
