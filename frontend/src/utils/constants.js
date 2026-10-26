export const ROLES = ["ADMIN", "DOCTOR", "NURSE", "PATIENT", "RELATIVE"];

// Where each role lands after login / when hitting a route they're not
// allowed on. Single source of truth so RoleRoute and login redirect
// logic can never disagree with each other.
export const ROLE_HOME_PATH = {
  ADMIN: "/admin",
  DOCTOR: "/doctor",
  NURSE: "/nurse",
  PATIENT: "/patient",
  RELATIVE: "/relative",
};

export const TOKEN_STORAGE_KEY = "carematrix_token";
