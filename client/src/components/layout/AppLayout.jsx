import { Outlet } from "react-router-dom";

import Header from "./Header";

function AppLayout() {
  return (
    <div className="app-shell min-vh-100 d-flex flex-column">
      <Header />
      <main className="app-main flex-grow-1"><Outlet /></main>
      <footer className="app-footer mt-auto">
        <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2"><span className="brand-mark brand-mark-sm"><i className="bi bi-file-earmark-person-fill" /></span><span className="fw-semibold">CV Forge</span></div>
          <div className="text-secondary small">Reusable profiles. Tailored applications. Better hiring.</div>
          <div className="small text-secondary">Built for modern recruitment</div>
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;
