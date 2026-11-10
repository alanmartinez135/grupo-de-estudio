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

export const MAX_GROUP_MEMBERS = 6;

export const mockUsers: MockUser[] = [
  { id: "u-1", correo: "javiera.acuna@duocuc.cl", password: "duoc2024", name: "Javiera Acuña", career: "Desarrollo de Software", jornada: "diurna", englishLevel: "B1", role: "student", avatarColor: "#0B2A4A" },
  { id: "u-2", correo: "sebastian.navarro@duocuc.cl", password: "duoc2024", name: "Sebastián Navarro", career: "Desarrollo de Software", jornada: "diurna", englishLevel: "B2", role: "student", avatarColor: "#2E5B8A" },
  { id: "u-3", correo: "victoria.roa@duocuc.cl", password: "duoc2024", name: "Victoria Roa", career: "Administración de Redes", jornada: "vespertina", englishLevel: "A2", role: "student", avatarColor: "#E6AD10" },
  { id: "u-4", correo: "eduardo.guzman@duocuc.cl", password: "duoc2024", name: "Eduardo Guzmán", career: "Desarrollo de Software", jornada: "diurna", englishLevel: "B1", role: "student", avatarColor: "#5B6B85" },
  { id: "u-5", correo: "admin@duocuc.cl", password: "admin2024", name: "Consuelo Prieto", career: "Coordinación Académica", jornada: "diurna", englishLevel: "C1", role: "admin", avatarColor: "#0F3A63" },
];