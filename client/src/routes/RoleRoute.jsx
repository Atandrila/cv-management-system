import { Navigate, Outlet } from "react-router-dom";

import useAuth from "../hooks/useAuth";

function RoleRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div
          className="spinner-border"
          role="status"
          aria-label="Checking permission"
        />

        <p className="mt-3 mb-0">Checking permission...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRoles = Array.isArray(user.roles) ? user.roles : [];

  const hasRequiredRole = allowedRoles.some((role) =>
    userRoles.includes(role),
  );

  if (!hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export default RoleRoute;