# DSW-Frontend

## Modos de ejecución

```bash
pnpm install
pnpm dev
```

- **Modo demo** (`VITE_API_URL` vacío): todos los módulos, con datos en memoria. Cuentas en la
  pantalla de ingreso.
- **Modo conectado** (`VITE_API_URL=http://localhost:3000`, la URL del backend sin `/api`):
  - Se ingresa con email o DNI.
  - El token se guarda en `localStorage` y la sesión se recupera al recargar. Un 401 cierra la sesión.
  - Los módulos que todavía no tienen backend se ocultan: planes (CRUD), finanzas, máquinas,
    materiales, mis cuotas, registro, recuperar clave, foto de perfil y sueldos.

Para el modo conectado, el backend tiene que estar corriendo con el seed de demo
(ver el README de `DSW-Backend`). Las cuentas de prueba usan la contraseña `demo1234`.
