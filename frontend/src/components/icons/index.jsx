/**
 * A small, self-contained icon set. No icon library could be installed
 * (no network access in this environment), so these are hand-picked
 * inline SVGs covering exactly the concepts the app needs. Each is a
 * simple stroke-based glyph, colored via `currentColor` so it inherits
 * text color automatically.
 */
import React from "react";

function base(children, { size = 18, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const DashboardIcon = (p) => base(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>, p);
export const HospitalIcon = (p) => base(<><path d="M4 21V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" /><path d="M9 21v-5h6v5" /><path d="M12 6v5M9.5 8.5h5" /></>, p);
export const DepartmentIcon = (p) => base(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 10v10" /></>, p);
export const DoctorIcon = (p) => base(<><circle cx="12" cy="8" r="3.2" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /><path d="M12 10v3M10.5 11.5h3" /></>, p);
export const NurseIcon = (p) => base(<><circle cx="12" cy="7" r="3" /><path d="M5.5 20c0-3.4 2.9-5.8 6.5-5.8s6.5 2.4 6.5 5.8" /><path d="M9 3.5c0 1.7 1.3 2 3 2s3-.3 3-2" /></>, p);
export const PatientIcon = (p) => base(<><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c0-4 3.4-6.5 7.5-6.5S19.5 16 19.5 20" /></>, p);
export const AdmissionIcon = (p) => base(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 2v4M16 2v4M4 10h16" /><path d="M12 13v5M9.5 15.5h5" /></>, p);
export const WardIcon = (p) => base(<><path d="M3 20V9l9-5 9 5v11" /><path d="M9 20v-6h6v6" /></>, p);
export const BedIcon = (p) => base(<><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" /><path d="M3 18h18M5 12V8a1 1 0 0 1 1-1h4v5" /></>, p);
export const PrescriptionIcon = (p) => base(<><path d="M9 3h6l1 4H8l1-4Z" /><path d="M8 7v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7" /><path d="M9 12h3M9 15.5c1 1 3 1 4 0" /></>, p);
export const TaskIcon = (p) => base(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 11l2 2 5-5" /></>, p);
export const ObservationIcon = (p) => base(<><path d="M3 12h4l2 6 4-12 2 6h6" /></>, p);
export const RelativeIcon = (p) => base(<><circle cx="8" cy="8" r="2.8" /><circle cx="17" cy="9" r="2.4" /><path d="M3 20c0-3 2.2-5.2 5-5.2s5 2.2 5 5.2" /><path d="M14 20c.2-2.4 1.9-4.2 4-4.2 1.5 0 2.8.8 3.5 2" /></>, p);
export const LogoutIcon = (p) => base(<><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="M15 16l4-4-4-4" /><path d="M19 12H9" /></>, p);
export const MenuIcon = (p) => base(<><path d="M4 6h16M4 12h16M4 18h16" /></>, p);
export const CloseIcon = (p) => base(<><path d="M6 6l12 12M18 6L6 18" /></>, p);
export const ChevronDownIcon = (p) => base(<path d="M6 9l6 6 6-6" />, p);
export const AlertIcon = (p) => base(<><path d="M12 3l10 18H2L12 3Z" /><path d="M12 10v4M12 17.5v.01" /></>, p);
export const CheckCircleIcon = (p) => base(<><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.3 2.3L16 9.5" /></>, p);
export const InboxIcon = (p) => base(<><path d="M3 12h5l1.5 3h5L16 12h5" /><rect x="3" y="12" width="18" height="8" rx="2" /><path d="M7 6h10l2 6H5l2-6Z" /></>, p);
export const BuildingIcon = HospitalIcon;
