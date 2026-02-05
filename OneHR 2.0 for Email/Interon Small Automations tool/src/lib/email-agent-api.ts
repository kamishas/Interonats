// Base URLs from documentation
// UNIFIED AGENT: Auth and Data are now on the SAME Gateway
const DATA_API_URL = import.meta.env.VITE_API_URL || 'https://seksrdn8td.execute-api.us-east-2.amazonaws.com';
const AUTH_API_URL = DATA_API_URL; // Re-use the working Unified URL
console.log('🔌 DEBUG: Using DATA_API_URL:', DATA_API_URL);

// Helper to get current session token from Local Storage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
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

  if (token && !url.includes('/login')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 403 && errorBody.includes('Invalid key=value pair')) {
        console.error('AWS API Gateway IAM Auth Error detected.');
      }
      throw new Error(`API Error: ${response.status} - ${errorBody}`);
    }

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

    createTag: (tagName: string, color?: string, description?: string) =>
      fetchClient(`${DATA_API_URL}/contacts/tags`, {
        method: 'POST',
        body: JSON.stringify({ tagName, color, description }),
      }),

    deleteTag: (tagName: string) =>
      fetchClient(`${DATA_API_URL}/contacts/tags/delete`, {
        method: 'POST',
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

  zoho: {
    getAuthUrl: () =>
      fetchClient(`${AUTH_API_URL}/auth/zoho/url`),

    exchangeToken: (code: string) =>
      fetchClient(`${AUTH_API_URL}/auth/zoho/token`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
  },

  compliance: {
    checkText: (params: { subject: string; body: string; useAI?: boolean }) =>
      fetchClient(`${AUTH_API_URL}/compliance/check`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    checkImage: (imageData: { image: string; filename: string; campaignId: string }) =>
      fetchClient(`${DATA_API_URL}/images`, {
        method: 'POST',
        body: JSON.stringify(imageData),
      }),
  }
};

export const uploadImage = async (imageData: { image: string; filename: string; campaignId: string }) => {
  return emailAgentApi.compliance.checkImage(imageData);
};
