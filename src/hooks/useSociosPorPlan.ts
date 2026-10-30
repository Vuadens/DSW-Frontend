import { useEffect, useState } from 'react';
import { API_ENABLED, apiErrorMessage } from '../api/httpClient';
import { sociosService, type EstadoCuotaSocio } from '../api/socios.service';
import { PERIODO_ACTUAL } from '../lib/format';
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

  const locales = socios
    .filter((s) => s.idPlan === planId)
    .map(({ id, dni, nombre, apellido }) => {
      const pago = cuotas.some((c) => c.idSocio === id && c.periodo === PERIODO_ACTUAL && c.fechaPago);
      const estadoCuota: EstadoCuotaSocio | undefined = conEstado ? (pago ? 'AL_DIA' : 'ADEUDA') : undefined;
      return { id, dni, nombre, apellido, estadoCuota };
    });
  return { socios: locales, error: undefined };
}

export const ESTADO_CUOTA_SOCIO_LABEL: Record<EstadoCuotaSocio, string> = {
  AL_DIA: 'Cuota al día',
  ADEUDA: 'Adeuda la cuota',
};
