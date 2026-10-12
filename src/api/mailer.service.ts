/**
 * PUNTO DE INTEGRACIÓN: el backend todavía no expone endpoints de recuperación de clave.
 * Cuando existan (por ejemplo POST /auth/olvide y POST /auth/nueva-clave) se reemplazan estas
 * funciones por llamadas a httpClient, sin tocar las pantallas.
 */
export const mailerService = {
  sendReset: async (_email: string) => ({ ok: true as const }),
  resetPassword: async (_token: string, _password: string) => ({ ok: true as const }),
};
