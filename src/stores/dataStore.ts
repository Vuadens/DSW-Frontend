import { create } from 'zustand';
import {
  seedActividades,
  seedAdmins,
  seedClases,
  seedCuotas,
  seedInscripciones,
  seedMaquinas,
  seedMateriales,
  seedPlanes,
  seedProfesores,
  seedSocios,
  seedTurnos,
} from '../data/seed';
import { API_ENABLED, apiErrorMessage } from '../api/httpClient';
import { actividadesService } from '../api/actividades.service';
import { planesService } from '../api/planes.service';
import { profesoresService } from '../api/profesores.service';
import { sociosService } from '../api/socios.service';
import { turnosService } from '../api/turnos.service';
import { clasesService } from '../api/clases.service';
import { cuotasService } from '../api/cuotas.service';
import { inscripcionesService } from '../api/inscripciones.service';
import { PERIODO_ACTUAL, TODAY, claseFecha, nextId } from '../lib/format';
import { adicionalPorClase, clasesDelPeriodo, puedeReservar } from '../lib/rules';
import type {
  Actividad,
  Administrador,
  Clase,
  Cuota,
  EstadoMaquina,
  Inscripcion,
  Maquina,
  Material,
  Mantenimiento,
  MetodoPago,
  Plan,
  Profesor,
  Role,
  Socio,
  Turno,
} from '../models';

interface Collections {
  planes: Plan[];
  socios: Socio[];
  profesores: Profesor[];
  administradores: Administrador[];
  turnos: Turno[];
  materiales: Material[];
  actividades: Actividad[];
  clases: Clase[];
  inscripciones: Inscripcion[];
  cuotas: Cuota[];
  maquinas: Maquina[];
}

export type CollectionKey = keyof Collections;
type Item<K extends CollectionKey> = Collections[K][number];
type Draft<K extends CollectionKey> = Omit<Item<K>, 'id'> & { id?: number };

export interface Result {
  error?: string;
}

interface Remote {
  create: (input: never) => Promise<unknown>;
  update: (id: number, input: never) => Promise<unknown>;
  remove: (id: number) => Promise<void>;
}

const remotes: Partial<Record<CollectionKey, Remote>> = {
  planes: planesService as unknown as Remote,
  socios: sociosService as unknown as Remote,
  profesores: profesoresService as unknown as Remote,
  actividades: actividadesService as unknown as Remote,
  turnos: turnosService as unknown as Remote,
  clases: clasesService as unknown as Remote,
};

/**
 * Ejecuta una operación sobre inscripciones en el backend y recarga clases e inscripciones,
 * porque la ocupación de las clases la calcula el backend.
 */
const conectado = async (operacion: () => Promise<unknown>): Promise<Result> => {
  try {
    await operacion();
    const [clases, inscripciones] = await Promise.all([clasesService.list(), inscripcionesService.list()]);
    useDataStore.setState({ clases, inscripciones });
    return {};
  } catch (error) {
    return { error: apiErrorMessage(error) };
  }
};

/** Bloqueos de integridad referencial: espejo de las restricciones del backend. */
const blockers = (state: Collections, key: CollectionKey, id: number): string | null => {
  switch (key) {
    case 'planes':
      return state.socios.some((s) => s.idPlan === id) ? 'Hay socios con este plan.' : null;
    case 'turnos':
      return state.profesores.some((p) => p.turnos.includes(id)) ? 'Hay profesores asignados a este turno.' : null;
    case 'profesores':
      return state.clases.some((c) => c.idProfesor === id) ? 'El profesor tiene clases asignadas.' : null;
    case 'actividades':
      return state.clases.some((c) => c.idActividad === id) ? 'La actividad tiene clases programadas.' : null;
    case 'materiales':
      return state.actividades.some((a) => a.materiales.includes(id)) ? 'El material se usa en una actividad.' : null;
    case 'maquinas':
      return state.actividades.some((a) => a.maquinas.includes(id)) ? 'La máquina se usa en una actividad.' : null;
    case 'clases':
      return state.inscripciones.some((i) => i.idClase === id && i.estado === 'Confirmada' && i.fechaClase >= TODAY)
        ? 'La clase tiene inscripciones vigentes.'
        : null;
    case 'socios':
      return state.cuotas.some((c) => c.idSocio === id && !c.fechaPago) ? 'El socio tiene cuotas impagas.' : null;
    default:
      return null;
  }
};

