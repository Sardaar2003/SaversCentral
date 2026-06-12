export const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'Guest';
    const allowed = roles.includes(userRole);
    console.log(`[DEBUG][RBAC] Route requires roles: [${roles.join(', ')}] — user role: "${userRole}" — ${allowed ? 'GRANTED ✓' : 'DENIED ✗'}`);

    if (!req.user || !roles.includes(req.user.role)) {
      console.log(`[DEBUG][RBAC] Access DENIED for user "${req.user?.username || 'unknown'}" on ${req.method} ${req.originalUrl}`);
      return res.status(403).json({
        success: false,
        message: `User role '${userRole}' is not authorized to access this route.`
      });
    }
    next();
  };
};
