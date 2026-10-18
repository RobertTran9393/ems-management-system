// Centralized API configuration for EMS
let apiUrl = import.meta.env.VITE_API_URL || 'https://ems-backend-mr7p.onrender.com';

// Ensure protocol is present if Render passes only hostname
if (apiUrl && !apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
  apiUrl = `https://${apiUrl}`;
}

export const API_BASE_URL = apiUrl;

/**
 * Returns HTTP headers automatically populated with JWT Bearer Token if present.
 */
export function getAuthHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem('ems_token');
  const headers: Record<string, string> = {
    ...customHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
