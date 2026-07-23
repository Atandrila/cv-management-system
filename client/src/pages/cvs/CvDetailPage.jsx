import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, json } from "../../api/client";
import { ErrorAlert, Loading } from "../../components/AsyncState";
import { usePreferences } from "../../contexts/PreferencesContext";
import useAuth from "../../hooks/useAuth";

function EditableValue({ item, canEdit, onSave, t }) {
  const [value, setValue] = useState(item.value);
  useEffect(() => { setValue(item.value); }, [item.value]);
  const missing = item.required && !String(value || "").trim();

  if (!canEdit || item.attribute.isBuiltIn) {
    return <div className={`p-3 rounded ${missing ? "missing-value" : ""}`}>
      <strong>{item.attribute.name}</strong>
      <div className="markdown-preview mt-1">{value || t("missingInformation")}</div>
    </div>;
  }

  const save = () => value !== item.value && onSave(item, value);
  const input = item.attribute.type === "TEXT"
    ? <textarea className={`form-control ${missing ? "is-invalid" : ""}`} rows="4" value={value} onChange={(event) => setValue(event.target.value)} onBlur={save} />
    : item.attribute.type === "BOOLEAN"
      ? <div className="form-check form-switch"><input type="checkbox" className="form-check-input" checked={value === "true"} onChange={(event) => { const next = String(event.target.checked); setValue(next); onSave(item, next); }} /></div>
      : item.attribute.type === "SELECT"
        ? <select className={`form-select ${missing ? "is-invalid" : ""}`} value={value} onChange={(event) => { setValue(event.target.value); onSave(item, event.target.value); }}><option value="">{t("choose")}</option>{item.attribute.options.map((option) => <option key={option.id}>{option.label}</option>)}</select>
        : <input className={`form-control ${missing ? "is-invalid" : ""}`} type={item.attribute.type === "NUMERIC" ? "number" : item.attribute.type === "DATE" ? "date" : "text"} value={value} onChange={(event) => setValue(event.target.value)} onBlur={save} />;

  return <div className={`p-3 rounded ${missing ? "missing-value" : ""}`}>
    <label className="form-label fw-semibold">{item.attribute.name}</label>
    {input}
    {missing && <div className="invalid-feedback d-block">{t("requiredBeforePublishing")}</div>}
  </div>;
}

