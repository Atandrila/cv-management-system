import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ErrorAlert } from "../../components/AsyncState";
import useAuth from "../../hooks/useAuth";

export default function LoginPage() {
  const { user, loading, loginWith, demoLogin, oauthAvailability, demoLoginAvailable, authError } = useAuth();
  const [error, setError] = useState(null); const navigate = useNavigate(); const [params] = useSearchParams();
  const failedProvider = params.get("provider"); const failureReason = params.get("reason");
  if (!loading && user) return <Navigate to="/" replace />;
  const demo = async (role) => { try { await demoLogin(role); navigate(role === "CANDIDATE" ? "/profile" : "/positions"); } catch (e) { setError(e); } };
  return <div className="login-page"><div className="login-orb login-orb-one" /><div className="login-orb login-orb-two" />
    <div className="container"><div className="login-shell">
      <section className="login-story"><div><span className="brand-mark"><i className="bi bi-file-earmark-person-fill" /></span><span className="login-brand">CV Forge</span></div><div className="login-message"><span className="eyebrow light"><i className="bi bi-stars" /> Your next move starts here</span><h2>Build once.<br />Apply with confidence.</h2><p>A focused workspace for candidates and hiring teams to create better matches, faster.</p><div className="login-feature"><i className="bi bi-lightning-charge-fill" /><span><strong>Smart CV generation</strong><small>Your profile becomes a role-ready CV in seconds.</small></span></div><div className="login-feature"><i className="bi bi-shield-check" /><span><strong>Secure by design</strong><small>Trusted OAuth sign-in and protected role access.</small></span></div></div><small className="login-quote">“A clearer path from experience to opportunity.”</small></section>
      <section className="login-card"><div className="login-card-inner"><span className="mobile-brand"><span className="brand-mark brand-mark-sm"><i className="bi bi-file-earmark-person-fill" /></span> CV Forge</span><div className="login-heading"><span>WELCOME BACK</span><h1>Sign in to your workspace</h1><p>Choose your preferred secure provider to continue.</p></div><ErrorAlert error={error || (authError ? new Error(authError) : null)} />
        {params.get("login") === "failed" && <div className="alert alert-danger">{failureReason === "not_configured" ? `${failedProvider === "google" ? "Google" : "GitHub"} OAuth credentials are not configured.` : `${failedProvider === "google" ? "Google" : "GitHub"} sign-in failed${failureReason ? `: ${failureReason}` : "."}`}</div>}
        <div className="oauth-stack"><button className="oauth-button github" disabled={!oauthAvailability.github} onClick={() => loginWith("github")}><i className="bi bi-github" /><span>Continue with GitHub</span><i className="bi bi-arrow-right" /></button><button className="oauth-button google" disabled={!oauthAvailability.google} onClick={() => loginWith("google")}><span className="google-g">G</span><span>Continue with Google</span><i className="bi bi-arrow-right" /></button></div>
        {demoLoginAvailable && <div className="demo-login"><div className="divider"><span>Local development only</span></div><div className="row g-2">{["CANDIDATE", "RECRUITER", "ADMIN"].map((role) => <div className="col" key={role}><button className="btn btn-outline-secondary btn-sm w-100" onClick={() => demo(role)}>{role[0] + role.slice(1).toLowerCase()}</button></div>)}</div></div>}
        <div className="role-note"><i className="bi bi-info-circle" /><span>New accounts begin as <strong>Candidates</strong>. Staff access is assigned securely by an administrator.</span></div><p className="login-terms">By continuing, you agree to responsible use of the platform.</p>
      </div></section>
    </div></div>
  </div>;
}
