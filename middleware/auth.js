const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    console.log('Auth: No token provided', { url: req.url, method: req.method });
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.employeeId || !decoded.role) {
      console.log('Auth: Invalid token payload', { url: req.url, method: req.method, payload: decoded });
      return res.status(401).json({ msg: 'Invalid token payload' });
    }
    req.user = decoded;
    console.log('Auth: Token verified', { employeeId: decoded.employeeId, role: decoded.role, url: req.url, method: req.method });
    next();
  } catch (error) {
    console.error('Auth error:', { error: error.message, url: req.url, method: req.method });
    res.status(401).json({ msg: 'Token is invalid or expired' });
  }
};