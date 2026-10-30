import { API_ENABLED } from '../api/httpClient';

/**
 * Módulos que todavía no tienen backend: se muestran solo en modo demo.
 * Con VITE_API_URL definido se ocultan del menú, de las rutas y de los inicios.
 */
export const MODULOS_DEMO = !API_ENABLED;
