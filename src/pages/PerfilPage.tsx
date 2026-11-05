import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ConfirmDialog, Dialog } from '../components/common/Dialog';
import { FormDrawer } from '../components/common/FormDrawer';
import type { FieldDef } from '../components/common/Fields';
import { Avatar } from '../components/common/Avatar';
import { PhotoModal } from '../components/common/PhotoModal';
import { PageHeader } from '../components/common/Tile';
import { fmt, fullName } from '../lib/format';
import { periodoLabel } from '../lib/rules';
import { photoKey, useAuthStore, useCurrentUser } from '../stores/authStore';
import { useDataStore } from '../stores/dataStore';
import { useUiStore } from '../stores/uiStore';
import { MODULOS_DEMO } from '../lib/features';

const ROLE_LABEL = { admin: 'Administrador', profesor: 'Profesor', socio: 'Socio' } as const;

/** El socio elige el plan al que se pasa: rige desde el mes siguiente. */
function CambiarPlanDialog({ open, socioId, onClose }: { open: boolean; socioId: number; onClose: () => void }) {
  const planes = useDataStore((s) => s.planes);
  const socio = useDataStore((s) => s.socios.find((x) => x.id === socioId));
  const cambiarPlan = useDataStore((s) => s.cambiarPlan);
  const showToast = useUiStore((s) => s.showToast);
  const [idPlan, setIdPlan] = useState('');
  const [error, setError] = useState('');
  const opciones = planes.filter((p) => p.id !== socio?.idPlan);

  return (
    <Dialog open={open} onClose={onClose} variant="modal" label="Cambiar de plan">
      <h2>Cambiar de plan</h2>
      <p className="lede" style={{ marginTop: 0 }}>
        El plan nuevo rige desde el 1° del mes que viene. Hasta entonces seguís con tu plan actual y podés cancelar el cambio.
      </p>
      <div className="fld">
        <label htmlFor="plan-nuevo">Plan nuevo</label>
        <select id="plan-nuevo" value={idPlan} onChange={(event) => { setIdPlan(event.target.value); setError(''); }}>
          <option value="">Elegí un plan</option>
          {opciones.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} · {fmt(p.precio)}
            </option>
          ))}
        </select>
        {error && <span className="fld-err" role="alert">{error}</span>}
      </div>
      <div className="acts">
        <button type="button" className="btn line sm" onClick={onClose}>Cancelar</button>
        <button
          type="button"
          className="btn sm"
          disabled={!idPlan}
          onClick={async () => {
            const result = await cambiarPlan(socioId, Number(idPlan));
            if (result.error) return setError(result.error);
            showToast('Cambio de plan programado.');
            setIdPlan('');
            onClose();
          }}
        >
          Confirmar cambio
        </button>
      </div>
    </Dialog>
  );
}

