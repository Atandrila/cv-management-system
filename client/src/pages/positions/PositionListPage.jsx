import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { Empty, ErrorAlert, Loading } from "../../components/AsyncState";
import { usePreferences } from "../../contexts/PreferencesContext";
import useAuth from "../../hooks/useAuth";

export default function PositionListPage() {
  const { user } = useAuth();
  const { t } = usePreferences();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [rows, setRows] = useState(null);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState(null);
  const staff = user?.roles.some((role) => ["RECRUITER", "ADMIN"].includes(role));
  const query = params.get("q") || "";

  const load = useCallback(() => {
    api(`/positions?q=${encodeURIComponent(query)}`).then(setRows).catch(setError);
  }, [query]);
  useEffect(() => { load(); }, [load]);

  const select = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const remove = async () => {
    if (!confirm(t("deletePositionsConfirm", { count: selected.length }))) return;
    try {
      await Promise.all(selected.map((id) => api(`/positions/${id}`, { method: "DELETE" })));
      setSelected([]);
      load();
    } catch (requestError) {
      setError(requestError);
    }
  };
  const duplicate = async () => {
    try {
      const created = await api(`/positions/${selected[0]}/duplicate`, { method: "POST" });
      navigate(`/positions/${created.id}/edit`);
    } catch (requestError) {
      setError(requestError);
    }
  };

  return <div className="container py-4">
    <div className="d-flex justify-content-between align-items-center mb-3">
      <div><h1 className="h2 mb-1">{t("positions")}</h1><p className="text-secondary mb-0">{t("positionsHelp")}</p></div>
      {staff && <button className="btn btn-primary" onClick={() => navigate("/positions/new")}><i className="bi bi-plus-lg me-2" />{t("createPosition")}</button>}
    </div>
    <ErrorAlert error={error} />

    {selected.length > 0 && <div className="toolbar alert alert-primary d-flex align-items-center gap-2">
      <strong className="me-auto">{t("selected", { count: selected.length })}</strong>
      <button className="btn btn-sm btn-primary" disabled={selected.length !== 1} onClick={() => navigate(`/positions/${selected[0]}/edit`)}><i className="bi bi-pencil me-1" />{t("edit")}</button>
      <button className="btn btn-sm btn-outline-primary" disabled={selected.length !== 1} onClick={duplicate}><i className="bi bi-copy me-1" />{t("duplicate")}</button>
      <button className="btn btn-sm btn-danger" onClick={remove}><i className="bi bi-trash me-1" />{t("delete")}</button>
      <button className="btn-close ms-2" onClick={() => setSelected([])} />
    </div>}

    {!rows
      ? <Loading label={t("loading")} />
      : rows.length === 0
        ? <Empty icon="briefcase">{t("noPositions")}</Empty>
        : <div className="table-responsive">
          <table className="table table-hover table-select align-middle">
            <thead><tr>
              {staff && <th className="text-center"><input type="checkbox" checked={selected.length === rows.length} onChange={() => setSelected(selected.length === rows.length ? [] : rows.map((item) => item.id))} /></th>}
              <th>{t("title")}</th><th>{t("company")}</th><th>{t("level")}</th><th>{t("access")}</th><th>{t("tags")}</th><th className="text-end">{t("cvs")}</th>
            </tr></thead>
            <tbody>{rows.map((position) => <tr
              key={position.id}
              className={selected.includes(position.id) ? "selected" : ""}
              onClick={() => staff ? select(position.id) : navigate(`/positions/${position.id}`)}
              onDoubleClick={() => navigate(`/positions/${position.id}`)}
            >
              {staff && <td className="text-center"><input type="checkbox" checked={selected.includes(position.id)} readOnly /></td>}
              <td><button className="btn btn-link p-0 fw-semibold text-decoration-none" onClick={(event) => { event.stopPropagation(); navigate(`/positions/${position.id}`); }}>{position.title}</button><div className="small text-secondary text-truncate" style={{ maxWidth: 360 }}>{position.description}</div></td>
              <td>{position.company || "—"}</td>
              <td>{position.level?.replace("_", "-") || "—"}</td>
              <td><span className={`badge text-bg-${position.isPublic ? "success" : "warning"}`}>{t(position.isPublic ? "public" : "restricted")}</span></td>
              <td>{position.tags.map((tag) => <span className="badge text-bg-secondary me-1" key={tag.tagId}>{tag.tag.name}</span>)}</td>
              <td className="text-end">{position._count.cvs}</td>
            </tr>)}</tbody>
          </table>
          <p className="small text-secondary">{t("selectPositionRows")}</p>
        </div>}
  </div>;
}
