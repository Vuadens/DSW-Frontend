import { useEffect, useMemo, useState } from 'react';
import { useForm, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AuthShell } from './AuthShell';
import { API_ENABLED, apiErrorMessage } from '../../api/httpClient';
import { planesService } from '../../api/planes.service';
import { Fields, type FieldDef } from '../../components/common/Fields';
import { fmt } from '../../lib/format';
import { asSchema, email, persona, toOptions } from '../../lib/forms';
import type { Plan } from '../../models';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';

const schema = asSchema(z.object({ ...persona, email, idPlan: z.string().min(1, 'Elegí un plan') }));

const defaultValues = { nombre: '', apellido: '', dni: '', telefono: '', fechaNac: '', email: '', idPlan: '' };

export default function RegisterPage() {
  const session = useAuthStore((s) => s.session);
  const registrar = useAuthStore((s) => s.register);
  const planesDemo = useDataStore((s) => s.planes);
  const navigate = useNavigate();
  const [planes, setPlanes] = useState<Plan[]>(API_ENABLED ? [] : planesDemo);
  const [error, setError] = useState('');
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FieldValues>({ resolver: zodResolver(schema as never), defaultValues });

  // Sin sesión todavía no se cargó el store: los planes se piden acá.
  useEffect(() => {
    if (!API_ENABLED) return;
    planesService
      .list()
      .then(setPlanes)
      .catch((e) => setError(apiErrorMessage(e, 'No pudimos cargar los planes.')));
  }, []);

  const fields = useMemo<FieldDef[]>(
    () => [
      { name: 'nombre', label: 'Nombre', type: 'text', autoComplete: 'given-name' },
      { name: 'apellido', label: 'Apellido', type: 'text', autoComplete: 'family-name' },
      { name: 'dni', label: 'DNI', type: 'text', hint: 'Solo números. Los últimos 6 dígitos son tu contraseña inicial.' },
      { name: 'telefono', label: 'Teléfono', type: 'text', autoComplete: 'tel' },
      { name: 'fechaNac', label: 'Fecha de nacimiento', type: 'date', autoComplete: 'bday' },
      { name: 'email', label: 'Correo electrónico', type: 'email', autoComplete: 'email' },
      {
        name: 'idPlan',
        label: 'Plan',
        type: 'select',
        options: [{ value: '', label: 'Elegí un plan' }, ...toOptions(planes, (p) => `${p.nombre} · ${fmt(p.precio)}`)],
      },
    ],
    [planes],
  );

  if (session) return <Navigate to="/app" replace />;

  const submit = handleSubmit(async (v) => {
    setError('');
    const result = await registrar({
      nombre: v.nombre.trim(),
      apellido: v.apellido.trim(),
      dni: v.dni.trim(),
      telefono: v.telefono.trim(),
      fechaNac: v.fechaNac,
      email: v.email.trim(),
      idPlan: Number(v.idPlan),
    });
    if (result) return setError(result);
    navigate('/ingresar', {
      state: { aviso: 'Cuenta creada. Ingresá con tu DNI y los últimos 6 dígitos como contraseña.' },
    });
  });

  return (
    <AuthShell title="Sumate a Hades." text="Creá tu cuenta de socio, elegí tu plan y empezá a reservar clases hoy.">
      <h1>Crear cuenta</h1>
      <form onSubmit={submit} noValidate>
        <Fields fields={fields} register={register} control={control} errors={errors} />
        <p className="err" role="alert">
          {error}
        </p>
        <button type="submit" className="btn block" disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="lede">
        ¿Ya tenés cuenta?{' '}
        <Link to="/ingresar" className="text-link">
          Ingresar
        </Link>
      </p>
    </AuthShell>
  );
}
