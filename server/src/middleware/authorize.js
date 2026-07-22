export function requireAnyRole(...allowedRoles) {
  return (request, response, next) => {
    if (!request.user) {
      return response.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const userRoles = request.user.roles.map(
      (userRole) => userRole.role.name,
    );

    const hasPermission = allowedRoles.some((role) =>
      userRoles.includes(role),
    );

    if (!hasPermission) {
      return response.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }

    return next();
  };
}