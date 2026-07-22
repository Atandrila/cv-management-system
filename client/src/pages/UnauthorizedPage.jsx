import { Link } from "react-router-dom";

function UnauthorizedPage() {
  return (
    <div className="container py-5 text-center">
      <i className="bi bi-shield-lock display-1 text-danger" />

      <h1 className="h2 mt-3">Access denied</h1>

      <p className="text-secondary">
        Your account does not have permission to open this page.
      </p>

      <Link className="btn btn-primary" to="/">
        Return home
      </Link>
    </div>
  );
}

export default UnauthorizedPage;