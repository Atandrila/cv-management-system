import { Outlet } from "react-router-dom";

import Header from "./Header";

function AppLayout() {
  return (
    <div className="min-vh-100 d-flex flex-column">
      <Header />

      <main className="flex-grow-1">
        <Outlet />
      </main>

      <footer className="border-top py-3 mt-auto">
        <div className="container text-center text-secondary small">
          CV Forge · Reusable profiles, tailored CVs
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;
