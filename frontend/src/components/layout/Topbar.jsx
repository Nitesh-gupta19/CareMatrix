import { useAuth } from "../../context/AuthContext";
import { MenuIcon } from "../icons";
import IconButton from "../ui/IconButton";
import Avatar from "../ui/Avatar";

const ROLE_LABEL = {
  ADMIN: "Administrator",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  PATIENT: "Patient",
  RELATIVE: "Relative",
};

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
        <IconButton label="Open menu" className="topbar__menu-btn" onClick={onMenuClick}>
          <MenuIcon size={20} />
        </IconButton>
        <span className="topbar__title">CareMatrix</span>
      </div>
      <div className="topbar__user">
        <div className="topbar__user-meta">
          <span className="topbar__user-name">{user?.name}</span>
          <span className="topbar__user-role">{ROLE_LABEL[user?.role] || user?.role}</span>
        </div>
        <Avatar name={user?.name} />
      </div>
    </header>
  );
}
