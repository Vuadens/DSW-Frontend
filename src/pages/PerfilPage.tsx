import { useState } from 'react';
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
  const [photoOpen, setPhotoOpen] = useState(false);
  if (!user) return null;
  const photo = photos[photoKey(user.role, user.id)];
  const name = fullName(user.nombre, user.apellido);

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
          <button type="button" className="btn sm" onClick={() => setPhotoOpen(true)}>{photo ? 'Cambiar foto' : 'Subir foto'}</button>
          {photo && <button type="button" className="btn line sm" onClick={async () => { await removePhoto(); showToast('Foto eliminada.'); }}>Quitar foto</button>}
        </div>
      </div>
    </section>
    <PhotoModal open={photoOpen} hasPhoto={Boolean(photo)} onClose={() => setPhotoOpen(false)} />
  </>;
}
