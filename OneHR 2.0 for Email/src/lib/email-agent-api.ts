// Base URLs from documentation
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'https://9tesg7rn8j.execute-api.us-east-2.amazonaws.com/prod';
const DATA_API_URL = import.meta.env.VITE_API_URL || 'https://x0ntz3akmd.execute-api.us-east-2.amazonaws.com/prod';
const SIGNUP_API_URL = import.meta.env.VITE_SIGNUP_API_URL;


// Helper to get current session token from Local Storage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    // Ensure we don't return garbage
    if (token && token !== 'undefined' && token !== 'null' && token !== '[object Object]') {
      return token;
    }
  }
  return null;
};

// Generic fetch wrapper
async function fetchClient(url: string, options: RequestInit = {}) {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Only add Authorization header if we have a token AND we are not hitting the login endpoint
  // This prevents AWS API Gateway IAM validation errors when sending headers to public endpoints
  if (token && !url.includes('/login')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is FormData, let browser set Content-Type
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle error or throw
      const errorBody = await response.text();

      // Check for specific AWS API Gateway errors
      if (response.status === 403 && errorBody.includes('Invalid key=value pair')) {
        console.error('AWS API Gateway IAM Auth Error detected. The API might be misconfigured to expect AWS IAM signatures instead of Bearer tokens, or the token is malformed.');
      }

      throw new Error(`API Error: ${response.status} - ${errorBody}`);
    }

    // Handle empty responses
    if (response.status === 204) return null;

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export const emailAgentApi = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      fetchClient(`${AUTH_API_URL}/login`, {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
  },

  campaigns: {
    list: () =>
      fetchClient(`${DATA_API_URL}/campaigns`),

    create: (name: string, category?: string) =>
      fetchClient(`${DATA_API_URL}/campaigns`, {
        method: 'POST',
        body: JSON.stringify({ name, category }),
      }),

    get: (id: string) =>
      fetchClient(`${DATA_API_URL}/campaigns/${id}`),

    saveConfig: (id: string, data: { subject: string; bodyTemplate: string; category?: string; images?: any[] }) =>
      fetchClient(`${DATA_API_URL}/campaigns/${id}/config`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    addRecipients: (id: string, recipients: any[]) =>
      fetchClient(`${DATA_API_URL}/campaigns/${id}/recipients`, {
        method: 'POST',
        body: JSON.stringify({ recipients }),
      }),

    send: (id: string, retry: boolean = false) =>
      fetchClient(`${DATA_API_URL}/campaigns/${id}/send`, {
        method: 'POST',
        body: JSON.stringify({ retry }),
      }),

    triggerScan: () =>
      fetchClient(`${DATA_API_URL}/campaigns/scan`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
  },

  contacts: {
    list: (tag?: string) =>
      fetchClient(`${DATA_API_URL}/contacts${tag ? `?tag=${tag}` : ''}`),

    add: (contact: { firstName: string; lastName: string; email: string; company?: string; tags?: string[] }) =>
      fetchClient(`${DATA_API_URL}/contacts`, {
        method: 'POST',
        body: JSON.stringify({ ...contact, source: 'Manual' }),
      }),

    batchImport: (contacts: any[]) =>
      fetchClient(`${DATA_API_URL}/contacts/batch`, {
        method: 'POST',
        body: JSON.stringify({ contacts }),
      }),

    getTags: () =>
      fetchClient(`${DATA_API_URL}/contacts/tags`),

    createTag: (tagName: string) =>
      fetchClient(`${DATA_API_URL}/contacts/tags`, {
        method: 'POST',
        body: JSON.stringify({ tagName }),
      }),

    deleteTag: (tagName: string) =>
      fetchClient(`${DATA_API_URL}/contacts/tags`, {
        method: 'DELETE',
        body: JSON.stringify({ tagName }),
      }),

    delete: (email: string) =>
      fetchClient(`${DATA_API_URL}/contacts/delete`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    verify: (email: string) =>
      fetchClient(`${DATA_API_URL}/contacts/verify-email`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },

  ai: {
    generateContent: (params: { intent: string; tone: string; count?: number }) =>
      fetchClient(`${DATA_API_URL}/ai/generate`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  },

  compliance: {
    checkText: (params: { subject: string; body: string; useAI?: boolean }) =>
      fetchClient(`${DATA_API_URL}/compliance/check`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    // Upload image for EEOC compliance checking
    // Expects JSON with base64 encoded image data URL (data:image/jpeg;base64,...)
    // Returns: { isCompliant: boolean, url: string, violations?: any[] }
    checkImage: (imageData: { image: string; filename: string; campaignId: string }) =>
      fetchClient(`${DATA_API_URL}/images`, {
        method: 'POST',
        body: JSON.stringify(imageData),
      }),
  }
};

// Export standalone upload for convenience if preferred
export const uploadImage = async (imageData: { image: string; filename: string; campaignId: string }) => {
  return emailAgentApi.compliance.checkImage(imageData);
};