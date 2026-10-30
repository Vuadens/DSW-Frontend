import axios from 'axios';

const configuredBaseURL = import.meta.env.VITE_API_URL as string | undefined;
const baseURL = configuredBaseURL ? `${configuredBaseURL.replace(/\/$/, '')}/api` : undefined;

/** Con VITE_API_URL vacío la app corre en modo demo, con datos en memoria. */
export const API_ENABLED = Boolean(baseURL);

export const httpClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

const TOKEN_KEY = 'hades.token';

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

let token: string | null = readToken();

export const getAuthToken = () => token;

/** Guarda el token en memoria y en localStorage para recuperar la sesión al recargar. */
export const setAuthToken = (value: string | null) => {
  token = value;
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Sin localStorage la sesión dura hasta recargar la página.
  }
};

let unauthorizedHandler: (() => void) | null = null;

/** Se llama cuando el backend responde 401 a un pedido autenticado (token vencido o inválido). */
export const onUnauthorized = (handler: () => void) => {
  unauthorizedHandler = handler;
};

httpClient.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && error.config?.headers?.Authorization) {
      setAuthToken(null);
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);

export const apiErrorMessage = (error: unknown, fallback = 'No pudimos completar la operación.') => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (!error.response) return 'No pudimos conectar con el servidor.';
  }
  return fallback;
};
