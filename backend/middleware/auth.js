const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'];

    let user;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findByPk(decoded.userId);
    } else if (apiKey) {
      user = await User.findOne({ where: { apiKey, isActive: true } });
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    req.userId = user.id;
    req.user = user;
    req.userRole = user.role;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      if (user && user.isActive) {
        req.userId = user.id;
        req.user = user;
        req.userRole = user.role;
      }
    }
  } catch (error) {
    // Continue without auth
  }
  next();
};

module.exports = { authenticate, authorize, optionalAuth };