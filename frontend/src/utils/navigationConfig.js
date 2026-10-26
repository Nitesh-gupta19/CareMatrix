import { DashboardIcon } from "../components/icons";

// Single source of truth for the sidebar per role. Adding a nav item
// means editing this array, not touching the Sidebar component itself.
export const navigationConfig = {
  ADMIN: [{ label: "Dashboard", path: "/admin", icon: DashboardIcon }],
  DOCTOR: [{ label: "Dashboard", path: "/doctor", icon: DashboardIcon }],
  NURSE: [{ label: "Dashboard", path: "/nurse", icon: DashboardIcon }],
  PATIENT: [{ label: "Dashboard", path: "/patient", icon: DashboardIcon }],
  RELATIVE: [{ label: "Dashboard", path: "/relative", icon: DashboardIcon }],
};
