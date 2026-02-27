/**
 * API Client Configuration
 *
 * This module handles all HTTP requests to the backend server.
 * Configure the API_URL environment variable to point to your backend.
 */

// Get API URL from environment or use default
const getApiUrl = () => {
  // Check if we're running in a browser
  if (typeof window !== 'undefined') {
    // In production, read from window (can be set by Capacitor)
    if ((window as any).API_URL) {
      return (window as any).API_URL;
    }
  }

  // Fallback to environment variable or default
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

export const API_URL = getApiUrl();

interface RequestOptions extends RequestInit {
  token?: string;
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Add auth token if provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const url = `${API_URL}${endpoint}`;
    console.log('[API] Making request to:', url);
    console.log('[API] Method:', fetchOptions.method || 'GET');
    console.log('[API] Headers:', headers);

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    console.log('[API] Response status:', response.status);

    const data = await response.json();
    console.log('[API] Response data:', data);

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return data;
  } catch (error: any) {
    console.error('[API] Request failed:', error);
    console.error('[API] Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * API Client with convenience methods
 */
export const apiClient = {
  get: <T = any>(endpoint: string, token?: string) =>
    apiRequest<T>(endpoint, { method: 'GET', token }),

  post: <T = any>(endpoint: string, body: any, token?: string) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      token,
    }),

  put: <T = any>(endpoint: string, body: any, token?: string) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      token,
    }),

  patch: <T = any>(endpoint: string, body: any, token?: string) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      token,
    }),

  delete: <T = any>(endpoint: string, token?: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE', token }),
};

// Export convenience functions
export default apiClient;
