/**
 * Single centralized HTTP client for the entire frontend. Every service
 * module (authService, patientService, etc.) calls through this file -
 * nothing else in the app should call fetch()/axios directly.
 *
 * The Phase 2 backend always responds with:
 *   { success: true,  message, data, pagination? }
 *   { success: false, message, error? }
 * This wrapper normalizes both into either a returned `{ data, pagination }`
 * or a thrown ApiClientError, so every service function stays a one-liner.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

let authToken = null;
let onUnauthorized = null;

/** Called by AuthContext whenever the token changes (login/logout/restore). */
export function setAuthToken(token) {
  authToken = token;
}

/**
 * Called once by AuthContext to register what should happen on a 401 -
 * this file has no React/router access itself, so it just notifies
 * whoever registered a handler (AuthContext clears state; ProtectedRoute
 * then redirects on the resulting re-render).
 */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export class ApiClientError extends Error {
  constructor(message, { status, details } = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Core request function. `path` is relative to BASE_URL, e.g. "/auth/login".
 * `query` is a plain object of query-string params (undefined values skipped).
 */
async function request(path, { method = "GET", body, query } = {}) {
  let url = `${BASE_URL}${path}`;

  if (query && Object.keys(query).length > 0) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value);
      }
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    // fetch() itself threw - the backend is unreachable (offline, wrong
    // VITE_API_URL, CORS misconfiguration, backend not running, etc.)
    throw new ApiClientError(
      "Could not reach the CareMatrix server. Check your connection or try again.",
      { status: 0, details: networkErr }
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (_parseErr) {
    // Non-JSON response (e.g. a proxy error page) - fall through with payload = null
  }

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    if (response.status === 401 && typeof onUnauthorized === "function") {
      onUnauthorized();
    }
    throw new ApiClientError(message, { status: response.status, details: payload });
  }

  return { data: payload?.data, pagination: payload?.pagination, message: payload?.message };
}

export const apiClient = {
  get: (path, query) => request(path, { method: "GET", query }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};
