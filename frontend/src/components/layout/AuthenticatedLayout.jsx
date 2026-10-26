import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

/**
 * One layout for every authenticated role (Phase 1 decision, preserved).
 * Adds mobile drawer behavior for the sidebar: closed by default on small
 * screens, toggled via the topbar's menu button, closed again on nav or
 * backdrop click.
 */
export default function AuthenticatedLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="authenticated-layout">
      <Sidebar open={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      <div className={`sidebar-backdrop ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen(false)} />
      <div className="main-area">
        <Topbar onMenuClick={() => setMobileOpen((v) => !v)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
