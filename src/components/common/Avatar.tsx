import { initials } from '../../lib/format';
import type { Role } from '../../models';

interface Props {
  role: Role;
  name: string;
  photo?: string;
  onClick?: () => void;
}

export function Avatar({ role, name, photo, onClick }: Props) {
  const content = photo ? <img src={photo} alt="" /> : initials(name);
  if (onClick) {
    return (
      <button type="button" className="av" data-r={role} onClick={onClick} aria-label="Cambiar foto de perfil">
        {content}
      </button>
    );
  }
  return (
    <span className="av" data-r={role} aria-hidden="true">
      {content}
    </span>
  );
}
