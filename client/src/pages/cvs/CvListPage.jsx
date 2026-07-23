import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { Empty, ErrorAlert, Loading } from "../../components/AsyncState";
import { usePreferences } from "../../contexts/PreferencesContext";
import useAuth from "../../hooks/useAuth";

export default function CvListPage() {
  const { user } = useAuth();
  const { locale, t } = usePreferences();
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState(null);
  const staff = user.roles.some((role) => ["RECRUITER", "ADMIN"].includes(role));

  const load = useCallback(() => {
    setError(null);
    api("/cvs").then(setRows).catch(setError);
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async () => {
    if (!confirm(`Delete ${selected.length} CV(s)?`)) return;
    try {
      await Promise.all(selected.map((id) => api(`/cvs/${id}`, { method: "DELETE" })));
      setSelected([]);
      load();
    } catch (requestError) {
      setError(requestError);
    }
  };

  const emptyMessage = staff ? t("recruiterEmpty") : t("candidateEmpty");

  return <div className="container py-4">
    <div className="d-flex justify-content-between gap-3">
      <div>
        <h1 className="h2">{staff ? t("publishedCandidateCvs") : t("myCvs")}</h1>
        <p className="text-secondary">{staff ? t("recruiterCvHelp") : t("candidateCvHelp")}</p>
      </div>
      <div className="d-flex gap-2 align-self-start">
        {staff && <button className="btn btn-outline-secondary" onClick={load}><i className="bi bi-arrow-clockwise me-2" />{t("refresh")}</button>}
        {!staff && <Link className="btn btn-primary" to="/positions">{t("createFromPosition")}</Link>}
      </div>
    </div>

    <ErrorAlert error={error} />

    {selected.length > 0 && <div className="toolbar alert alert-primary d-flex gap-2">
      <strong className="me-auto">{t("selected", { count: selected.length })}</strong>
      <button className="btn btn-sm btn-primary" disabled={selected.length !== 1} onClick={() => navigate(`/cvs/${selected[0]}`)}>{t("open")}</button>
      {!staff && <button className="btn btn-sm btn-danger" onClick={remove}>{t("delete")}</button>}
      <button className="btn-close" onClick={() => setSelected([])} />
    </div>}

    {!rows
      ? <Loading label={t("loading")} />
      : rows.length === 0
        ? <Empty icon="file-earmark-person">{emptyMessage}</Empty>
        : <div className="table-responsive">
          <table className="table table-hover table-select align-middle">
            <thead><tr>
              <th></th>
              {staff && <th>{t("candidateColumn")}</th>}
              <th>{t("position")}</th>
              <th>{t("company")}</th>
              <th>{t("status")}</th>
              <th>{t("updated")}</th>
              <th className="text-end">{t("likes")}</th>
            </tr></thead>
            <tbody>{rows.map((cv) => <tr
              key={cv.id}
              className={selected.includes(cv.id) ? "selected" : ""}
              onClick={() => setSelected(selected.includes(cv.id) ? [] : [cv.id])}
              onDoubleClick={() => navigate(`/cvs/${cv.id}`)}
            >
              <td><input type="checkbox" checked={selected.includes(cv.id)} readOnly /></td>
              {staff && <td>{[cv.user.firstName, cv.user.lastName].filter(Boolean).join(" ") || cv.user.email}</td>}
              <td><button className="btn btn-link p-0 text-decoration-none fw-semibold" onClick={(event) => { event.stopPropagation(); navigate(`/cvs/${cv.id}`); }}>{cv.position.title}</button></td>
              <td>{cv.position.company || "—"}</td>
              <td><span className={`badge text-bg-${cv.status === "PUBLISHED" ? "success" : "secondary"}`}>{t(cv.status === "PUBLISHED" ? "published" : "draft")}</span></td>
              <td>{new Date(cv.updatedAt).toLocaleDateString(locale)}</td>
              <td className="text-end">{cv._count.likes}</td>
            </tr>)}</tbody>
          </table>
          <p className="small text-secondary">{t("selectRows")}</p>
        </div>}
  </div>;
}
