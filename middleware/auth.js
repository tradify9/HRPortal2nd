const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) {
    console.log('Auth: No token provided');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth: Decoded token', decoded);

    if (!decoded.user || !decoded.user.email || !decoded.user.role) {
      console.log('Auth: Invalid token payload', decoded);
      return res.status(401).json({ msg: 'Invalid token payload' });
    }

    req.user = decoded.user;
    console.log('Auth: User set', req.user);
    next();
  } catch (error) {
    console.error('Auth: Token verification error', error.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};