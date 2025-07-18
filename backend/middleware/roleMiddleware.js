// middleware/roleMiddleware.js

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Acceso denegado: rol insuficiente' });
    }

    next();
  };
}

module.exports = authorizeRoles;
