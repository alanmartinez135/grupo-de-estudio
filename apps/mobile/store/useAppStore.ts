import { create } from "zustand";
import { EnglishLevel, Jornada } from "@grupo-estudio/types";
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
  login: (correo: string, password: string) => { ok: boolean; message: string };
  register: (data: {
    correo: string;
    password: string;
    name: string;
    career: string;
    jornada: Jornada;
    englishLevel: EnglishLevel;
  }) => { ok: boolean; message: string };
  logout: () => void;
  deleteAccount: () => void;
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

export const useAppStore = create<AppState>((set, get) => ({
  authUser: null,
  users: mockUsers,
  login: (correo, password) => {
    const found = get().users.find((u) => u.correo.toLowerCase() === correo.trim().toLowerCase());
    if (!found) return { ok: false, message: "No encontramos una cuenta con ese correo." };
    if (found.password !== password) return { ok: false, message: "Contraseña incorrecta." };
    set({ authUser: found, activeRole: found.role });
    return { ok: true, message: "Bienvenido/a de vuelta." };
  },
  register: ({ correo, password, name, career, jornada, englishLevel }) => {
    if (!correo.toLowerCase().endsWith("@duocuc.cl")) {
      return { ok: false, message: "Usa tu correo institucional (@duocuc.cl)." };
    }
    if (get().users.some((u) => u.correo.toLowerCase() === correo.toLowerCase())) {
      return { ok: false, message: "Ya existe una cuenta con ese correo." };
    }
    const newUser: MockUser = {
      id: `u-${Date.now()}`,
      correo,
      password,
      name: name.trim(),
      career: career.trim(),
      jornada,
      englishLevel,
      role: "student",
      avatarColor: "#2E5B8A",
    };
    set((s) => ({ users: [...s.users, newUser], authUser: newUser, activeRole: "student" }));
    return { ok: true, message: "Cuenta creada correctamente." };
  },
  logout: () => set({ authUser: null }),
  deleteAccount: () => {
    const id = get().authUser?.id;
    if (!id) return;
    set((s) => ({ users: s.users.filter((u) => u.id !== id), authUser: null }));
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
