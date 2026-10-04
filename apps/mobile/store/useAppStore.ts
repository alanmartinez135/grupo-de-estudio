import { create } from "zustand";
import type { EnglishLevel, Jornada, User } from "@grupo-estudio/types";
import { api, errorMessage } from "@/lib/api";

import {
  AdminTestDefinition,
  ChatMessage,
  CURRENT_USER_ID,
  DiagnosticResult,
  Language,
  MockUser,
  Role,
  StudyGroupUI,
  Theme,
  WeeklyTest,
  mockAdminTests,
  mockChats,
  mockDiagnosticResult,
  mockFriends,
  mockUsers,
  mockWeeklyTests,
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

  // --- diagnóstico ---
  diagnosticCompleted: boolean;
  diagnosticResult: DiagnosticResult;
  submitDiagnosticTest: () => void;

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

  
  // --- tests semanales ---
  weeklyTests: WeeklyTest[];
  completeWeeklyTest: (testId: string) => void;

  // --- chat ---
  friends: typeof mockFriends;
  chats: Record<string, ChatMessage[]>;
  sendMessage: (friendId: string, text: string) => void;
  addFriend: (name: string) => void;

  // --- admin ---
  adminTests: AdminTestDefinition[];
  addAdminTest: (test: Omit<AdminTestDefinition, "id">) => void;
  removeAdminTest: (id: string) => void;
  updateUserRole: (userId: string, role: Role) => void;
  removeUser: (userId: string) => void;
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
      return { ok: true, message: "Bienvenido/a de vuelta." };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },
  register: async (data) => {
    try {
      const user = await api.auth.register(data);
      set({ authUser: toAuthUser(user), activeRole: user.role });
      return { ok: true, message: "Cuenta creada correctamente." };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },
  logout: async () => {
    await api.auth.logout();
    set({ authUser: null, activeRole: "student", groups: [] });
  },
  deleteAccount: async () => {
    try {
      await api.users.deleteMe();
      await api.auth.logout();
      set({ authUser: null, activeRole: "student", groups: [] });
      return { ok: true, message: "Tu cuenta fue eliminada." };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },
  resetRequested: null,
  requestPasswordReset: (correo) => {
    const found = get().users.find((u) => u.correo.toLowerCase() === correo.trim().toLowerCase());
    if (!found) return { ok: false, message: "No encontramos una cuenta con ese correo." };
    set({ resetRequested: correo });
    return { ok: true, message: "Te hemos enviado un correo para restablecer tu contraseña." };
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
  toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
  language: "es",
  setLanguage: (language) => set({ language }),

  diagnosticCompleted: false,
  diagnosticResult: mockDiagnosticResult,
  submitDiagnosticTest: () => set({ diagnosticCompleted: true }),

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
      return { ok: true, message: "Grupo creado.", group };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },
  joinGroup: async (code) => {
    try {
      const group = await api.groups.joinByCode(code);
      set((s) => ({ groups: upsertGroup(s.groups, group) }));
      return { ok: true, message: `Te uniste a ${group.name}.` };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },
  joinGroupById: async (groupId) => {
    try {
      const group = await api.groups.join(groupId);
      set((s) => ({ groups: upsertGroup(s.groups, group) }));
      return { ok: true, message: `Te uniste a ${group.name}.` };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },
  leaveGroup: async (groupId) => {
    try {
      await api.groups.leave(groupId);
      await get().loadGroups(); // el servidor puede haber eliminado el grupo si quedó vacío
      return { ok: true, message: "Saliste del grupo." };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },

  weeklyTests: mockWeeklyTests,
  completeWeeklyTest: (testId) =>
    set((s) => ({
      weeklyTests: s.weeklyTests.map((t) => (t.id === testId ? { ...t, status: "completed" } : t)),
    })),

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

  adminTests: mockAdminTests,
  addAdminTest: (test) =>
    set((s) => ({ adminTests: [{ ...test, id: `at-${Date.now()}` }, ...s.adminTests] })),
  removeAdminTest: (id) => set((s) => ({ adminTests: s.adminTests.filter((t) => t.id !== id) })),
  updateUserRole: (userId, role) =>
    set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, role } : u)) })),
  removeUser: (userId) => set((s) => ({ users: s.users.filter((u) => u.id !== userId) })),
}));

// Si el servidor rechaza la sesión y no se puede renovar, se vuelve al login.
api.setOnSessionExpired(() => useAppStore.setState({ authUser: null, activeRole: "student", groups: [] }));
