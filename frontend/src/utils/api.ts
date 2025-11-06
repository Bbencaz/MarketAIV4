import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d4ba6aee`;

export async function apiCall(
  endpoint: string,
  options: RequestInit = {},
  useAuth: boolean = false
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if not using custom auth
  if (!useAuth) {
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
  }

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
}
