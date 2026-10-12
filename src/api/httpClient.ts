import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL as string | undefined;

/** Con VITE_API_URL vacío la app corre en modo demo, con datos en memoria. */
export const API_ENABLED = Boolean(baseURL);

export const httpClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

let token: string | null = null;
export const setAuthToken = (value: string | null) => {
  token = value;
};

httpClient.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const apiErrorMessage = (error: unknown, fallback = 'No pudimos completar la operación.') => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (!error.response) return 'No pudimos conectar con el servidor.';
  }
  return fallback;
};
