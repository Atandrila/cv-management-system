import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { usePreferences } from "../../contexts/PreferencesContext";

export default function Header() {
  const { user, loading, logout } = useAuth(); const { language, setLanguage, theme, setTheme, t } = usePreferences(); const navigate = useNavigate(); const [query, setQuery] = useState("");
  const roles = user?.roles || []; const staff = roles.includes("RECRUITER") || roles.includes("ADMIN"); const admin = roles.includes("ADMIN");
  const submitSearch = (event) => { event.preventDefault(); if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`); };
  const handleLogout = async () => { await logout(); navigate("/"); };
  return <header className="sticky-top">
    <nav className="navbar navbar-expand-xl bg-body-tertiary border-bottom shadow-sm">
      <div className="container-fluid px-lg-4">
        <NavLink className="navbar-brand fw-bold" to="/"><i className="bi bi-file-earmark-person-fill text-primary me-2" />CV Forge</NavLink>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavigation"><span className="navbar-toggler-icon" /></button>
        <div className="collapse navbar-collapse gap-3" id="mainNavigation">
          <ul className="navbar-nav"><li><NavLink className="nav-link" to="/">{t("home")}</NavLink></li><li><NavLink className="nav-link" to="/positions">{t("positions")}</NavLink></li>
            {user && <li><NavLink className="nav-link" to="/cvs">{t("cvs")}</NavLink></li>}{user && <li><NavLink className="nav-link" to="/profile">{t("profile")}</NavLink></li>}
            {staff && <li><NavLink className="nav-link" to="/attributes">{t("attributes")}</NavLink></li>}{admin && <li><NavLink className="nav-link" to="/admin/users">{t("users")}</NavLink></li>}
          </ul>
          <form className="d-flex flex-grow-1" role="search" onSubmit={submitSearch}><div className="input-group"><span className="input-group-text bg-body"><i className="bi bi-search" /></span><input className="form-control" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} /></div></form>
          <div className="d-flex align-items-center gap-2">
            <select className="form-select form-select-sm w-auto" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label={t("language")}><option value="EN">EN</option><option value="BN">বাংলা</option></select>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setTheme(theme === "LIGHT" ? "DARK" : "LIGHT")} title={t("theme")}><i className={`bi bi-${theme === "LIGHT" ? "moon-stars" : "sun"}`} /></button>
            {!loading && !user && <NavLink className="btn btn-primary btn-sm text-nowrap" to="/login">{t("signIn")}</NavLink>}
            {user && <div className="dropdown"><button className="btn btn-outline-primary btn-sm dropdown-toggle" data-bs-toggle="dropdown">{user.firstName || user.email}</button><ul className="dropdown-menu dropdown-menu-end"><li><span className="dropdown-item-text small text-secondary">{roles.join(", ")}</span></li><li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2" />{t("signOut")}</button></li></ul></div>}
          </div>
        </div>
      </div>
    </nav>
  </header>;
}
