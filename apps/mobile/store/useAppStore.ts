import { create } from "zustand";
import type {
  DiagnosticResult,
  EnglishLevel,
  Jornada,
  TestResult,
  User,
  WeeklyTestSummary,
} from "@grupo-estudio/types";
import { api, errorMessage } from "@/lib/api";
import { setCurrentLanguage, tr } from "@/lib/i18n";
import { loadPreferences, savePreferences } from "@/lib/preferences";

import {
  ChatMessage,
  CURRENT_USER_ID,
  Language,
  MockUser,
  Role,
  StudyGroupUI,
  Theme,
  mockChats,
  mockFriends,
  mockUsers,
} from "@/data/mockData";

interface AppState {
  // --- auth / sesión ---
  authUser: MockUser | null;
  users: MockUser[];
  // true cuando ya se intentó recuperar la sesión guardada al abrir la app
  sessionChecked: boolean;
  restoreSession: () => Promise<void>;
  login: (correo: string, password: string) => Promise<{ ok: boolean; message: string }>;
  register: (data: {
    correo: string;
    password: string;
    name: string;
    career: string;
    jornada: Jornada;
    englishLevel: EnglishLevel;
  }) => Promise<{ ok: boolean; message: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ ok: boolean; message: string }>;
  resetRequested: string | null;
  requestPasswordReset: (correo: string) => { ok: boolean; message: string };
  resetPassword: (newPassword: string) => void;

  // --- rol activo (independiente del rol "real" del usuario, para el dev toolbar) ---
  activeRole: Role;
  setActiveRole: (role: Role) => void;

  // --- preferencias ---
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  loadPreferences: () => Promise<void>;

  // --- diagnóstico (API: /api/v1/diagnostico) ---
  diagnosticCompleted: boolean;
  diagnosticResult: DiagnosticResult | null;
  loadDiagnostic: () => Promise<void>;
  submitDiagnosticTest: (answers: Record<string, number>) => Promise<{ ok: boolean; message: string }>;

  // --- grupos de estudio ---
  groups: StudyGroupUI[];
  loadGroups: () => Promise<{ ok: boolean; message: string }>;
  createGroup: (
    name: string,
    description: string,
    level: EnglishLevel,
  ) => Promise<{ ok: boolean; message: string; group?: StudyGroupUI }>;
  joinGroup: (code: string) => Promise<{ ok: boolean; message: string }>;
  joinGroupById: (groupId: string) => Promise<{ ok: boolean; message: string }>;
  leaveGroup: (groupId: string) => Promise<{ ok: boolean; message: string }>;

  
  // --- tests semanales (API: /api/v1/tests) ---
  weeklyTests: WeeklyTestSummary[];
  loadWeeklyTests: () => Promise<void>;
  submitWeeklyTest: (
    testId: string,
    answers: Record<string, number>,
  ) => Promise<{ ok: boolean; message: string; result?: TestResult }>;

  // --- chat ---
  friends: typeof mockFriends;
  chats: Record<string, ChatMessage[]>;
  sendMessage: (friendId: string, text: string) => void;
  addFriend: (name: string) => void;

  // La gestión de usuarios y evaluaciones del administrador usa el API directamente
  // desde sus pantallas (app/(admin)); no necesita estado global.
}

// El API entrega el usuario sin contraseña ni color de avatar; mientras el resto de la
// app siga usando el tipo del prototipo (MockUser), se completa con valores neutros.
// Reemplaza el grupo actualizado (o lo agrega al inicio si es nuevo).
function upsertGroup(groups: StudyGroupUI[], group: StudyGroupUI): StudyGroupUI[] {
  return groups.some((g) => g.id === group.id)
    ? groups.map((g) => (g.id === group.id ? group : g))
    : [group, ...groups];
}

function toAuthUser(user: User): MockUser {
  return { ...user, password: "", avatarColor: "#2E5B8A" };
}

