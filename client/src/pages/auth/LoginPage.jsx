import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ErrorAlert } from "../../components/AsyncState";
import useAuth from "../../hooks/useAuth";

export default function LoginPage() {
  const { user, loading, loginWith, demoLogin, oauthAvailability, authError } = useAuth(); const [error, setError] = useState(null); const navigate = useNavigate(); const [params] = useSearchParams();
  const failedProvider = params.get("provider"); const failureReason = params.get("reason");
  if (!loading && user) return <Navigate to="/" replace />;
  const demo = async (role) => { try { await demoLogin(role); navigate(role === "CANDIDATE" ? "/profile" : "/positions"); } catch (e) { setError(e); } };
  return <div className="container py-5"><div className="login-panel mx-auto border rounded-4 shadow-sm p-4 p-md-5"><div className="text-center"><i className="bi bi-file-earmark-person-fill display-3 text-primary" /><h1 className="h2 mt-3">Welcome to CV Forge</h1><p className="text-secondary">Use a social provider, or enter instantly with a local demo account.</p></div><ErrorAlert error={error || (authError ? new Error(authError) : null)} />
    {params.get("login") === "failed" && <div className="alert alert-danger">{failureReason === "not_configured" ? `${failedProvider === "google" ? "Google" : "GitHub"} OAuth credentials are not configured in server/.env.` : `${failedProvider === "google" ? "Google" : "GitHub"} sign-in failed${failureReason ? `: ${failureReason}` : "."}`}</div>}
    <div className="d-grid gap-2"><button className="btn btn-dark btn-lg" disabled={!oauthAvailability.github} onClick={() => loginWith("github")}><i className="bi bi-github me-2" />Continue with GitHub {!oauthAvailability.github && "(not configured)"}</button><button className="btn btn-outline-danger btn-lg" disabled={!oauthAvailability.google} onClick={() => loginWith("google")}><i className="bi bi-google me-2" />Continue with Google {!oauthAvailability.google && "(not configured)"}</button></div>
    <div className="d-flex align-items-center gap-3 my-4"><hr className="flex-grow-1" /><span className="text-secondary small">FREE LOCAL DEMO</span><hr className="flex-grow-1" /></div><div className="row g-2">{["CANDIDATE", "RECRUITER", "ADMIN"].map((role) => <div className="col-md-4" key={role}><button className="btn btn-outline-primary w-100" onClick={() => demo(role)}>{role[0] + role.slice(1).toLowerCase()}</button></div>)}</div><p className="small text-secondary text-center mt-3 mb-0">OAuth buttons activate when free GitHub/Google app credentials are added. Demo login needs no external service.</p></div></div>;
}
