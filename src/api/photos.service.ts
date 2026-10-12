import { API_ENABLED, httpClient } from './httpClient';
import type { Role } from '../models';

/**
 * Sube la foto de perfil como un Blob real (multipart). Sin backend configurado devuelve una
 * URL local del blob para poder previsualizarla en la demo.
 * PUNTO DE INTEGRACIÓN: ajustar la ruta cuando el backend publique el endpoint de usuarios.
 */
export const photosService = {
  upload: async (role: Role, userId: number, blob: Blob): Promise<string> => {
    if (!API_ENABLED) return URL.createObjectURL(blob);
    const body = new FormData();
    body.append('foto', blob, 'perfil.jpg');
    const { data } = await httpClient.post<{ url: string }>(`/usuarios/${role}/${userId}/foto`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },
  remove: async (role: Role, userId: number) => {
    if (!API_ENABLED) return;
    await httpClient.delete(`/usuarios/${role}/${userId}/foto`);
  },
};
