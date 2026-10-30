import type { Profesor } from '../models';
import { dateOnly } from '../lib/format';
import { httpClient } from './httpClient';
import { personaToDto, type PersonaDto } from './socios.service';
import { turnosService } from './turnos.service';

interface ProfesorDto {
  idPersona: number;
  cargo: string;
  persona: PersonaDto;
  turnos: { idTurno: number }[];
}

type ProfesorInput = Omit<Profesor, 'id'>;

/** El sueldo todavía no existe en el backend (HistoricoSueldo): se conserva lo local. */
const fromDto = (dto: ProfesorDto, local?: Partial<Profesor>): Profesor => ({
  id: dto.idPersona,
  dni: dto.persona.dni,
  nombre: dto.persona.nombre,
  apellido: dto.persona.apellido,
  telefono: dto.persona.telefono,
  fechaNac: dateOnly(dto.persona.fechaNac),
  cargo: dto.cargo,
  turnos: dto.turnos.map((t) => t.idTurno),
  sueldos: local?.sueldos ?? [],
});

const toDto = (profesor: ProfesorInput) => ({ ...personaToDto(profesor), cargo: profesor.cargo });

/** Asigna y desasigna turnos hasta que el profesor quede con los indicados. */
const sincronizarTurnos = async (idProfesor: number, actuales: number[], deseados: number[]) => {
  await Promise.all([
    ...deseados.filter((t) => !actuales.includes(t)).map((t) => turnosService.asignarProfesor(t, idProfesor)),
    ...actuales.filter((t) => !deseados.includes(t)).map((t) => turnosService.desasignarProfesor(t, idProfesor)),
  ]);
  return deseados;
};

export const profesoresService = {
  list: async () => (await httpClient.get<ProfesorDto[]>('/profesores')).data.map((dto) => fromDto(dto)),
  create: async (profesor: ProfesorInput) => {
    const creado = fromDto((await httpClient.post<ProfesorDto>('/profesores', toDto(profesor))).data, profesor);
    return { ...creado, turnos: await sincronizarTurnos(creado.id, [], profesor.turnos) };
  },
  update: async (id: number, profesor: ProfesorInput) => {
    const actualizado = fromDto((await httpClient.patch<ProfesorDto>(`/profesores/${id}`, toDto(profesor))).data, profesor);
    return { ...actualizado, turnos: await sincronizarTurnos(id, actualizado.turnos, profesor.turnos) };
  },
  remove: async (id: number) => {
    await httpClient.delete(`/profesores/${id}`);
  },
};
