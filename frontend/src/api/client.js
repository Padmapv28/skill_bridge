import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

// Attach JWT token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle API responses/errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error(
      '[API ERROR]',
      error.response?.status,
      error.config?.url,
      error.response?.data || error.message
    );

    // Handle unauthorized session
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      window.dispatchEvent(
        new CustomEvent('auth:session_expired', {
          detail: {
            message:
              'Your session has expired or is invalid. Please log in again.',
          },
        })
      );
    }

    // IMPORTANT:
    // Do not generate mock/sample data here.
    // Real backend errors must reach the page.
    return Promise.reject(error);
  }
);

export default apiClient;