export default function PerfilPage() {
  const user = useCurrentUser();
  const photos = useAuthStore((s) => s.photos);
  const removePhoto = useAuthStore((s) => s.removePhoto);
  const plan = useDataStore((s) => user?.role === 'socio' ? s.planes.find((p) => p.id === s.socios.find((member) => member.id === user.id)?.idPlan) : undefined);
  const showToast = useUiStore((s) => s.showToast);
  const save = useDataStore((s) => s.save);
  const darDeBaja = useDataStore((s) => s.darDeBajaSocio);
  const cambiarPlan = useDataStore((s) => s.cambiarPlan);
  const socio = useDataStore((s) => (user?.role === 'socio' ? s.socios.find((member) => member.id === user.id) : undefined));
  const planes = useDataStore((s) => s.planes);
  const planProximo = socio?.planProximoId
    ? { plan: planes.find((p) => p.id === socio.planProximoId), desde: socio.planProximoDesde }
    : undefined;
  const [planOpen, setPlanOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [photoOpen, setPhotoOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [bajaOpen, setBajaOpen] = useState(false);
  const [bajaError, setBajaError] = useState<string>();
  if (!user) return null;
  const photo = photos[photoKey(user.role, user.id)];
  const name = fullName(user.nombre, user.apellido);
  const profileFields: FieldDef[] = [
    { name: 'nombre', label: 'Nombre', type: 'text', autoComplete: 'given-name' },
    { name: 'apellido', label: 'Apellido', type: 'text', autoComplete: 'family-name' },
    { name: 'telefono', label: 'Teléfono', type: 'text', autoComplete: 'tel' },
  ];
  const profileSchema = z.object({
    nombre: z.string().trim().min(2, 'Ingresá tu nombre.'),
    apellido: z.string().trim().min(2, 'Ingresá tu apellido.'),
    telefono: z.string().trim().min(6, 'Ingresá un teléfono válido.'),
  });
  // En modo conectado solo el profesor edita sus datos: los socios los actualiza el administrador.
  const puedeEditar = MODULOS_DEMO || user.role === 'profesor';
  const current = user.role === 'socio'
    ? useDataStore.getState().socios.find((item) => item.id === user.id)
    : useDataStore.getState().profesores.find((item) => item.id === user.id);

  return <>
    <PageHeader title="Tu perfil." lede={MODULOS_DEMO ? 'Podés cambiar tu foto y consultar tus datos.' : 'Consultá y actualizá tus datos.'} />
    <section className="profile-screen" aria-label="Datos personales">
      <div className="profile-portrait">
        <Avatar role={user.role} name={name} photo={photo} />
      </div>
      <div className="profile-details">
        <h2>{name}</h2>
        <div className="profile-detail"><small>Rol</small><strong>{ROLE_LABEL[user.role]}</strong></div>
        <div className="profile-detail"><small>Correo</small><strong>{user.email}</strong></div>
        <div className="profile-detail"><small>Información</small><strong>{user.detalle}{plan ? ` · Plan ${plan.nombre}` : ''}</strong></div>
        {planProximo && (
          <div className="profile-detail">
            <small>Cambio de plan</small>
            <strong>Desde {periodoLabel(planProximo.desde.slice(0, 7)).toLowerCase()}: plan {planProximo.plan?.nombre ?? 'elegido'}</strong>
          </div>
        )}
        <div className="profile-actions">
          {puedeEditar && <button type="button" className="btn sm" onClick={() => setEditOpen(true)}>Editar mis datos</button>}
          {MODULOS_DEMO && <button type="button" className="btn line sm" onClick={() => setPhotoOpen(true)}>{photo ? 'Cambiar foto' : 'Subir foto'}</button>}
          {MODULOS_DEMO && photo && <button type="button" className="btn line sm" onClick={async () => { await removePhoto(); showToast('Foto eliminada.'); }}>Quitar foto</button>}
          {user.role === 'socio' && <button type="button" className="btn sm" onClick={() => setPlanOpen(true)}>{planProximo ? 'Elegir otro plan' : 'Cambiar de plan'}</button>}
          {user.role === 'socio' && planProximo && <button type="button" className="btn line sm" onClick={async () => { const result = await cambiarPlan(user.id, null); showToast(result.error ?? 'Cambio de plan cancelado.'); }}>Cancelar cambio de plan</button>}
          {user.role === 'socio' && <button type="button" className="btn line sm" onClick={() => { setBajaError(undefined); setBajaOpen(true); }}>Darme de baja del gimnasio</button>}
        </div>
      </div>
    </section>
    <ConfirmDialog
      open={bajaOpen}
      title="Darte de baja del gimnasio"
      message={bajaError ?? 'Tu baja queda registrada con fecha de hoy, se cancelan tus reservas y perdés el acceso al sistema. Para volver, acercate a recepción.'}
      confirmLabel={bajaError ? 'Reintentar' : 'Darme de baja'}
      onCancel={() => setBajaOpen(false)}
      onConfirm={async () => {
        const result = await darDeBaja(user.id);
        if (result.error) return setBajaError(result.error);
        logout();
        navigate('/ingresar', { replace: true, state: { aviso: 'Te diste de baja del gimnasio.' } });
      }}
    />
    {user.role === 'socio' && <CambiarPlanDialog open={planOpen} socioId={user.id} onClose={() => setPlanOpen(false)} />}
    <PhotoModal open={photoOpen} hasPhoto={Boolean(photo)} onClose={() => setPhotoOpen(false)} />
    <FormDrawer
      open={editOpen}
      title="Editar mis datos"
      fields={profileFields}
      schema={profileSchema}
      defaultValues={{
        nombre: current?.nombre ?? user.nombre,
        apellido: current?.apellido ?? user.apellido,
        telefono: current?.telefono ?? '',
      }}
      onClose={() => setEditOpen(false)}
      onSubmit={async (values) => {
        const result = user.role === 'socio'
          ? await save('socios', { ...(current ?? {}), ...values, id: user.id } as never)
          : await save('profesores', { ...(current ?? {}), ...values, id: user.id } as never);
        if (!result.error) {
          setEditOpen(false);
          showToast('Tus datos fueron actualizados.');
        }
        return result.error;
      }}
    />
  </>;
}
