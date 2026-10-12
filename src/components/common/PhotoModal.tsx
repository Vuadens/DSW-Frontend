import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Dialog } from './Dialog';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';

const BOX = 280;
const OUTPUT = 400;
const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  open: boolean;
  hasPhoto: boolean;
  onClose: () => void;
}

export function PhotoModal({ open, hasPhoto, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} variant="modal" extraClass="photo" label="Foto de perfil">
      <PhotoEditor hasPhoto={hasPhoto} onClose={onClose} />
    </Dialog>
  );
}

function PhotoEditor({ hasPhoto, onClose }: { hasPhoto: boolean; onClose: () => void }) {
  const setPhoto = useAuthStore((s) => s.setPhoto);
  const removePhoto = useAuthStore((s) => s.removePhoto);
  const showToast = useUiStore((s) => s.showToast);

  const [src, setSrc] = useState<string>();
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => () => {
    if (src) URL.revokeObjectURL(src);
  }, [src]);

  const baseScale = natural.w ? BOX / Math.min(natural.w, natural.h) : 1;
  const scale = baseScale * zoom;

  const clamp = (x: number, y: number, s = scale) => ({
    x: Math.min(0, Math.max(BOX - natural.w * s, x)),
    y: Math.min(0, Math.max(BOX - natural.h * s, y)),
  });

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Elegí un archivo de imagen (JPG, PNG o WebP).');
    if (file.size > MAX_BYTES) return setError('La imagen supera los 5 MB.');
    setError(undefined);
    setZoom(1);
    setSrc(URL.createObjectURL(file));
  };

  const onLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const s = BOX / Math.min(w, h);
    setNatural({ w, h });
    setOffset({ x: (BOX - w * s) / 2, y: (BOX - h * s) / 2 });
  };

  const changeZoom = (next: number) => {
    const nextScale = baseScale * next;
    const cx = (BOX / 2 - offset.x) / scale;
    const cy = (BOX / 2 - offset.y) / scale;
    setZoom(next);
    setOffset(clamp(BOX / 2 - cx * nextScale, BOX / 2 - cy * nextScale, nextScale));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setOffset(clamp(drag.current.ox + event.clientX - drag.current.x, drag.current.oy + event.clientY - drag.current.y));
  };

  const save = async () => {
    const img = imgRef.current;
    if (!img) return;
    setSaving(true);
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return setSaving(false);
    const side = BOX / scale;
    ctx.drawImage(img, -offset.x / scale, -offset.y / scale, side, side, 0, 0, OUTPUT, OUTPUT);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) {
      setSaving(false);
      return setError('No pudimos procesar la imagen.');
    }
    const failure = await setPhoto(blob);
    setSaving(false);
    if (failure) return setError(failure);
    showToast('Foto de perfil actualizada.');
    onClose();
  };

  const remove = async () => {
    await removePhoto();
    showToast('Foto eliminada.');
    onClose();
  };

  return (
    <>
      <h2>Foto de perfil</h2>
      {src ? (
        <>
          <div
            className="crop"
            style={{ width: BOX, height: BOX, touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
          >
            <img
              ref={imgRef}
              src={src}
              alt="Vista previa de la foto"
              onLoad={onLoad}
              draggable={false}
              style={{
                width: natural.w * scale || undefined,
                height: natural.h * scale || undefined,
                maxWidth: 'none',
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
            <span className="mask" aria-hidden="true" />
          </div>
          <label className="zm">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => changeZoom(Number(event.target.value))}
            />
          </label>
        </>
      ) : (
        <label
          className="drop"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            pick(event.dataTransfer.files[0]);
          }}
        >
          <input type="file" accept="image/*" onChange={(event) => pick(event.target.files?.[0])} />
          <b>Elegí una imagen</b>
          <span>o arrastrala hasta acá. Máximo 5 MB.</span>
        </label>
      )}
      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}
      <div className="acts">
        {hasPhoto && !src && (
          <button type="button" className="btn line sm" onClick={remove}>
            Quitar foto
          </button>
        )}
        {src && (
          <button type="button" className="btn line sm" onClick={() => setSrc(undefined)}>
            Elegir otra
          </button>
        )}
        <button type="button" className="btn line sm" onClick={onClose}>
          Cancelar
        </button>
        {src && (
          <button type="button" className="btn sm" onClick={save} disabled={saving || !natural.w}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        )}
      </div>
    </>
  );
}
