export function requireAuthentication(request, response, next) {
  if (request.isAuthenticated?.() && request.user) {
    return next();
  }

  return response.status(401).json({
    success: false,
    message: "Authentication is required.",
  });
}