export default function CvDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = usePreferences();
  const [cv, setCv] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [publishing, setPublishing] = useState(false);
  const pendingSaves = useRef(new Set());
  const recruiter = user.roles.includes("RECRUITER") || user.roles.includes("ADMIN");

  const load = useCallback(() => {
    setError(null);
    return api(`/cvs/${id}`).then((data) => {
      setCv(data);
      return data;
    }).catch((requestError) => {
      setError(requestError);
      throw requestError;
    });
  }, [id]);

  useEffect(() => { void load().catch(() => {}); }, [load]);

  const saveValue = (item, value) => {
    setCv((current) => current ? {
      ...current,
      values: current.values.map((entry) => entry.attribute.id === item.attribute.id ? { ...entry, value } : entry),
    } : current);

    const operation = api(`/profile/attributes/${item.attribute.id}`, json("PUT", {
      value,
      version: item.version,
      userId: cv.userId,
    })).then((saved) => {
      setCv((current) => current ? {
        ...current,
        values: current.values.map((entry) => entry.attribute.id === item.attribute.id ? { ...entry, value: saved.value, version: saved.version } : entry),
      } : current);
      setError(null);
      setMessage(t("profileValueSaved"));
    }).catch(setError);

    pendingSaves.current.add(operation);
    operation.finally(() => pendingSaves.current.delete(operation));
    return operation;
  };

  const publish = async () => {
    setPublishing(true);
    setError(null);
    setMessage("");
    try {
      await Promise.all([...pendingSaves.current]);
      const latest = await load();
      const missing = latest.values.filter((item) => item.required && !String(item.value || "").trim());
      if (missing.length) {
        setError(new Error(t("publishMissing", { fields: missing.map((item) => item.attribute.name).join(", ") })));
        return;
      }
      const updated = await api(`/cvs/${id}/publish`, { method: "POST" });
      setCv(updated);
      setMessage(t("cvPublished"));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setPublishing(false);
    }
  };

  const like = async () => {
    try {
      const result = await api(`/cvs/${id}/like`, { method: "POST" });
      setCv({ ...cv, likedByMe: result.liked, likeCount: result.count });
    } catch (requestError) {
      setError(requestError);
    }
  };

  if (!cv) return <div className="container"><ErrorAlert error={error} />{!error && <Loading label={t("loading")} />}</div>;

  const missing = cv.values.filter((item) => item.required && !String(item.value || "").trim());
  const complete = missing.length === 0;

  return <div className="container py-4">
    <div className="no-print d-flex flex-wrap gap-2 mb-3">
      <Link className="btn btn-outline-secondary" to="/cvs"><i className="bi bi-arrow-left me-2" />{t("allCvs")}</Link>
      <button className="btn btn-outline-secondary" onClick={() => window.print()}><i className="bi bi-printer me-2" />{t("printPdf")}</button>
      {cv.canEdit && cv.status !== "PUBLISHED" && <button className="btn btn-success" disabled={publishing} onClick={publish}><i className="bi bi-send-check me-2" />{t(publishing ? "publishing" : "publishCv")}</button>}
      {recruiter && cv.status === "PUBLISHED" && <button className={`btn btn-${cv.likedByMe ? "primary" : "outline-primary"}`} onClick={like}><i className={`bi bi-heart${cv.likedByMe ? "-fill" : ""} me-2`} />{cv.likeCount}</button>}
      <span className={`badge text-bg-${cv.status === "PUBLISHED" ? "success" : "secondary"} align-self-center`}>{t(cv.status === "PUBLISHED" ? "published" : "draft")}</span>
    </div>

    <ErrorAlert error={error} />
    {message && <div className="alert alert-success no-print">{message}</div>}
    {cv.canEdit && cv.status !== "PUBLISHED" && <div className={`alert ${complete ? "alert-success" : "alert-warning"} no-print d-flex flex-wrap align-items-center gap-2`}>
      <span className="me-auto">{complete ? t("publishReady") : t("publishMissing", { fields: missing.map((item) => item.attribute.name).join(", ") })}</span>
      {!complete && <Link className="btn btn-sm btn-outline-dark" to="/profile">{t("editProfile")}</Link>}
    </div>}

    <article className="cv-sheet p-4 p-md-5">
      <header className="border-bottom pb-4 mb-4">
        <div className="d-flex justify-content-between gap-4">
          <div>
            <p className="text-primary fw-semibold text-uppercase mb-2">{t("curriculumVitae")}</p>
            <h1 className="display-5 fw-bold">{[cv.user.firstName, cv.user.lastName].filter(Boolean).join(" ") || t("candidate")}</h1>
            <p className="lead mb-1">{cv.position.title}</p>
            <p className="text-secondary mb-0">{cv.user.location || t("locationMissing")}</p>
          </div>
          {cv.user.photoUrl && <img src={cv.user.photoUrl} alt={t("candidate")} width="120" height="120" className="rounded object-fit-cover" />}
        </div>
      </header>

      <section className="mb-5">
        <h2 className="h4 text-primary border-bottom pb-2">{t("professionalInformation")}</h2>
        <div className="row g-3">{cv.values
          .filter((item) => !["First Name", "Last Name", "Location", "Personal Photo"].includes(item.attribute.name))
          .map((item) => <div className={item.attribute.type === "TEXT" ? "col-12" : "col-md-6"} key={item.attribute.id}><EditableValue item={item} canEdit={cv.canEdit} onSave={saveValue} t={t} /></div>)}
        </div>
      </section>

      {cv.projects.length > 0 && <section>
        <h2 className="h4 text-primary border-bottom pb-2">{t("selectedProjects")}</h2>
        {cv.projects.map(({ project }) => <article className="mb-4" key={project.id}>
          <div className="d-flex justify-content-between"><h3 className="h5">{project.name}</h3><span className="small text-secondary">{project.startDate?.slice(0, 10)} — {project.endDate?.slice(0, 10) || t("present")}</span></div>
          <p className="markdown-preview">{project.description}</p>
          {project.tags.map((tag) => <span className="badge text-bg-secondary me-1" key={tag.tagId}>{tag.tag.name}</span>)}
        </article>)}
      </section>}

      <footer className="border-top pt-3 mt-5 text-secondary small">{t("cvFooter", {
        position: cv.position.title,
        company: cv.position.company || t("recruitingOrganization"),
      })}</footer>
    </article>
  </div>;
}
