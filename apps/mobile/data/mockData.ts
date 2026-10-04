// Datos ficticios centrales que alimentan todas las vistas del prototipo.
// No hay backend ni API real: todo vive en memoria (ver store/useAppStore.ts).

import type { EnglishLevel, Jornada } from "@grupo-estudio/types";

export type Role = "student" | "admin";
export type Skill = "reading" | "writing";
export type Theme = "light" | "dark";
export type Language = "es" | "en";

export interface MockUser {
  id: string;
  correo: string;
  password: string; // solo para el mock de login, nunca en un backend real
  name: string;
  career: string;
  jornada: Jornada;
  englishLevel: EnglishLevel;
  role: Role;
  avatarColor: string; // color de respaldo para el avatar con iniciales
}

export interface CompetencyScore {
  name: string;
  skill: Skill;
  score: number; // 0-100
}

export interface DiagnosticResult {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  competencies: CompetencyScore[];
  recommendations: string[];
  completedAt: string;
}

export interface TestQuestion {
  id: string;
  skill: Skill;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface WeeklyTest {
  id: string;
  groupId: string;
  title: string;
  skill: Skill;
  dueDate: string;
  status: "pending" | "completed";
  questions: TestQuestion[];
}

export interface StudyGroupUI {
  id: string;
  name: string;
  description: string;
  code: string;
  level: EnglishLevel;
  createdBy: string | null;
  memberIds: string[];
  // Integrantes con nombre y carrera; los entrega la API (los grupos simulados no los traen).
  members?: { id: string; name: string; career: string }[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  sentAt: string;
}

export interface Friend {
  id: string;
  name: string;
  career: string;
  online: boolean;
  avatarColor: string;
}

export const CURRENT_USER_ID = "u-1";
export const MAX_GROUP_MEMBERS = 6;

export const mockUsers: MockUser[] = [
  { id: "u-1", correo: "javiera.acuna@duocuc.cl", password: "duoc2024", name: "Javiera Acuña", career: "Desarrollo de Software", jornada: "diurna", englishLevel: "B1", role: "student", avatarColor: "#0B2A4A" },
  { id: "u-2", correo: "sebastian.navarro@duocuc.cl", password: "duoc2024", name: "Sebastián Navarro", career: "Desarrollo de Software", jornada: "diurna", englishLevel: "B2", role: "student", avatarColor: "#2E5B8A" },
  { id: "u-3", correo: "victoria.roa@duocuc.cl", password: "duoc2024", name: "Victoria Roa", career: "Administración de Redes", jornada: "vespertina", englishLevel: "A2", role: "student", avatarColor: "#E6AD10" },
  { id: "u-4", correo: "eduardo.guzman@duocuc.cl", password: "duoc2024", name: "Eduardo Guzmán", career: "Desarrollo de Software", jornada: "diurna", englishLevel: "B1", role: "student", avatarColor: "#5B6B85" },
  { id: "u-5", correo: "admin@duocuc.cl", password: "admin2024", name: "Consuelo Prieto", career: "Coordinación Académica", jornada: "diurna", englishLevel: "C1", role: "admin", avatarColor: "#0F3A63" },
];

export const mockFriends: Friend[] = [
  { id: "u-2", name: "Sebastián Navarro", career: "Desarrollo de Software", online: true, avatarColor: "#2E5B8A" },
  { id: "u-3", name: "Victoria Roa", career: "Administración de Redes", online: false, avatarColor: "#E6AD10" },
  { id: "u-4", name: "Eduardo Guzmán", career: "Desarrollo de Software", online: true, avatarColor: "#5B6B85" },
];

export const mockChats: Record<string, ChatMessage[]> = {
  "u-2": [
    { id: "m-1", senderId: "u-2", text: "¿Vamos a repasar el test semanal antes del viernes?", sentAt: "09:12" },
    { id: "m-2", senderId: CURRENT_USER_ID, text: "Sí, ¿a las 18:00 te acomoda?", sentAt: "09:14" },
    { id: "m-3", senderId: "u-2", text: "Perfecto, nos vemos en el grupo de estudio.", sentAt: "09:15" },
  ],
  "u-4": [
    { id: "m-4", senderId: "u-4", text: "Subí el resumen de reading comprehension al grupo.", sentAt: "ayer" },
  ],
};

export const mockGroups: StudyGroupUI[] = [
  {
    id: "g-1",
    name: "English Warriors DUOC",
    description: "Grupo de apoyo para nivel B1-B2, enfocado en writing académico.",
    code: "DUOC-7821",
    level: "B1",
    createdBy: "u-1",
    memberIds: ["u-1", "u-2", "u-4"],
  },
  {
    id: "g-2",
    name: "Reading Club Vespertino",
    description: "Practicamos comprensión lectora dos veces por semana.",
    code: "DUOC-4410",
    level: "A2",
    createdBy: "u-3",
    memberIds: ["u-1", "u-3"],
  },
];

const readingQuestions: TestQuestion[] = [
  { id: "q-r1", skill: "reading", prompt: "\"The workshop was postponed due to unforeseen circumstances.\" ¿Qué significa 'postponed'?", options: ["Cancelado", "Pospuesto", "Confirmado", "Reducido"], correctIndex: 1 },
  { id: "q-r2", skill: "reading", prompt: "Según el texto, el autor principalmente busca...", options: ["Entretener", "Informar", "Persuadir", "Narrar"], correctIndex: 1 },
  { id: "q-r3", skill: "reading", prompt: "El sinónimo más cercano a 'crucial' es:", options: ["Opcional", "Irrelevante", "Esencial", "Tardío"], correctIndex: 2 },
];

const writingQuestions: TestQuestion[] = [
  { id: "q-w1", skill: "writing", prompt: "Selecciona la oración gramaticalmente correcta:", options: ["She don't like coffee.", "She doesn't likes coffee.", "She doesn't like coffee.", "She not like coffee."], correctIndex: 2 },
  { id: "q-w2", skill: "writing", prompt: "Completa: \"If I ___ more time, I would travel more.\"", options: ["have", "had", "has", "having"], correctIndex: 1 },
  { id: "q-w3", skill: "writing", prompt: "¿Cuál conector es más adecuado para contrastar dos ideas?", options: ["Furthermore", "However", "Similarly", "Therefore"], correctIndex: 1 },
];

export const diagnosticTestQuestions: TestQuestion[] = [...readingQuestions, ...writingQuestions];

export const mockDiagnosticResult: DiagnosticResult = {
  overallScore: 74,
  strengths: ["Comprensión lectora general", "Vocabulario académico"],
  weaknesses: ["Uso de conectores en writing", "Tiempos condicionales"],
  competencies: [
    { name: "Reading Comprehension", skill: "reading", score: 82 },
    { name: "Vocabulario", skill: "reading", score: 78 },
    { name: "Gramática", skill: "writing", score: 65 },
    { name: "Escritura académica", skill: "writing", score: 68 },
  ],
  recommendations: [
    "Practica conectores de contraste (however, although, despite) con ejercicios cortos de writing.",
    "Refuerza tiempos condicionales con el test semanal 'Conditionals I' del grupo.",
    "Mantén la lectura diaria de artículos cortos en inglés para consolidar el vocabulario.",
  ],
  completedAt: "2026-08-14",
};

export const mockWeeklyTests: WeeklyTest[] = [
  { id: "wt-1", groupId: "g-1", title: "Conditionals I", skill: "writing", dueDate: "2026-09-26", status: "pending", questions: writingQuestions },
  { id: "wt-2", groupId: "g-1", title: "Skimming & Scanning", skill: "reading", dueDate: "2026-09-20", status: "completed", questions: readingQuestions },
  { id: "wt-3", groupId: "g-2", title: "Everyday Vocabulary", skill: "reading", dueDate: "2026-09-24", status: "pending", questions: readingQuestions },
];

export interface AdminTestDefinition {
  id: string;
  title: string;
  type: "inicial" | "semanal";
  skill: Skill;
  questionCount: number;
  status: "publicado" | "borrador";
}

export const mockAdminTests: AdminTestDefinition[] = [
  { id: "at-1", title: "Evaluación Diagnóstica General", type: "inicial", skill: "reading", questionCount: 6, status: "publicado" },
  { id: "at-2", title: "Conditionals I", type: "semanal", skill: "writing", questionCount: 3, status: "publicado" },
  { id: "at-3", title: "Skimming & Scanning", type: "semanal", skill: "reading", questionCount: 3, status: "publicado" },
  { id: "at-4", title: "Phrasal Verbs básicos", type: "semanal", skill: "writing", questionCount: 5, status: "borrador" },
];
