import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { ErrorAlert, Loading } from "../../components/AsyncState";
export default function PublicProfilePage() {
  const { id } = useParams(); const [user, setUser] = useState(null); const [error, setError] = useState(null); useEffect(() => { api(`/users/${id}/public`).then(setUser).catch(setError); }, [id]);
  if (!user) return <div className="container"><ErrorAlert error={error} />{!error && <Loading />}</div>;
  return <div className="container py-4"><div className="d-flex gap-3 align-items-center mb-4">{user.photoUrl ? <img src={user.photoUrl} width="80" height="80" className="rounded-circle object-fit-cover" alt="" /> : <i className="bi bi-person-circle display-1 text-secondary" />}<div><h1 className="h2 mb-1">{[user.firstName, user.lastName].filter(Boolean).join(" ") || "Candidate"}</h1><p className="text-secondary mb-0">{user.location || "Location not shared"}</p></div></div><h2 className="h4">Published CVs</h2><div className="table-responsive"><table className="table table-hover"><thead><tr><th>Position</th><th>Company</th><th>Updated</th><th className="text-end">Likes</th></tr></thead><tbody>{user.cvs.map((cv) => <tr key={cv.id}><td><Link to={`/cvs/${cv.id}`}>{cv.position.title}</Link></td><td>{cv.position.company}</td><td>{new Date(cv.updatedAt).toLocaleDateString()}</td><td className="text-end">{cv._count.likes}</td></tr>)}</tbody></table></div></div>;
}
