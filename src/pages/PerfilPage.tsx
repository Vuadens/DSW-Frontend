import { useState } from 'react';
import { z } from 'zod';
import { FormDrawer } from '../components/common/FormDrawer';
import type { FieldDef } from '../components/common/Fields';
import { Avatar } from '../components/common/Avatar';
import { PhotoModal } from '../components/common/PhotoModal';
import { PageHeader } from '../components/common/Tile';
import { fullName } from '../lib/format';
import { photoKey, useAuthStore, useCurrentUser } from '../stores/authStore';
import { useDataStore } from '../stores/dataStore';
import { useUiStore } from '../stores/uiStore';

const ROLE_LABEL = { admin: 'Administrador', profesor: 'Profesor', socio: 'Socio' } as const;

export default function PerfilPage() {
  const user = useCurrentUser();
  const photos = useAuthStore((s) => s.photos);
  const removePhoto = useAuthStore((s) => s.removePhoto);
  const plan = useDataStore((s) => user?.role === 'socio' ? s.planes.find((p) => p.id === s.socios.find((member) => member.id === user.id)?.idPlan) : undefined);
  const showToast = useUiStore((s) => s.showToast);
  const save = useDataStore((s) => s.save);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  if (!user) return null;
  const photo = photos[photoKey(user.role, user.id)];
  const name = fullName(user.nombre, user.apellido);
  const profileFields: FieldDef[] = [
    { name: 'nombre', label: 'Nombre', type: 'text', autoComplete: 'given-name' },
    { name: 'apellido', label: 'Apellido', type: 'text', autoComplete: 'family-name' },
    { name: 'email', label: 'Correo', type: 'email', autoComplete: 'email' },
    { name: 'telefono', label: 'Teléfono', type: 'text', autoComplete: 'tel' },
    ...(user.role === 'socio' ? [{ name: 'direccion', label: 'Dirección', type: 'text' as const, autoComplete: 'street-address' }] : []),
  ];
  const profileSchema = z.object({
    nombre: z.string().trim().min(2, 'Ingresá tu nombre.'),
    apellido: z.string().trim().min(2, 'Ingresá tu apellido.'),
    email: z.string().trim().email('Ingresá un correo válido.'),
    telefono: z.string().trim().min(6, 'Ingresá un teléfono válido.'),
    ...(user.role === 'socio' ? { direccion: z.string().trim().min(3, 'Ingresá tu dirección.') } : {}),
  });
  const current = user.role === 'socio'
    ? useDataStore.getState().socios.find((item) => item.id === user.id)
    : useDataStore.getState().profesores.find((item) => item.id === user.id);

  return <>
    <PageHeader title="Tu perfil." lede="Podés cambiar tu foto y consultar tus datos." />
    <section className="profile-screen" aria-label="Datos personales">
      <div className="profile-portrait">
        <Avatar role={user.role} name={name} photo={photo} />
      </div>
      <div className="profile-details">
        <h2>{name}</h2>
        <div className="profile-detail"><small>Rol</small><strong>{ROLE_LABEL[user.role]}</strong></div>
        <div className="profile-detail"><small>Correo</small><strong>{user.email}</strong></div>
        <div className="profile-detail"><small>Información</small><strong>{user.detalle}{plan ? ` · Plan ${plan.nombre}` : ''}</strong></div>
        <div className="profile-actions">
          <button type="button" className="btn sm" onClick={() => setEditOpen(true)}>Editar mis datos</button>
          <button type="button" className="btn line sm" onClick={() => setPhotoOpen(true)}>{photo ? 'Cambiar foto' : 'Subir foto'}</button>
          {photo && <button type="button" className="btn line sm" onClick={async () => { await removePhoto(); showToast('Foto eliminada.'); }}>Quitar foto</button>}
        </div>
      </div>
    </section>
    <PhotoModal open={photoOpen} hasPhoto={Boolean(photo)} onClose={() => setPhotoOpen(false)} />
    <FormDrawer
      open={editOpen}
      title="Editar mis datos"
      fields={profileFields}
      schema={profileSchema}
      defaultValues={{
        nombre: current?.nombre ?? user.nombre,
        apellido: current?.apellido ?? user.apellido,
        email: current?.email ?? user.email,
        telefono: current && 'telefono' in current ? current.telefono : '',
        ...(user.role === 'socio' && current && 'direccion' in current ? { direccion: current.direccion } : {}),
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
