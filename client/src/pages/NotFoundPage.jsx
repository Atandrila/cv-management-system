import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="container py-5 text-center">
      <div className="display-1 fw-bold">404</div>

      <h1 className="h2">Page not found</h1>

      <p className="text-secondary">
        The requested page does not exist.
      </p>

      <Link className="btn btn-primary" to="/">
        Return home
      </Link>
    </div>
  );
}

export default NotFoundPage;