import type { Attendance, CreateMeetingInput, GroupMember, Meeting, MeetingMode } from "@grupo-estudio/types";
import type { Db } from "../db/pool";
import { AppError } from "../errors";

interface MeetingRow {
  id: string;
  grupo_id: string;
  grupo_nombre: string;
  tema: string;
  inicio: Date;
  duracion_min: number;
  modalidad: MeetingMode;
  lugar: string;
  creado_por: string | null;
  asistentes: GroupMember[];
  mi_respuesta: Attendance | null;
}

export const encuentroNoExiste = () => new AppError(404, "ENCUENTRO_NO_EXISTE", "El encuentro no existe.");
export const noEsIntegrante = () =>
  new AppError(403, "NO_ES_INTEGRANTE", "Solo los integrantes del grupo pueden ver y coordinar sus encuentros.");

// Encuentros con quienes confirmaron asistencia y la respuesta del usuario actual ($1).
const SELECT_MEETINGS = `
  SELECT e.id, e.grupo_id, g.nombre AS grupo_nombre, e.tema, e.inicio, e.duracion_min,
         e.modalidad, e.lugar, e.creado_por,
         COALESCE(
           (SELECT json_agg(json_build_object('id', u.id, 'name', u.nombre, 'career', u.carrera) ORDER BY u.nombre)
              FROM asistencias a JOIN usuarios u ON u.id = a.usuario_id
             WHERE a.encuentro_id = e.id AND a.respuesta = 'yes'),
           '[]'
         ) AS asistentes,
         (SELECT a.respuesta FROM asistencias a WHERE a.encuentro_id = e.id AND a.usuario_id = $1) AS mi_respuesta
    FROM encuentros e
    JOIN grupos g ON g.id = e.grupo_id`;

function toMeeting(r: MeetingRow): Meeting {
  return {
    id: r.id,
    groupId: r.grupo_id,
    groupName: r.grupo_nombre,
    topic: r.tema,
    startsAt: r.inicio.toISOString(),
    durationMinutes: r.duracion_min,
    mode: r.modalidad,
    location: r.lugar,
    createdBy: r.creado_por,
    attendees: r.asistentes,
    myResponse: r.mi_respuesta,
  };
}

export async function isMember(db: Db, groupId: string, userId: string): Promise<boolean> {
  const { rowCount } = await db.query("SELECT 1 FROM grupo_integrantes WHERE grupo_id = $1 AND usuario_id = $2", [groupId, userId]);
  return (rowCount ?? 0) > 0;
}

export async function groupExists(db: Db, groupId: string): Promise<boolean> {
  const { rowCount } = await db.query("SELECT 1 FROM grupos WHERE id = $1", [groupId]);
  return (rowCount ?? 0) > 0;
}

// Encuentros que aún no terminan (se muestran hasta que pasa su duración), del más próximo al más lejano.
export async function listGroupMeetings(db: Db, groupId: string, userId: string): Promise<Meeting[]> {
  const { rows } = await db.query<MeetingRow>(
    `${SELECT_MEETINGS}
      WHERE e.grupo_id = $2 AND e.inicio + make_interval(mins => e.duracion_min) > now()
      ORDER BY e.inicio`,
    [userId, groupId],
  );
  return rows.map(toMeeting);
}

// Próximos encuentros de todos los grupos del estudiante (para el inicio).
export async function listUpcomingForUser(db: Db, userId: string, limit = 5): Promise<Meeting[]> {
  const { rows } = await db.query<MeetingRow>(
    `${SELECT_MEETINGS}
      JOIN grupo_integrantes gi ON gi.grupo_id = e.grupo_id AND gi.usuario_id = $1
      WHERE e.inicio + make_interval(mins => e.duracion_min) > now()
      ORDER BY e.inicio
      LIMIT $2`,
    [userId, limit],
  );
  return rows.map(toMeeting);
}

export async function findMeeting(db: Db, meetingId: string, userId: string): Promise<Meeting | null> {
  const { rows } = await db.query<MeetingRow>(`${SELECT_MEETINGS} WHERE e.id = $2`, [userId, meetingId]);
  return rows[0] ? toMeeting(rows[0]) : null;
}

// Quien propone el encuentro queda confirmado como asistente.
export async function createMeeting(db: Db, groupId: string, userId: string, input: CreateMeetingInput): Promise<Meeting> {
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO encuentros (grupo_id, tema, inicio, duracion_min, modalidad, lugar, creado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [groupId, input.topic, input.startsAt, input.durationMinutes, input.mode, input.location, userId],
  );
  const id = rows[0]!.id;
  await setAttendance(db, id, userId, "yes");
  return (await findMeeting(db, id, userId))!;
}

export async function setAttendance(db: Db, meetingId: string, userId: string, response: Attendance): Promise<void> {
  await db.query(
    `INSERT INTO asistencias (encuentro_id, usuario_id, respuesta) VALUES ($1, $2, $3)
     ON CONFLICT (encuentro_id, usuario_id) DO UPDATE SET respuesta = EXCLUDED.respuesta`,
    [meetingId, userId, response],
  );
}

export async function deleteMeeting(db: Db, meetingId: string): Promise<void> {
  await db.query("DELETE FROM encuentros WHERE id = $1", [meetingId]);
}
