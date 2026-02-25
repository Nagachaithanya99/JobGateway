import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="card p-10 text-center max-w-md w-full">
        <h1 className="text-3xl font-extrabold">404</h1>
        <p className="text-muted mt-2">Page not found.</p>
        <Link className="btn-primary mt-6 inline-flex" to="/admin">
          Go Dashboard
        </Link>
      </div>
    </div>
  );
}
