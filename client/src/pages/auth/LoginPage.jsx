import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ErrorAlert } from "../../components/AsyncState";
import { usePreferences } from "../../contexts/PreferencesContext";
import useAuth from "../../hooks/useAuth";

export default function LoginPage() {
  const { user, loading, loginWith, demoLogin, evaluationLogin, oauthAvailability, demoLoginAvailable, evaluationLoginAvailable, authError } = useAuth();
  const { t } = usePreferences();
  const [error, setError] = useState(null); const [evaluationEmail, setEvaluationEmail] = useState(""); const [evaluationPassword, setEvaluationPassword] = useState(""); const [submitting, setSubmitting] = useState(false); const navigate = useNavigate(); const [params] = useSearchParams();
  const failedProvider = params.get("provider"); const failureReason = params.get("reason");
  if (!loading && user) return <Navigate to="/" replace />;
  const demo = async (role) => { try { await demoLogin(role); navigate(role === "CANDIDATE" ? "/profile" : "/positions"); } catch (e) { setError(e); } };
  const submitEvaluation = async (event) => {
    event.preventDefault(); setSubmitting(true); setError(null);
    try {
      const account = await evaluationLogin(evaluationEmail, evaluationPassword);
      navigate(account.roles.includes("ADMIN") ? "/admin/users" : "/cvs");
    } catch (requestError) { setError(requestError); }
    finally { setSubmitting(false); }
  };
  return <div className="login-page"><div className="login-orb login-orb-one" /><div className="login-orb login-orb-two" />
    <div className="container"><div className="login-shell">
      <section className="login-story"><div><span className="brand-mark"><i className="bi bi-file-earmark-person-fill" /></span><span className="login-brand">CV Forge</span></div><div className="login-message"><span className="eyebrow light"><i className="bi bi-stars" /> Your next move starts here</span><h2>Build once.<br />Apply with confidence.</h2><p>A focused workspace for candidates and hiring teams to create better matches, faster.</p><div className="login-feature"><i className="bi bi-lightning-charge-fill" /><span><strong>Smart CV generation</strong><small>Your profile becomes a role-ready CV in seconds.</small></span></div><div className="login-feature"><i className="bi bi-shield-check" /><span><strong>Secure by design</strong><small>Trusted OAuth sign-in and protected role access.</small></span></div></div><small className="login-quote">“A clearer path from experience to opportunity.”</small></section>
      <section className="login-card"><div className="login-card-inner"><span className="mobile-brand"><span className="brand-mark brand-mark-sm"><i className="bi bi-file-earmark-person-fill" /></span> CV Forge</span><div className="login-heading"><span>WELCOME BACK</span><h1>Sign in to your workspace</h1><p>Choose your preferred secure provider to continue.</p></div><ErrorAlert error={error || (authError ? new Error(authError) : null)} />
        {params.get("login") === "failed" && <div className="alert alert-danger">{failureReason === "not_configured" ? `${failedProvider === "google" ? "Google" : "GitHub"} OAuth credentials are not configured.` : `${failedProvider === "google" ? "Google" : "GitHub"} sign-in failed${failureReason ? `: ${failureReason}` : "."}`}</div>}
        <div className="oauth-stack"><button className="oauth-button github" disabled={!oauthAvailability.github} onClick={() => loginWith("github")}><i className="bi bi-github" /><span>Continue with GitHub</span><i className="bi bi-arrow-right" /></button><button className="oauth-button google" disabled={!oauthAvailability.google} onClick={() => loginWith("google")}><span className="google-g">G</span><span>Continue with Google</span><i className="bi bi-arrow-right" /></button></div>
        {evaluationLoginAvailable && <form className="demo-login" onSubmit={submitEvaluation}>
          <div className="divider"><span>{t("evaluatorAccess")}</span></div>
          <p className="small text-secondary">{t("evaluatorHelp")}</p>
          <div className="mb-2"><label className="form-label" htmlFor="evaluation-email">{t("email")}</label><input id="evaluation-email" className="form-control" type="email" autoComplete="username" required value={evaluationEmail} onChange={(event) => setEvaluationEmail(event.target.value)} /></div>
          <div className="mb-3"><label className="form-label" htmlFor="evaluation-password">{t("password")}</label><input id="evaluation-password" className="form-control" type="password" autoComplete="current-password" required value={evaluationPassword} onChange={(event) => setEvaluationPassword(event.target.value)} /></div>
          <button className="btn btn-primary w-100" disabled={submitting}>{submitting ? t("loading") : t("evaluatorSignIn")}</button>
        </form>}
        {demoLoginAvailable && <div className="demo-login"><div className="divider"><span>Local development only</span></div><div className="row g-2">{["CANDIDATE", "RECRUITER", "ADMIN"].map((role) => <div className="col" key={role}><button className="btn btn-outline-secondary btn-sm w-100" onClick={() => demo(role)}>{role[0] + role.slice(1).toLowerCase()}</button></div>)}</div></div>}
        <div className="role-note"><i className="bi bi-info-circle" /><span>New accounts begin as <strong>Candidates</strong>. Staff access is assigned securely by an administrator.</span></div><p className="login-terms">By continuing, you agree to responsible use of the platform.</p>
      </div></section>
    </div></div>
  </div>;
}
