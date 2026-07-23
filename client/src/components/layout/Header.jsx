import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { usePreferences } from "../../contexts/PreferencesContext";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const { language, setLanguage, theme, setTheme, t } = usePreferences();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const roles = user?.roles || [];
  const staff = roles.includes("RECRUITER") || roles.includes("ADMIN");
  const admin = roles.includes("ADMIN");
  const initials = `${user?.firstName?.[0] || user?.email?.[0] || "U"}${user?.lastName?.[0] || ""}`.toUpperCase();
  const submitSearch = (event) => { event.preventDefault(); if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`); };
  const handleLogout = async () => { await logout(); navigate("/"); };

  return <header className="app-header sticky-top">
    <nav className="navbar navbar-expand-xl">
      <div className="container-fluid app-nav-wrap">
        <NavLink className="navbar-brand app-brand" to="/"><span className="brand-mark"><i className="bi bi-file-earmark-person-fill" /></span><span><strong>CV Forge</strong><small>Career workspace</small></span></NavLink>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavigation" aria-controls="mainNavigation" aria-expanded="false" aria-label="Toggle navigation"><i className="bi bi-list" /></button>
        <div className="collapse navbar-collapse" id="mainNavigation">
          <ul className="navbar-nav app-nav-links"><li><NavLink className="nav-link" to="/" end>{t("home")}</NavLink></li><li><NavLink className="nav-link" to="/positions">{t("positions")}</NavLink></li>
            {user && <li><NavLink className="nav-link" to="/cvs">{t("cvs")}</NavLink></li>}{user && <li><NavLink className="nav-link" to="/profile">{t("profile")}</NavLink></li>}
            {staff && <li><NavLink className="nav-link" to="/attributes">{t("attributes")}</NavLink></li>}{admin && <li><NavLink className="nav-link" to="/admin/users">{t("users")}</NavLink></li>}
          </ul>
          <form className="app-search" role="search" onSubmit={submitSearch}><i className="bi bi-search" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} /></form>
          <div className="app-nav-actions">
            <select className="nav-select" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label={t("language")}><option value="EN">{t("english")}</option><option value="BN">{t("bengali")}</option></select>
            <button className="nav-icon-btn" onClick={() => setTheme(theme === "LIGHT" ? "DARK" : "LIGHT")} title={t("theme")} aria-label={t("theme")}><i className={`bi bi-${theme === "LIGHT" ? "moon-stars" : "sun"}`} /></button>
            {!loading && !user && <NavLink className="btn btn-primary btn-sm text-nowrap app-signin" to="/login">{t("signIn")} <i className="bi bi-arrow-up-right" /></NavLink>}
            {user && <div className="dropdown"><button className="user-menu" data-bs-toggle="dropdown" aria-expanded="false"><span className="user-avatar">{initials}</span><span className="user-copy"><strong>{user.firstName || t("account")}</strong><small>{roles[0] === "ADMIN" ? t("administrator") : roles[0] === "RECRUITER" ? t("recruiter") : t("candidate")}</small></span><i className="bi bi-chevron-down" /></button><ul className="dropdown-menu dropdown-menu-end user-dropdown"><li><div className="dropdown-item-text"><strong>{[user.firstName, user.lastName].filter(Boolean).join(" ") || t("account")}</strong><small className="d-block text-secondary text-truncate">{user.email}</small></div></li><li><hr className="dropdown-divider" /></li><li><NavLink className="dropdown-item" to="/profile"><i className="bi bi-person me-2" />{t("profile")}</NavLink></li><li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2" />{t("signOut")}</button></li></ul></div>}
          </div>
        </div>
      </div>
    </nav>
  </header>;
}