export const useAppStore = create<AppState>((set, get) => ({
  authUser: null,
  users: mockUsers,
  // --- autenticación contra el API (apps/api) ---
  sessionChecked: false,
  restoreSession: async () => {
    try {
      const user = await api.auth.restoreSession();
      if (user) set({ authUser: toAuthUser(user), activeRole: user.role });
    } catch {
      // Si la sesión guardada no sirve, simplemente se pide iniciar sesión.
    } finally {
      set({ sessionChecked: true });
    }
  },
  login: async (correo, password) => {
    try {
      const user = await api.auth.login({ correo, password });
      set({ authUser: toAuthUser(user), activeRole: user.role });
      return { ok: true, message: "" };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },
  register: async (data) => {
    try {
      const user = await api.auth.register(data);
      set({ authUser: toAuthUser(user), activeRole: user.role });
      return { ok: true, message: "" };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },
  logout: async () => {
    await api.auth.logout();
    set({ authUser: null, activeRole: "student", groups: [], weeklyTests: [], diagnosticResult: null, diagnosticCompleted: false });
  },
  deleteAccount: async () => {
    try {
      await api.users.deleteMe();
      await api.auth.logout();
      set({ authUser: null, activeRole: "student", groups: [], weeklyTests: [], diagnosticResult: null, diagnosticCompleted: false });
      return { ok: true, message: "" };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },
  resetRequested: null,
  requestPasswordReset: (correo) => {
    const found = get().users.find((u) => u.correo.toLowerCase() === correo.trim().toLowerCase());
    if (!found) return { ok: false, message: tr("forgot.notFound") };
    set({ resetRequested: correo });
    return { ok: true, message: tr("forgot.sentBody") };
  },
  resetPassword: (newPassword) => {
    const correo = get().resetRequested;
    if (!correo) return;
    set((s) => ({
      users: s.users.map((u) => (u.correo === correo ? { ...u, password: newPassword } : u)),
      resetRequested: null,
    }));
  },

  activeRole: "student",
  setActiveRole: (role) => set({ activeRole: role }),

  theme: "light",
  toggleTheme: () => {
    const theme = get().theme === "light" ? "dark" : "light";
    set({ theme });
    savePreferences({ theme, language: get().language });
  },
  language: "es",
  setLanguage: (language) => {
    setCurrentLanguage(language);
    set({ language });
    savePreferences({ language, theme: get().theme });
  },
  loadPreferences: async () => {
    const prefs = await loadPreferences();
    if (prefs.language) setCurrentLanguage(prefs.language);
    set((s) => ({ language: prefs.language ?? s.language, theme: prefs.theme ?? s.theme }));
  },

  diagnosticCompleted: false,
  diagnosticResult: null,
  loadDiagnostic: async () => {
    try {
      const result = await api.diagnostic.result();
      set({ diagnosticResult: result, diagnosticCompleted: result !== null });
    } catch {
      // Sin conexión: se mantiene lo que había.
    }
  },
  submitDiagnosticTest: async (answers) => {
    try {
      const { result, user } = await api.diagnostic.submit(answers);
      // El servidor asigna el nivel según el resultado; se actualiza el usuario de la sesión.
      set((s) => ({
        diagnosticResult: result,
        diagnosticCompleted: true,
        authUser: s.authUser ? { ...s.authUser, englishLevel: user.englishLevel } : s.authUser,
      }));
      return { ok: true, message: "" };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },

  // --- grupos de estudio (API: /api/v1/grupos) ---
  groups: [],
  loadGroups: async () => {
    try {
      set({ groups: await api.groups.list() });
      return { ok: true, message: "" };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },
  createGroup: async (name, description, level) => {
    try {
      const group = await api.groups.create({ name, description, level });
      set((s) => ({ groups: [group, ...s.groups.filter((g) => g.id !== group.id)] }));
      get().loadWeeklyTests();
      return { ok: true, message: tr("groups.created"), group };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },
  joinGroup: async (code) => {
    try {
      const group = await api.groups.joinByCode(code);
      set((s) => ({ groups: upsertGroup(s.groups, group) }));
      get().loadWeeklyTests();
      return { ok: true, message: tr("groups.joined", { name: group.name }) };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },
  joinGroupById: async (groupId) => {
    try {
      const group = await api.groups.join(groupId);
      set((s) => ({ groups: upsertGroup(s.groups, group) }));
      get().loadWeeklyTests();
      return { ok: true, message: tr("groups.joined", { name: group.name }) };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },
  leaveGroup: async (groupId) => {
    try {
      await api.groups.leave(groupId);
      await get().loadGroups(); // el servidor puede haber eliminado el grupo si quedó vacío
      get().loadWeeklyTests();
      return { ok: true, message: tr("groups.left") };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },

  weeklyTests: [],
  loadWeeklyTests: async () => {
    try {
      set({ weeklyTests: await api.tests.list() });
    } catch {
      // Sin conexión: se mantiene la lista anterior.
    }
  },
  submitWeeklyTest: async (testId, answers) => {
    try {
      const result = await api.tests.submit(testId, answers);
      await get().loadWeeklyTests();
      return { ok: true, message: "", result };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },

  friends: mockFriends,
  chats: mockChats,
  sendMessage: (friendId, text) => {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: get().authUser?.id ?? CURRENT_USER_ID,
      text,
      sentAt: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
    };
    set((s) => ({ chats: { ...s.chats, [friendId]: [...(s.chats[friendId] ?? []), msg] } }));
  },
  addFriend: (name) => {
    const newFriend = {
      id: `f-${Date.now()}`,
      name,
      career: "Desarrollo de Software",
      online: false,
      avatarColor: "#0F3A63",
    };
    set((s) => ({ friends: [...s.friends, newFriend] }));
  },

}));

// Si el servidor rechaza la sesión y no se puede renovar, se vuelve al login.
api.setOnSessionExpired(() =>
  useAppStore.setState({ authUser: null, activeRole: "student", groups: [], weeklyTests: [], diagnosticResult: null, diagnosticCompleted: false }),
);