interface DataState extends Collections {
  loading: boolean;
  hydrate: (role: Role) => Promise<Result>;
  save: <K extends CollectionKey>(key: K, draft: Draft<K>) => Promise<Result>;
  remove: (key: CollectionKey, id: number) => Promise<Result>;
  reservar: (socioId: number, claseId: number) => Promise<Result & { adicional?: number }>;
  cancelarReserva: (inscripcionId: number) => Promise<Result>;
  marcarAsistencia: (inscripcionId: number, asistio: boolean) => Promise<Result>;
  /** Borrado físico de una inscripción (solo admin). */
  eliminarInscripcion: (inscripcionId: number) => Promise<Result>;
  /** En modo conectado registra el cobro en el backend, que no guarda el método de pago. */
  pagarCuota: (cuota: Cuota, metodo: MetodoPago) => Promise<Result>;
  generarCuotas: () => number;
  setEstadoMaquina: (id: number, estado: EstadoMaquina) => void;
  addMantenimiento: (maquinaId: number, data: Omit<Mantenimiento, 'id' | 'fechaFinReal'>) => void;
  cerrarMantenimiento: (maquinaId: number, mantenimientoId: number) => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  planes: seedPlanes(),
  socios: seedSocios(),
  profesores: seedProfesores(),
  administradores: seedAdmins(),
  turnos: seedTurnos(),
  materiales: seedMateriales(),
  actividades: seedActividades(),
  clases: seedClases(),
  inscripciones: seedInscripciones(),
  cuotas: seedCuotas(),
  maquinas: seedMaquinas(),
  loading: false,

  hydrate: async (role) => {
    if (!API_ENABLED) return {};
    set({ loading: true });
    try {
      // Solo lo que el rol puede ver: el socio no accede a profesores ni a turnos.
      const staff = role !== 'socio';
      const [planes, socios, profesores, turnos, actividades, clases, inscripciones, cuotas] = await Promise.all([
        planesService.list(),
        sociosService.list(),
        staff ? profesoresService.list() : Promise.resolve([] as Profesor[]),
        staff ? turnosService.list() : Promise.resolve([] as Turno[]),
        actividadesService.list(),
        clasesService.list(),
        inscripcionesService.list(),
        role === 'profesor' ? Promise.resolve([] as Cuota[]) : cuotasService.list(),
      ]);
      // Los ids del backend no coinciden con los del seed local: no se mezclan datos.
      // Máquinas y materiales no tienen backend todavía: en modo conectado quedan vacíos.
      set({ planes, socios, profesores, turnos, actividades, clases, inscripciones, cuotas, maquinas: [], materiales: [], loading: false });
      return {};
    } catch (error) {
      set({ loading: false });
      return { error: apiErrorMessage(error, 'No pudimos cargar los datos.') };
    }
  },

  save: async (key, draft) => {
    const remote = API_ENABLED ? remotes[key] : undefined;
    const { id, ...rest } = draft as Draft<CollectionKey> & Record<string, unknown>;
    let saved = { ...rest, id: id ?? nextId(get()[key] as { id: number }[]) } as Item<typeof key>;
    if (remote) {
      try {
        saved = (id
          ? await remote.update(id, rest as never)
          : await remote.create(rest as never)) as Item<typeof key>;
      } catch (error) {
        return { error: apiErrorMessage(error) };
      }
    }
    set((state) => {
      const list = state[key] as { id: number }[];
      const exists = list.some((i) => i.id === saved.id);
      const next = exists ? list.map((i) => (i.id === saved.id ? saved : i)) : [...list, saved];
      return { [key]: next } as unknown as Partial<DataState>;
    });
    return {};
  },

  remove: async (key, id) => {
    const blocked = blockers(get(), key, id);
    if (blocked) return { error: blocked };
    const remote = API_ENABLED ? remotes[key] : undefined;
    if (remote) {
      try {
        await remote.remove(id);
      } catch (error) {
        return { error: apiErrorMessage(error) };
      }
    }
    set((state) => ({
      [key]: (state[key] as { id: number }[]).filter((i) => i.id !== id),
    }) as unknown as Partial<DataState>);
    return {};
  },

