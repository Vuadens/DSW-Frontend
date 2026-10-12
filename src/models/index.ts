export type Role = 'admin' | 'profesor' | 'socio';

export type Tone = 'orange' | 'green' | 'purple' | 'blue' | 'yellow' | 'red';

export type TipoPlan = 'PREMIUM' | 'PRO' | 'ESTANDAR';

export interface Plan {
  id: number;
  nombre: string;
  tipo: TipoPlan;
  precio: number;
  descripcion: string;
  /** Vacío = sin límite de clases por período. */
  clasesPorPeriodo: number | null;
}

export interface Socio {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  direccion: string;
  fechaNac: string;
  fechaAlta: string;
  fechaBaja: string;
  idPlan: number | null;
}

export interface SueldoHistorico {
  desde: string;
  valor: number;
}

export interface Profesor {
  id: number;
  nombre: string;
  apellido: string;
  cargo: string;
  email: string;
  telefono: string;
  idTurno: number | null;
  idSupervisor: number | null;
  sueldos: SueldoHistorico[];
}

export interface Administrador {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
}

export interface Turno {
  id: number;
  nombre: string;
  desde: string;
  hasta: string;
}

export interface Material {
  id: number;
  descripcion: string;
  stock: number;
}

export type TipoActividad = 'Clase' | 'Musculación';

export interface Actividad {
  id: number;
  nombre: string;
  tipo: TipoActividad;
  descripcion: string;
  planes: number[];
  materiales: number[];
  maquinas: number[];
  profesores: number[];
}

export type DiaSemana = 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie' | 'Sáb' | 'Dom';

/** Dictado de clase: una actividad que se repite cada semana. */
export interface Clase {
  id: number;
  idActividad: number;
  dia: DiaSemana;
  desde: string;
  hasta: string;
  cupo: number;
  idProfesor: number;
  /** Ocupación que no proviene de inscripciones cargadas en la app (solo demo). */
  ocupadosBase: number;
}

export type EstadoInscripcion = 'Confirmada' | 'Cancelada';

export interface Inscripcion {
  id: number;
  idSocio: number;
  idClase: number;
  fechaClase: string;
  estado: EstadoInscripcion;
  asistio: boolean;
}

export type MetodoPago = 'Efectivo' | 'Transferencia' | 'Mercado Pago';

export interface Cuota {
  id: number;
  nroComprobante: string;
  idSocio: number;
  periodo: string;
  valor: number;
  fechaVencimiento: string;
  fechaPago: string | null;
  metodoPago: MetodoPago | null;
}

export type EstadoCuota = 'pagada' | 'pendiente' | 'vencida';

export type EstadoMaquina = 'ok' | 'mant' | 'out';

export type TipoMantenimiento = 'Preventivo' | 'Correctivo';

export interface Mantenimiento {
  id: number;
  tipo: TipoMantenimiento;
  fechaInicio: string;
  fechaFinEsperada: string;
  fechaFinReal: string | null;
  descripcion: string;
}

export interface Maquina {
  id: number;
  nombre: string;
  tipo: string;
  ubicacion: string;
  descripcion: string;
  estado: EstadoMaquina;
  mantenimientos: Mantenimiento[];
}
