import { useEffect, useState } from 'react';

const TAMANIOS = [20, 100];

/**
 * Pagina una lista en el cliente. Al cambiar `filtro` se vuelve a la primera página;
 * si la lista se achica, la página actual se ajusta sola.
 */
export function usePaginacion<T>(items: T[], filtro?: unknown) {
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(TAMANIOS[0]);

  useEffect(() => {
    setPagina(1);
  }, [filtro]);

  const paginas = Math.max(1, Math.ceil(items.length / porPagina));
  const actual = Math.min(pagina, paginas);
  const desde = (actual - 1) * porPagina;

  return {
    visibles: items.slice(desde, desde + porPagina),
    paginacion: {
      total: items.length,
      desde,
      hasta: Math.min(desde + porPagina, items.length),
      pagina: actual,
      paginas,
      porPagina,
      setPagina,
      setPorPagina: (valor: number) => {
        setPorPagina(valor);
        setPagina(1);
      },
    },
  };
}

type Props = ReturnType<typeof usePaginacion>['paginacion'];

export function Paginacion({ total, desde, hasta, pagina, paginas, porPagina, setPagina, setPorPagina }: Props) {
  if (total <= TAMANIOS[0]) return null;

  return (
    <nav className="paginacion" aria-label="Paginación">
      <span role="status">
        {desde + 1}–{hasta} de {total}
      </span>
      <div className="paginacion-botones">
        <button type="button" className="btn line sm" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>
          Anterior
        </button>
        <span>
          Página {pagina} de {paginas}
        </span>
        <button type="button" className="btn line sm" disabled={pagina === paginas} onClick={() => setPagina(pagina + 1)}>
          Siguiente
        </button>
      </div>
      <label>
        Por página{' '}
        <select value={porPagina} onChange={(event) => setPorPagina(Number(event.target.value))}>
          {TAMANIOS.map((tamanio) => (
            <option key={tamanio} value={tamanio}>
              {tamanio}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
}
