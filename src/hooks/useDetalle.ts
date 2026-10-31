import { useEffect, useState } from 'react';
import { apiErrorMessage } from '../api/httpClient';

/** Pide el detalle de un elemento cada vez que se abre. `cargar` tiene que ser una función estable. */
export function useDetalle<T>(id: number | null, cargar: (id: number) => Promise<T>) {
  const [estado, setEstado] = useState<{ detalle?: T; error?: string }>({});

  useEffect(() => {
    if (id === null) return;
    let vigente = true;
    setEstado({});
    cargar(id)
      .then((detalle) => vigente && setEstado({ detalle }))
      .catch((e) => vigente && setEstado({ error: apiErrorMessage(e, 'No pudimos cargar el detalle.') }));
    return () => {
      vigente = false;
    };
  }, [id, cargar]);

  return estado;
}
