import { create } from "zustand";
import type { EnglishLevel, Jornada, User } from "@grupo-estudio/types";
import { api, errorMessage } from "@/lib/api";
import { MAX_GROUP_MEMBERS } from "@/data/mockData";

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
  mockGroups,
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
  createGroup: (name: string, description: string, level: EnglishLevel) => StudyGroupUI;
  joinGroup: (code: string) => { ok: boolean; message: string };
  joinGroupById: (groupId: string) => { ok: boolean; message: string };
  leaveGroup: (groupId: string) => void;

  
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
    set({ authUser: null, activeRole: "student" });
  },
  deleteAccount: async () => {
    try {
      await api.users.deleteMe();
      await api.auth.logout();
      set({ authUser: null, activeRole: "student" });
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

  groups: mockGroups,
  createGroup: (name, description, level) => {
    const newGroup: StudyGroupUI = {
      id: `g-${Date.now()}`,
      name,
      description,
      code: `DUOC-${Math.floor(1000 + Math.random() * 9000)}`,
      level,
      createdBy: get().authUser?.id ?? CURRENT_USER_ID,
      memberIds: [get().authUser?.id ?? CURRENT_USER_ID],
    };
    set((s) => ({ groups: [newGroup, ...s.groups] }));
    return newGroup;
  },
  joinGroup: (code) => {
    const group = get().groups.find((g) => g.code.toLowerCase() === code.trim().toLowerCase());
    if (!group) return { ok: false, message: "No existe un grupo con ese código." };
    return get().joinGroupById(group.id);
  },
  joinGroupById: (groupId) => {
    const group = get().groups.find((g) => g.id === groupId);
    if (!group) return { ok: false, message: "El grupo no existe." };
    const userId = get().authUser?.id ?? CURRENT_USER_ID;
    if (group.memberIds.includes(userId)) return { ok: false, message: "Ya perteneces a este grupo." };
    if (group.memberIds.length >= MAX_GROUP_MEMBERS) return { ok: false, message: "El grupo está lleno." };
    set((s) => ({
      groups: s.groups.map((g) => (g.id === group.id ? { ...g, memberIds: [...g.memberIds, userId] } : g)),
    }));
    return { ok: true, message: `Te uniste a ${group.name}.` };
  },
  leaveGroup: (groupId) => {
    const userId = get().authUser?.id ?? CURRENT_USER_ID;
    set((s) => ({
      groups: s.groups
        .map((g) => (g.id === groupId ? { ...g, memberIds: g.memberIds.filter((id) => id !== userId) } : g))
        .filter((g) => g.memberIds.length > 0),
    }));
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
api.setOnSessionExpired(() => useAppStore.setState({ authUser: null, activeRole: "student" }));
