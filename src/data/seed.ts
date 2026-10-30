import type {
  Actividad,
  Administrador,
  Clase,
  Cuota,
  Inscripcion,
  Maquina,
  Material,
  Plan,
  Profesor,
  Socio,
  Turno,
} from '../models';
import { DIAS } from '../lib/format';

export const INGRESOS_BASE = 7850000;
export const EGRESOS = { docentes: 3450000, reparaciones: 470000 };

export const seedPlanes = (): Plan[] => [
  {
    id: 1,
    nombre: 'Black Pass Total',
    tipo: 'PREMIUM',
    precio: 64000,
    clasesPorPeriodo: 16,
    descripcion: 'Pase total sin límites de horarios, todas las clases, vestuarios premium y toallas.',
  },
  { id: 2, nombre: 'Fit & Clases', tipo: 'PRO', precio: 49000, clasesPorPeriodo: null, descripcion: '' },
  { id: 3, nombre: 'Musculación Libre', tipo: 'ESTANDAR', precio: 36000, clasesPorPeriodo: null, descripcion: '' },
];

const FRANJAS = [
  { nombre: 'Mañana', desde: '07:00', hasta: '13:00' },
  { nombre: 'Tarde', desde: '13:00', hasta: '19:00' },
  { nombre: 'Noche', desde: '19:00', hasta: '23:00' },
] as const;

/** Igual que el backend: mañana, tarde y noche para cada día de la semana. */
export const seedTurnos = (): Turno[] =>
  DIAS.flatMap((dia, d) => FRANJAS.map((franja, f) => ({ id: d * FRANJAS.length + f + 1, dia, ...franja })));

/** Turnos de lunes a viernes de las franjas indicadas (0 mañana, 1 tarde, 2 noche). */
const turnosSemana = (...franjas: number[]) =>
  DIAS.slice(0, 5).flatMap((_, d) => franjas.map((f) => d * FRANJAS.length + f + 1));

export const seedMateriales = (): Material[] => [
  { id: 1, descripcion: 'Kettlebells', stock: 12 },
  { id: 2, descripcion: 'Bandas elásticas', stock: 30 },
  { id: 3, descripcion: 'Colchonetas', stock: 20 },
];

export const seedAdmins = (): Administrador[] => [
  { id: 1, nombre: 'Santiago', apellido: 'Albarracín', email: 'admin@hadesgym.com' },
];

export const seedSocios = (): Socio[] =>
  (
    [
      ['Lucas', 'Fernández', '38450192', 'lucas.fernandez@gmail.com', '2026-01-15', 1],
      ['Camila', 'Vázquez', '40129844', 'camila.vazquez@gmail.com', '2026-03-10', 2],
      ['Ignacio', 'Sosa', '36980112', 'ignacio.sosa@outlook.com', '2025-11-04', 3],
      ['Julieta', 'Méndez', '42880314', 'julieta.mendez@hotmail.com', '2026-02-01', 2],
      ['Esteban', 'Ríos', '35190442', 'esteban.rios@yahoo.com', '2025-08-12', 1],
      ['Agustina', 'López', '39401889', 'agus.lopez@gmail.com', '2026-04-10', 3],
    ] as const
  ).map(([nombre, apellido, dni, email, fechaAlta, idPlan], i) => ({
    id: i + 1,
    nombre,
    apellido,
    dni,
    email,
    telefono: '1100000000',
    fechaNac: '1995-01-01',
    fechaAlta,
    fechaBaja: '',
    idPlan,
  }));

export const seedProfesores = (): Profesor[] =>
  (
    [
      [1, 'Marcos', 'Benítez', '28450111', 'Coordinador y preparador físico', [0], 'marcos.benitez@hadesgym.com', '1145218890', [{ desde: '2026-08-01', valor: 910000 }, { desde: '2026-09-01', valor: 950000 }]],
      [2, 'Sofía', 'Rossi', '33120458', 'Instructora de Spinning y HIIT', [1, 2], 'sofia.rossi@hadesgym.com', '1158741233', [{ desde: '2026-09-01', valor: 780000 }]],
      [3, 'Matías', 'Gómez', '31987220', 'Especialista en Musculación y Fuerza', [1, 2], 'matias.gomez@hadesgym.com', '1163980044', [{ desde: '2026-09-01', valor: 820000 }]],
      [4, 'Valentina', 'Paz', '35004127', 'Instructora de Yoga y Postura', [0], 'valentina.paz@hadesgym.com', '1131097765', [{ desde: '2026-09-01', valor: 720000 }]],
    ] as const
  ).map(([id, nombre, apellido, dni, cargo, franjas, email, telefono, sueldos]) => ({
    id,
    dni,
    nombre,
    apellido,
    cargo,
    turnos: turnosSemana(...franjas),
    email,
    telefono,
    fechaNac: '1990-01-01',
    sueldos: [...sueldos],
  }));

export const seedActividades = (): Actividad[] =>
  (
    [
      [1, 'Cross Functional', 'Clase', [1, 2], [1, 2], [3], [1]],
      [2, 'Cross Functional Matutino', 'Clase', [1, 2], [1, 2], [3], [1]],
      [3, 'Yoga & Flow', 'Clase', [1, 2], [3], [], [4]],
      [4, 'Spinning Pro', 'Clase', [1, 2], [], [4], [2]],
      [5, 'Spinning Sunset', 'Clase', [1, 2], [], [4], [2]],
      [6, 'Musculación', 'Musculación', [1, 3], [], [1, 3, 5, 6], [3]],
    ] as const
  ).map(([id, nombre, tipo, planes, materiales, maquinas, profesores]) => ({
    id,
    nombre,
    tipo,
    descripcion: '',
    cupoMaximo: tipo === 'Musculación' ? 40 : 25,
    planes: [...planes],
    materiales: [...materiales],
    maquinas: [...maquinas],
    profesores: [...profesores],
  }));