  reservar: async (socioId, claseId) => {
    const state = get();
    const socio = state.socios.find((s) => s.id === socioId);
    const clase = state.clases.find((c) => c.id === claseId);
    if (!socio || !clase) return { error: 'No encontramos la clase.' };
    const plan = state.planes.find((p) => p.id === socio.idPlan);
    const actividad = state.actividades.find((a) => a.id === clase.idActividad);
    const check = puedeReservar(socio, plan, clase, actividad, state.cuotas, state.inscripciones);
    if (!check.permitido) return { error: check.motivo };
    // Modo conectado: el backend vuelve a validar todas las reglas y es la fuente de verdad.
    if (API_ENABLED) {
      return conectado(() => inscripcionesService.reservar(socioId, claseId, claseFecha(clase.dia)));
    }
    const inscripcion: Inscripcion = {
      id: nextId(state.inscripciones),
      idSocio: socioId,
      idClase: claseId,
      fechaClase: claseFecha(clase.dia),
      estado: 'Confirmada',
      asistio: false,
    };
    const cuotas = [...state.cuotas];
    if (check.adicional > 0) {
      const id = nextId(cuotas);
      cuotas.push({
        id,
        nroComprobante: `#ADIC-2026-${id}`,
        idSocio: socioId,
        periodo: PERIODO_ACTUAL,
        valor: adicionalPorClase(plan),
        fechaVencimiento: '2026-10-31',
        fechaPago: null,
        metodoPago: null,
      });
    }
    set({ inscripciones: [...state.inscripciones, inscripcion], cuotas });
    return { adicional: check.adicional };
  },

  cancelarReserva: async (inscripcionId) => {
    if (API_ENABLED) return conectado(() => inscripcionesService.cancelar(inscripcionId));
    set((state) => ({
      inscripciones: state.inscripciones.map((i) => (i.id === inscripcionId ? { ...i, estado: 'Cancelada' } : i)),
    }));
    return {};
  },

  marcarAsistencia: async (inscripcionId, asistio) => {
    if (API_ENABLED) {
      try {
        await inscripcionesService.asistencia(inscripcionId, asistio);
      } catch (error) {
        return { error: apiErrorMessage(error) };
      }
    }
    set((state) => ({
      inscripciones: state.inscripciones.map((i) => (i.id === inscripcionId ? { ...i, asistio } : i)),
    }));
    return {};
  },

  eliminarInscripcion: async (inscripcionId) => {
    if (API_ENABLED) return conectado(() => inscripcionesService.remove(inscripcionId));
    set((state) => ({ inscripciones: state.inscripciones.filter((i) => i.id !== inscripcionId) }));
    return {};
  },

  pagarCuota: async (cuota, metodo) => {
    if (API_ENABLED) {
      try {
        const cobrada = await cuotasService.registrarCobro(cuota.idSocio, cuota.periodo);
        set((state) => ({ cuotas: [cobrada, ...state.cuotas] }));
        return {};
      } catch (error) {
        return { error: apiErrorMessage(error) };
      }
    }
    set((state) => ({
      cuotas: state.cuotas.map((c) => (c.id === cuota.id ? { ...c, fechaPago: TODAY, metodoPago: metodo } : c)),
    }));
    return {};
  },

  generarCuotas: () => {
    const state = get();
    const nuevas: Cuota[] = [];
    state.socios
      .filter((s) => !s.fechaBaja && s.idPlan)
      .forEach((s) => {
        const existe = state.cuotas.some((c) => c.idSocio === s.id && c.periodo === '2026-11');
        const plan = state.planes.find((p) => p.id === s.idPlan);
        if (existe || !plan) return;
        const id = nextId([...state.cuotas, ...nuevas]);
        nuevas.push({
          id,
          nroComprobante: `#INV-2026-${id}`,
          idSocio: s.id,
          periodo: '2026-11',
          valor: plan.precio,
          fechaVencimiento: '2026-11-10',
          fechaPago: null,
          metodoPago: null,
        });
      });
    set({ cuotas: [...state.cuotas, ...nuevas] });
    return nuevas.length;
  },

  setEstadoMaquina: (id, estado) =>
    set((state) => ({ maquinas: state.maquinas.map((m) => (m.id === id ? { ...m, estado } : m)) })),

  addMantenimiento: (maquinaId, data) =>
    set((state) => ({
      maquinas: state.maquinas.map((m) => {
        if (m.id !== maquinaId) return m;
        const id = nextId(m.mantenimientos);
        return {
          ...m,
          estado: data.tipo === 'Correctivo' ? 'out' : 'mant',
          mantenimientos: [{ ...data, id, fechaFinReal: null }, ...m.mantenimientos],
        };
      }),
    })),

  cerrarMantenimiento: (maquinaId, mantenimientoId) =>
    set((state) => ({
      maquinas: state.maquinas.map((m) =>
        m.id !== maquinaId
          ? m
          : {
              ...m,
              estado: 'ok',
              mantenimientos: m.mantenimientos.map((x) =>
                x.id === mantenimientoId ? { ...x, fechaFinReal: TODAY } : x,
              ),
            },
      ),
    })),
}));

export { clasesDelPeriodo };
