import { useState } from 'react';
import { useForm, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '../../components/common/Dialog';
import { EntityPage } from '../../components/common/EntityPage';
import { Fields, type FieldDef } from '../../components/common/Fields';
import { Pill } from '../../components/common/Tile';
import { TODAY, longDate } from '../../lib/format';
import { MODULOS_DEMO } from '../../lib/features';
import { asSchema, date, required, str } from '../../lib/forms';
import { ESTADO_MAQUINA_LABEL } from '../../lib/rules';
import type { Maquina, TipoMantenimiento } from '../../models';
import { useDataStore } from '../../stores/dataStore';
import { useUiStore } from '../../stores/uiStore';

const schema = asSchema(
  z.object({ nombre: required, tipo: required, descripcion: z.string().trim() }),
);

const fields: FieldDef[] = [
  { name: 'nombre', label: 'Nombre', type: 'text' },
  { name: 'tipo', label: 'Tipo', type: 'text', placeholder: 'Cardio, fuerza…' },
  { name: 'descripcion', label: 'Descripción', type: 'textarea' },
];

const mantSchema = z
  .object({
    tipo: z.enum(['Preventivo', 'Correctivo']),
    fechaInicio: date,
    fechaFinEsperada: date,
    descripcion: required,
  })
  .refine((v) => v.fechaFinEsperada >= v.fechaInicio, {
    path: ['fechaFinEsperada'],
    message: 'No puede ser anterior al inicio',
  });

const mantFields: FieldDef[] = [
  {
    name: 'tipo',
    label: 'Tipo',
    type: 'select',
    options: [
      { value: 'Preventivo', label: 'Preventivo' },
      { value: 'Correctivo', label: 'Correctivo (fuera de servicio)' },
    ],
  },
  { name: 'fechaInicio', label: 'Inicio', type: 'date' },
  { name: 'fechaFinEsperada', label: 'Fin esperado', type: 'date' },
  { name: 'descripcion', label: 'Descripción', type: 'textarea' },
];

export default function MaquinasPage() {
  const maquinas = useDataStore((s) => s.maquinas);
  const [maintId, setMaintId] = useState<number | null>(null);

  return (
    <>
      <EntityPage<Maquina>
        title="Máquinas"
        lede="Inventario y estado de los equipos."
        singular="máquina"
        collection="maquinas"
        items={maquinas}
        fields={fields}
        schema={schema}
        searchText={(m) => `${m.nombre} ${m.tipo}`}
        toForm={(m) => ({
          nombre: str(m?.nombre),
          tipo: str(m?.tipo),
          descripcion: str(m?.descripcion),
        })}
        fromForm={(v, existing) => ({
          id: existing?.id,
          nombre: v.nombre.trim(),
          tipo: v.tipo.trim(),
          descripcion: v.descripcion.trim(),
          estado: existing?.estado ?? 'ok',
          mantenimientos: existing?.mantenimientos ?? [],
        })}
        renderItem={(m) => (
          <>
            <h3>{m.nombre}</h3>
            <small>{m.tipo}</small>
            <small>
              <Pill kind={m.estado === 'ok' ? 'ok' : m.estado === 'out' ? 'mora' : undefined}>
                {ESTADO_MAQUINA_LABEL[m.estado]}
              </Pill>
            </small>
          </>
        )}
        renderActions={(m) => (
          <button type="button" className="btn line sm" onClick={() => setMaintId(m.id)}>
            Mantenimiento
          </button>
        )}
      />
      <MantenimientoDrawer maquinaId={maintId} onClose={() => setMaintId(null)} />
    </>
  );
}

function MantenimientoDrawer({ maquinaId, onClose }: { maquinaId: number | null; onClose: () => void }) {
  return (
    <Dialog open={maquinaId !== null} onClose={onClose} label="Mantenimiento">
      {maquinaId !== null &&
        (MODULOS_DEMO ? (
          <MantenimientoContent maquinaId={maquinaId} onClose={onClose} />
        ) : (
          <MantenimientoProximamente onClose={onClose} />
        ))}
    </Dialog>
  );
}

// El historial de mantenimientos todavía no tiene backend.
function MantenimientoProximamente({ onClose }: { onClose: () => void }) {
  return (
    <>
      <h2>Mantenimiento</h2>
      <p className="none">Próximamente vas a poder registrar y consultar los mantenimientos de cada máquina.</p>
      <div className="acts">
        <button type="button" className="btn line sm" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </>
  );
}

function MantenimientoContent({ maquinaId, onClose }: { maquinaId: number; onClose: () => void }) {
  const maquina = useDataStore((s) => s.maquinas.find((m) => m.id === maquinaId));
  const addMantenimiento = useDataStore((s) => s.addMantenimiento);
  const cerrarMantenimiento = useDataStore((s) => s.cerrarMantenimiento);
  const showToast = useUiStore((s) => s.showToast);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FieldValues>({
    resolver: zodResolver(mantSchema as never),
    defaultValues: { tipo: 'Preventivo', fechaInicio: TODAY, fechaFinEsperada: TODAY, descripcion: '' },
  });

  if (!maquina) return null;
  const abierto = maquina.mantenimientos.find((m) => !m.fechaFinReal);

  return (
    <>
      <h2>{maquina.nombre}</h2>
      <p className="lede" style={{ marginTop: 0 }}>
        {ESTADO_MAQUINA_LABEL[maquina.estado]}
      </p>

      {abierto ? (
        <div className="acts" style={{ justifyContent: 'flex-start' }}>
          <button
            type="button"
            className="btn sm"
            onClick={() => {
              cerrarMantenimiento(maquina.id, abierto.id);
              showToast('Mantenimiento cerrado. La máquina vuelve a estar operativa.');
            }}
          >
            Cerrar mantenimiento abierto
          </button>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={handleSubmit((v) => {
            addMantenimiento(maquina.id, {
              tipo: v.tipo as TipoMantenimiento,
              fechaInicio: v.fechaInicio,
              fechaFinEsperada: v.fechaFinEsperada,
              descripcion: v.descripcion.trim(),
            });
            reset();
            showToast('Mantenimiento registrado.');
          })}
        >
          <Fields fields={mantFields} register={register} control={control} errors={errors} />
          <div className="acts">
            <button type="submit" className="btn sm">
              Registrar mantenimiento
            </button>
          </div>
        </form>
      )}

      <h3 style={{ marginTop: 28 }}>Historial</h3>
      {maquina.mantenimientos.length === 0 ? (
        <p className="none">Sin mantenimientos registrados.</p>
      ) : (
        <div className="rows tight">
          {maquina.mantenimientos.map((m) => (
            <div key={m.id} className="row compact">
              <div>
                <h3>{m.tipo}</h3>
                <small>{m.descripcion}</small>
                <small>
                  {longDate(m.fechaInicio)} · {m.fechaFinReal ? `cerrado el ${longDate(m.fechaFinReal)}` : `fin esperado ${longDate(m.fechaFinEsperada)}`}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="acts">
        <button type="button" className="btn line sm" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </>
  );
}
