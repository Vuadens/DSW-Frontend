import { useState } from 'react';
import { Avatar } from '../components/common/Avatar';
import { PhotoModal } from '../components/common/PhotoModal';
import { PageHeader, Tile } from '../components/common/Tile';
import { fullName } from '../lib/format';
import { photoKey, useAuthStore, useCurrentUser } from '../stores/authStore';
import { useDataStore } from '../stores/dataStore';
import { useUiStore } from '../stores/uiStore';

const ROLE_LABEL = { admin: 'Administrador', profesor: 'Profesor', socio: 'Socio' } as const;

export default function PerfilPage() {
  const user = useCurrentUser();
  const photos = useAuthStore((s) => s.photos);
  const removePhoto = useAuthStore((s) => s.removePhoto);
  const plan = useDataStore((s) => {
    if (user?.role !== 'socio') return undefined;
    const socio = s.socios.find((x) => x.id === user.id);
    return s.planes.find((p) => p.id === socio?.idPlan);
  });
  const showToast = useUiStore((s) => s.showToast);
  const [photoOpen, setPhotoOpen] = useState(false);

  if (!user) return null;
  const photo = photos[photoKey(user.role, user.id)];
  const name = fullName(user.nombre, user.apellido);

  return (
    <>
      <PageHeader title="Mi perfil" lede="Tus datos y tu foto." />
      <div className="grid2 profile">
        <Tile tone="purple" flat>
          <Avatar role={user.role} name={name} photo={photo} />
          <h3>{name}</h3>
          <p>{user.email}</p>
          <p>
            {ROLE_LABEL[user.role]} · {user.detalle}
            {plan ? ` · Plan ${plan.nombre}` : ''}
          </p>
        </Tile>
        <div>
          <div className="acts" style={{ justifyContent: 'flex-start' }}>
            <button type="button" className="btn sm" onClick={() => setPhotoOpen(true)}>
              {photo ? 'Cambiar foto' : 'Subir foto'}
            </button>
            {photo && (
              <button
                type="button"
                className="btn line sm"
                onClick={async () => {
                  await removePhoto();
                  showToast('Foto eliminada.');
                }}
              >
                Quitar foto
              </button>
            )}
          </div>
          <p className="lede">La foto se guarda en el servidor y se muestra en el menú lateral.</p>
        </div>
      </div>
      <PhotoModal open={photoOpen} hasPhoto={Boolean(photo)} onClose={() => setPhotoOpen(false)} />
    </>
  );
}
