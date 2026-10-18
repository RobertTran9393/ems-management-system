// Centralized API configuration for EMS
let apiUrl = import.meta.env.VITE_API_URL || 'https://ems-backend-mr7p.onrender.com';

// Ensure protocol is present if Render passes only hostname
if (apiUrl && !apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
  apiUrl = `https://${apiUrl}`;
}

export const API_BASE_URL = apiUrl;
