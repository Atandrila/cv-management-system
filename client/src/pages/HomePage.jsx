import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { ErrorAlert, Loading } from "../components/AsyncState";
import { usePreferences } from "../contexts/PreferencesContext";
import useAuth from "../hooks/useAuth";

const metricMeta = {
  positions: ["positions", "briefcase"], candidates: ["candidates", "people"], recruiters: ["recruiters", "person-workspace"], submitted: ["publishedCvs", "file-earmark-check"], recentCvs: ["cvsToday", "activity"],
};

export default function HomePage() {
  const { user } = useAuth();
  const { t } = usePreferences();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { api("/dashboard").then(setData).catch(setError); }, []);

  return <>
    <section className="hero">
      <div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" />
      <div className="container hero-inner"><div className="row align-items-center g-5">
        <div className="col-lg-7 hero-copy">
          <div className="eyebrow"><span className="pulse-dot" />{t("heroEyebrow")}</div>
          <h1>{t("heroTitleStart")}<br /><span>{t("heroTitleAccent")}</span></h1>
          <p className="hero-lead">{t("heroLead")}</p>
          <div className="hero-actions"><Link className="btn btn-primary btn-lg" to="/positions">{t("explorePositions")} <i className="bi bi-arrow-right" /></Link><Link className="btn btn-ghost btn-lg" to={user ? "/profile" : "/login"}>{t(user ? "openWorkspace" : "createProfile")}</Link></div>
          <div className="hero-proof"><span><i className="bi bi-check-circle-fill" /> {t("freeToUse")}</span><span><i className="bi bi-check-circle-fill" /> {t("secureOauth")}</span><span><i className="bi bi-check-circle-fill" /> {t("roleAccess")}</span></div>
        </div>
        <div className="col-lg-5">
          <div className="product-preview">
            <div className="preview-top"><div className="preview-dots"><i /><i /><i /></div><span>Candidate workspace</span><i className="bi bi-three-dots" /></div>
            <div className="preview-body"><aside><span className="preview-logo"><i className="bi bi-file-earmark-person" /></span>{["grid-1x2", "person", "briefcase", "file-text", "gear"].map((icon, index) => <i className={`bi bi-${icon} ${index === 0 ? "active" : ""}`} key={icon} />)}</aside>
              <div className="preview-content"><div className="preview-welcome"><div><small>GOOD MORNING</small><h3>Your career dashboard</h3></div><span className="mini-avatar">AR</span></div>
                <div className="preview-stats"><div><span>Profile strength</span><strong>86%</strong><div className="mini-progress"><i /></div></div><div><span>Published CVs</span><strong>04</strong><small><i className="bi bi-arrow-up" /> 2 this month</small></div></div>
                <div className="preview-card"><div className="d-flex justify-content-between"><div><small>RECOMMENDED ROLE</small><h4>Senior Product Analyst</h4><p>Northstar Labs · Remote</p></div><span className="match-score">94%<small>match</small></span></div><div className="preview-tags"><span>SQL</span><span>Research</span><span>Product</span></div><button>View position <i className="bi bi-arrow-right" /></button></div>
              </div>
            </div>
          </div>
          <div className="floating-note floating-note-one"><span className="note-icon"><i className="bi bi-stars" /></span><div><strong>Profile matched</strong><small>3 new opportunities</small></div></div>
          <div className="floating-note floating-note-two"><span className="note-icon success"><i className="bi bi-check-lg" /></span><div><strong>CV published</strong><small>Ready for recruiters</small></div></div>
        </div>
      </div></div>
    </section>

    <div className="container dashboard-section"><ErrorAlert error={error} />{!data ? <Loading /> : <>
      <section className="metric-grid">{Object.entries(metricMeta).map(([key, [label, icon]]) => <article className="metric-card" key={key}><span className="metric-icon"><i className={`bi bi-${icon}`} /></span><div><strong>{data.stats[key]}</strong><span>{t(label)}</span></div><i className="bi bi-arrow-up-right metric-arrow" /></article>)}</section>
      <div className="section-heading"><div><span className="section-kicker">{t("discover")}</span><h2>{t("latestOpportunities")}</h2><p>{t("latestHelp")}</p></div><Link className="text-link" to="/positions">{t("browseAllPositions")} <i className="bi bi-arrow-right" /></Link></div>
      <div className="row g-4 align-items-start"><section className="col-xl-8"><div className="data-panel"><div className="table-responsive"><table className="table modern-table align-middle"><thead><tr><th>{t("position")}</th><th>{t("company")}</th><th>{t("level")}</th><th className="text-end">{t("cvs")}</th><th /></tr></thead><tbody>{data.latest.map((p) => <tr key={p.id}><td><Link to={`/positions/${p.id}`} className="position-cell"><span className="company-logo">{(p.company || p.title)[0]}</span><span><strong>{p.title}</strong><small>{t("updatedRecently")}</small></span></Link></td><td>{p.company || t("independent")}</td><td><span className="soft-badge">{p.level?.replace("_", "-") || "OPEN"}</span></td><td className="text-end fw-semibold">{p._count.cvs}</td><td className="text-end"><Link className="row-action" to={`/positions/${p.id}`} aria-label={`${t("open")} ${p.title}`}><i className="bi bi-arrow-up-right" /></Link></td></tr>)}</tbody></table></div></div></section>
        <aside className="col-xl-4"><div className="side-panel"><div className="panel-heading"><div><span className="section-kicker">{t("trending")}</span><h2>{t("mostPopular")}</h2></div><i className="bi bi-fire" /></div><div className="popular-list">{data.popular.map((p, index) => <Link to={`/positions/${p.id}`} key={p.id}><span className="rank">{String(index + 1).padStart(2, "0")}</span><span><strong>{p.title}</strong><small>{p.company || t("openOpportunity")}</small></span><span className="application-count">{p._count.cvs}</span></Link>)}</div><div className="tag-section"><h3>{t("skillsDemand")}</h3><div className="tag-cloud">{data.tags.map((x) => <Link key={x.id} to={`/search?q=${encodeURIComponent(x.name)}`}>#{x.name}</Link>)}</div></div></div></aside>
      </div>
    </>}</div>
  </>;
}
