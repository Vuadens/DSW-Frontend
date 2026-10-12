import { useMemo, useState, type ReactNode } from 'react';
import type { FieldValues } from 'react-hook-form';
import type { ZodType } from 'zod';
import { ConfirmDialog } from './Dialog';
import type { FieldDef } from './Fields';
import { FormDrawer } from './FormDrawer';
import { PageHeader } from './Tile';
import { useDataStore, type CollectionKey } from '../../stores/dataStore';
import { useUiStore } from '../../stores/uiStore';

interface Props<T extends { id: number }> {
  title: string;
  lede?: string;
  singular: string;
  collection: CollectionKey;
  items: T[];
  fields: FieldDef[];
  schema: ZodType<FieldValues>;
  toForm: (item?: T) => FieldValues;
  fromForm: (values: FieldValues, existing?: T) => Omit<T, 'id'> & { id?: number };
  renderItem: (item: T) => ReactNode;
  searchText?: (item: T) => string;
  /** Acciones extra por fila, antes de Editar y Eliminar. */
  renderActions?: (item: T) => ReactNode;
  canEdit?: boolean;
  /** Contenido adicional bajo el encabezado, por ejemplo resúmenes. */
  header?: ReactNode;
  itemClassName?: (item: T) => string;
}

export function EntityPage<T extends { id: number }>({
  title,
  lede,
  singular,
  collection,
  items,
  fields,
  schema,
  toForm,
  fromForm,
  renderItem,
  searchText,
  renderActions,
  header,
  itemClassName,
}: Props<T>) {
  const save = useDataStore((s) => s.save);
  const remove = useDataStore((s) => s.remove);
  const showToast = useUiStore((s) => s.showToast);

  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [deleteError, setDeleteError] = useState<string>();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchText) return items;
    return items.filter((item) => searchText(item).toLowerCase().includes(q));
  }, [items, query, searchText]);

  const existing = editing && editing !== 'new' ? editing : undefined;
  const defaults = useMemo(() => toForm(existing), [existing, toForm]);

  return (
    <>
      <PageHeader
        title={title}
        lede={lede}
        actions={
          <button type="button" className="btn sm" onClick={() => setEditing('new')}>
            Agregar {singular}
          </button>
        }
      />
      {header}
      {searchText && (
        <div className="hfilter">
          <input
            type="search"
            placeholder={`Buscar ${title.toLowerCase()}`}
            aria-label={`Buscar ${title.toLowerCase()}`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      )}
      {visible.length === 0 ? (
        <p className="none">{items.length === 0 ? `Todavía no hay ${title.toLowerCase()}.` : 'Sin resultados.'}</p>
      ) : (
        <div className="rows">
          {visible.map((item) => (
            <div key={item.id} className={`row ${itemClassName?.(item) ?? ''}`}>
              <div>{renderItem(item)}</div>
              <div className="rb">
                {renderActions?.(item)}
                <button type="button" className="btn line sm" onClick={() => setEditing(item)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn line sm"
                  onClick={() => {
                    setDeleteError(undefined);
                    setDeleting(item);
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormDrawer
        open={editing !== null}
        title={existing ? `Editar ${singular}` : `Nuevo ${singular}`}
        fields={fields}
        schema={schema}
        defaultValues={defaults}
        onClose={() => setEditing(null)}
        onSubmit={async (values) => {
          const result = await save(collection, fromForm(values, existing) as never);
          if (result.error) return result.error;
          showToast(existing ? 'Cambios guardados.' : `${singular[0].toUpperCase()}${singular.slice(1)} creado.`);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title={`Eliminar ${singular}`}
        message={deleteError ?? 'Esta acción no se puede deshacer.'}
        confirmLabel={deleteError ? 'Reintentar' : 'Eliminar'}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const result = await remove(collection, deleting.id);
          if (result.error) return setDeleteError(`No se puede eliminar: ${result.error}`);
          showToast('Eliminado.');
          setDeleting(null);
        }}
      />
    </>
  );
}
