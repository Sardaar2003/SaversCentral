import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log(`[DEBUG][AUTH-MW] Token received: ${token.substring(0, 20)}...`);

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey123');
      console.log(`[DEBUG][AUTH-MW] Token decoded — userId: ${decoded.id}, issued: ${new Date(decoded.iat * 1000).toISOString()}, expires: ${new Date(decoded.exp * 1000).toISOString()}`);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        console.log(`[DEBUG][AUTH-MW] REJECTED — user not found in DB for decoded userId: ${decoded.id}`);
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      console.log(`[DEBUG][AUTH-MW] Authenticated — user: "${req.user.username}", role: "${req.user.role}", status: "${req.user.status}"`);
      
      if (req.user.status === 'inactive') {
        console.log(`[DEBUG][AUTH-MW] REJECTED — account deactivated for user: "${req.user.username}"`);
        return res.status(403).json({ success: false, message: 'Account is deactivated' });
      }

      next();
    } catch (error) {
      console.error(`[DEBUG][AUTH-MW] Token verification FAILED:`, error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token validation failed' });
    }
  }

  if (!token) {
    console.log(`[DEBUG][AUTH-MW] REJECTED — no Bearer token in Authorization header`);
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};