export const seedClases = (): Clase[] =>
  (
    [
      [1, 1, 'Lun', '08:00', '09:00', 20, 1, 17],
      [2, 3, 'Mar', '09:00', '10:00', 18, 4, 12],
      [3, 4, 'Mié', '18:30', '19:30', 25, 2, 22],
      [4, 1, 'Jue', '10:00', '11:00', 20, 1, 14],
      [5, 4, 'Vie', '19:00', '20:00', 25, 2, 20],
      [6, 2, 'Dom', '10:00', '11:15', 20, 1, 15],
      [7, 5, 'Dom', '17:30', '18:30', 25, 2, 22],
    ] as const
  ).map(([id, idActividad, dia, desde, hasta, cupo, idProfesor, ocupadosBase]) => ({
    id,
    idActividad,
    dia,
    desde,
    hasta,
    cupo,
    idProfesor,
    ocupadosBase,
  }));

export const seedInscripciones = (): Inscripcion[] => {
  const asistidas: [number, string][] = [
    [1, '2026-09-14'],
    [4, '2026-09-17'],
    [1, '2026-09-21'],
    [4, '2026-09-24'],
    [1, '2026-09-28'],
    [4, '2026-10-01'],
    [1, '2026-10-05'],
  ];
  return [
    { id: 1, idSocio: 1, idClase: 1, fechaClase: '2026-10-12', estado: 'Confirmada', asistio: false },
    ...asistidas.map(([idClase, fechaClase], i) => ({
      id: i + 2,
      idSocio: 1,
      idClase,
      fechaClase,
      estado: 'Confirmada' as const,
      asistio: true,
    })),
  ];
};

export const seedCuotas = (): Cuota[] =>
  (
    [
      [1, 1, '2026-10', 64000, '2026-10-10', '2026-10-02', 'Mercado Pago'],
      [2, 2, '2026-10', 49000, '2026-10-10', '2026-10-05', 'Transferencia'],
      [3, 3, '2026-10', 36000, '2026-10-15', null, null],
      [4, 4, '2026-09', 49000, '2026-09-10', null, null],
      [5, 4, '2026-10', 49000, '2026-10-10', null, null],
      [6, 5, '2026-10', 64000, '2026-10-10', '2026-10-01', 'Efectivo'],
      [7, 6, '2026-10', 36000, '2026-10-10', '2026-10-04', 'Mercado Pago'],
    ] as const
  ).map(([id, idSocio, periodo, valor, fechaVencimiento, fechaPago, metodoPago]) => ({
    id,
    nroComprobante: `#INV-2026-${id}`,
    idSocio,
    periodo,
    valor,
    fechaVencimiento,
    fechaPago,
    metodoPago,
  }));

export const seedMaquinas = (): Maquina[] => {
  type Raw = [number, string, string, string, 'ok' | 'mant' | 'out', [string, string, string, string | null, string][]];
  const raw: Raw[] = [
    [1, 'Prensa 45° Inclinada Pro', 'Musculación', 'Prensa lineal de alta carga con trabas de seguridad duales y soporte para discos olímpicos.', 'ok', [['Preventivo', '2026-07-10', '2026-07-11', '2026-07-11', 'Lubricación de rieles lineales y calibración de seguros mecánicos.']]],
    [2, 'Cinta de Correr Matrix T50 #1', 'Cardio', 'Cinta profesional con motor AC de 4.2HP, amortiguación Cushion Deck y pantalla táctil.', 'ok', [['Preventivo', '2026-08-15', '2026-08-15', '2026-08-15', 'Tensión y centrado de banda de rodamiento, aspirado de motor.']]],
    [3, 'Polea Dual Regulable Cable Crossover', 'Musculación', 'Torre dual con poleas ajustables verticalmente en 18 posiciones y lingotes de 100kg.', 'mant', [['Preventivo', '2026-10-09', '2026-10-13', null, 'Reemplazo programado de cable de acero recubierto desgastado en polea izquierda.']]],
    [4, 'Bicicleta Keiser M3i Indoor #04', 'Cardio', 'Bicicleta magnética con conectividad Bluetooth para sala de spinning.', 'out', [['Correctivo', '2026-10-10', '2026-10-14', null, 'Falla en sensor de potencia y resistencia magnética. Esperando repuesto oficial.']]],
    [5, 'Banco Press Olímpico Plano', 'Peso libre', 'Banco reforzado con soportes de uretano y plataforma de asistencia para spotter.', 'ok', [['Preventivo', '2026-05-20', '2026-05-20', '2026-05-20', 'Retapizado de cuerina de alto impacto y ajuste de bulonería.']]],
    [6, 'Dorsalera / Remo Sentado Combinado', 'Musculación', 'Máquina combinada con rodillos fijadores ajustables para tirón dorsal y remo bajo.', 'ok', []],
  ];
  return raw.map(([id, nombre, tipo, descripcion, estado, mants], i) => ({
    id,
    nombre,
    tipo,
    descripcion,
    estado,
    mantenimientos: mants.map(([t, ini, finEsp, finReal, desc], k) => ({
      id: i * 10 + k + 1,
      tipo: t as 'Preventivo' | 'Correctivo',
      fechaInicio: ini,
      fechaFinEsperada: finEsp,
      fechaFinReal: finReal,
      descripcion: desc,
    })),
  }));
};
