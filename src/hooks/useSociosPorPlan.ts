import { useEffect, useState } from 'react';
import { API_ENABLED, apiErrorMessage } from '../api/httpClient';
import { sociosService, type EstadoCuotaSocio } from '../api/socios.service';
import { estadoCuotasSocio } from '../lib/rules';
import { useDataStore } from '../stores/dataStore';

export interface SocioListado {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  /** Solo lo recibe el administrador. */
  estadoCuota?: EstadoCuotaSocio;
}

/**
 * Socios de un plan con nombre, apellido y DNI. En modo conectado lo pide al backend, que agrega el
 * estado de la cuota del mes solo para el admin; en modo demo se calcula con las cuotas locales.
 */
export function useSociosPorPlan(planId: number | null, conEstado: boolean) {
  const socios = useDataStore((s) => s.socios);
  const cuotas = useDataStore((s) => s.cuotas);
  const [remotos, setRemotos] = useState<SocioListado[] | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!API_ENABLED || planId === null) return;
    let vigente = true;
    sociosService
      .porPlan(planId)
      .then((lista) => vigente && (setRemotos(lista), setError(undefined)))
      .catch((e) => vigente && setError(apiErrorMessage(e, 'No pudimos cargar el listado.')));
    return () => {
      vigente = false;
    };
    // Se vuelve a pedir cuando cambia el plan o se edita algún socio.
  }, [planId, socios]);

  if (planId === null) return { socios: [] as SocioListado[], error: undefined };
  if (API_ENABLED) return { socios: remotos ?? [], error };

  // Sin estado de cuota es el listado del profesor, que no ve a los socios dados de baja (como el backend).
  const locales = socios
    .filter((s) => s.idPlan === planId && (conEstado || !s.fechaBaja))
    .map(({ id, dni, nombre, apellido }) => {
      const estadoCuota: EstadoCuotaSocio | undefined = conEstado
        ? estadoCuotasSocio(cuotas.filter((c) => c.idSocio === id))
        : undefined;
      return { id, dni, nombre, apellido, estadoCuota };
    });
  return { socios: locales, error: undefined };
}

export { ESTADO_CUOTA_SOCIO_LABEL } from '../lib/rules';
