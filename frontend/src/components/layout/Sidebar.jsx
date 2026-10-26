import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { navigationConfig } from "../../utils/navigationConfig";
import { HospitalIcon, LogoutIcon } from "../icons";

export default function Sidebar({ open, onNavigate }) {
  const { user, logout } = useAuth();
  const items = navigationConfig[user?.role] || [];

  return (
    <nav className={`sidebar ${open ? "open" : ""}`} aria-label="Main navigation">
      <div className="sidebar__brand">
        <HospitalIcon size={22} />
        <span>CareMatrix</span>
      </div>
      <div className="sidebar__nav">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) => `cm-nav-item${isActive ? " active" : ""}`}
              onClick={onNavigate}
            >
              {Icon && <Icon size={18} />}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
      <div className="sidebar__footer">
        <button type="button" className="cm-nav-item" onClick={logout} style={{ width: "100%" }}>
          <LogoutIcon size={18} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
