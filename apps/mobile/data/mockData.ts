// Datos ficticios de las partes de la app que aún no están conectadas a la API
// (comunidad/chat y administración). Autenticación, grupos, diagnóstico y tests semanales
// ya usan la API real (ver lib/api.ts y store/useAppStore.ts).

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
