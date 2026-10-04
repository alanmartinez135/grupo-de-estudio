# Grupo de Estudio Duoc UC

Aplicación multiplataforma (móvil y web) para apoyar el aprendizaje del inglés entre estudiantes de Duoc UC. Permite conocer el nivel de inglés mediante una evaluación diagnóstica, formar grupos de estudio por nivel, resolver tests semanales y conversar con otros estudiantes. Proyecto APT (Capstone).

Estado: prototipo funcional. El frontend está completo y trabaja con datos simulados en memoria; la conexión con un servidor real aún no está implementada.

## Contenido

- [Funcionalidades](#funcionalidades)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Requisitos](#requisitos)
- [Cómo ejecutar el proyecto](#cómo-ejecutar-el-proyecto)
- [Cuentas de prueba](#cuentas-de-prueba)
- [Frontend (apps/mobile)](#frontend-appsmobile)
- [Backend y comunicación cliente-servidor](#backend-y-comunicación-cliente-servidor)
- [Estado del proyecto](#estado-del-proyecto)
- [Equipo](#equipo)

## Funcionalidades

**Estudiante**

- Registro e inicio de sesión con correo institucional `@duocuc.cl`, y recuperación de contraseña.
- Evaluación diagnóstica de lectura y escritura, con resultados, fortalezas, aspectos a reforzar y recomendaciones.
- Grupos de estudio (máximo 6 integrantes): crear, unirse desde el listado o con código de invitación, ver integrantes y abandonar.
- Tests semanales por grupo.
- Comunidad: lista de contactos y chat.
- Ajustes: modo claro/oscuro, idioma (Español/English), cerrar sesión y eliminar cuenta.

**Administrador**

- Gestión de usuarios: búsqueda, filtro por rol, cambio de rol y eliminación.
- Gestión de evaluaciones: listado y creación (estado borrador o publicado).

## Estructura del repositorio

Monorepo gestionado con [Turborepo](https://turborepo.dev/) y pnpm.

```
grupo-de-estudio/
├── apps/
│   └── mobile/          # App Expo (React Native + web). Frontend del proyecto.
└── packages/
    ├── types/           # Esquemas y tipos compartidos (Zod): Student, StudyGroup
    ├── api/             # (stub) cliente de API, pendiente de implementar
    ├── core/            # (stub) lógica compartida, pendiente de implementar
    └── i18n/            # (stub) internacionalización con i18next, pendiente
```

## Requisitos

- Node.js 24 o superior (`engines` del `package.json` raíz).
- pnpm 11 (`packageManager` del `package.json` raíz).
- Para ver la app en un teléfono: la aplicación Expo Go, o un emulador Android/iOS.

## Cómo ejecutar el proyecto

Desde la raíz del repositorio:

```sh
# 1. Instalar dependencias de todo el monorepo
pnpm install

# 2. Iniciar la app (elige una opción)
pnpm --filter mobile start      # menú de Expo: escanear QR, abrir en emulador o en web
pnpm --filter mobile web        # abrir directamente en el navegador
pnpm --filter mobile android    # emulador Android
pnpm --filter mobile ios        # simulador iOS (solo macOS)
```

Otros comandos de la raíz: `pnpm lint`, `pnpm check-types`, `pnpm format`.

## Cuentas de prueba

Los datos son ficticios y viven en `apps/mobile/data/mockData.ts`. El formulario de login viene precargado con la cuenta de estudiante.

| Rol           | Correo                        | Contraseña |
| ------------- | ----------------------------- | ---------- |
| Estudiante    | `javiera.acuna@duocuc.cl`     | `duoc2024` |
| Estudiante    | `sebastian.navarro@duocuc.cl` | `duoc2024` |
| Administrador | `admin@duocuc.cl`             | `admin2024` |

Dentro de la app, el botón flotante dorado (**⇄**, “Dev Toolbar”) permite cambiar entre la vista de Alumno y la de Administrador sin volver a iniciar sesión.

## Frontend (apps/mobile)

### Tecnologías

| Área                 | Herramienta                                                      |
| -------------------- | ---------------------------------------------------------------- |
| Framework            | Expo SDK 57, React Native 0.86, React 19                         |
| Navegación           | Expo Router (rutas basadas en archivos, rutas tipadas)           |
| Estilos              | NativeWind 4 (Tailwind CSS 3), modo oscuro con clase `dark:`      |
| Estado global        | Zustand                                                          |
| Validación y tipos   | TypeScript y Zod (paquete `@grupo-estudio/types`)                |
| Datos remotos        | TanStack Query (configurado en el layout raíz, aún sin uso)      |
| Internacionalización | Diccionario liviano propio (`lib/i18n.ts`)                       |

### Organización de carpetas

```
apps/mobile/
├── app/                  # Pantallas y rutas (Expo Router)
│   ├── _layout.tsx       # Layout raíz: fuentes, tema, proveedor de TanStack Query
│   ├── (auth)/           # login, register, forgot-password, reset-password
│   ├── (student)/        # dashboard, diagnostic-test, groups, weekly-tests, chat, settings
│   └── (admin)/          # users, tests (listado y creación)
├── components/
│   ├── ui/               # Componentes base: Button, Card, Input, Modal, Badge, Avatar, ProgressBar, Screen
│   ├── AppHeader.tsx     # Encabezado con navegación por rol y botón de tema
│   ├── AuthShell.tsx     # Contenedor de las pantallas de autenticación
│   └── RoleSwitcher.tsx  # Barra de desarrollo para cambiar de rol
├── store/useAppStore.ts  # Estado global (Zustand)
├── data/mockData.ts      # Datos ficticios y tipos de la interfaz
├── lib/i18n.ts           # Textos Español/English
├── tailwind.config.js    # Paleta institucional y configuración de NativeWind
└── app.json              # Configuración de Expo
```

### Navegación

Las carpetas entre paréntesis son *grupos de rutas*: organizan las pantallas por rol sin afectar la URL, y cada una tiene su propio `_layout.tsx`. Los layouts `(student)` y `(admin)` redirigen a `/(auth)/login` si no hay sesión iniciada.

| Grupo       | Ruta                          | Pantalla                                  |
| ----------- | ----------------------------- | ----------------------------------------- |
| `(auth)`    | `/login`                      | Inicio de sesión                          |
| `(auth)`    | `/register`                   | Registro                                  |
| `(auth)`    | `/forgot-password`            | Solicitud de recuperación de contraseña   |
| `(auth)`    | `/reset-password`             | Nueva contraseña                          |
| `(student)` | `/dashboard`                  | Inicio del estudiante                     |
| `(student)` | `/diagnostic-test`            | Evaluación diagnóstica                    |
| `(student)` | `/diagnostic-test/result`     | Resultados del diagnóstico                |
| `(student)` | `/groups`                     | Listado de grupos                         |
| `(student)` | `/groups/[groupId]`           | Detalle de grupo                          |
| `(student)` | `/weekly-tests/[testId]`      | Test semanal                              |
| `(student)` | `/chat`                       | Comunidad                                 |
| `(student)` | `/chat/[friendId]`            | Conversación                              |
| `(student)` | `/settings`                   | Ajustes                                   |
| `(admin)`   | `/users`                      | Gestión de usuarios                       |
| `(admin)`   | `/tests`                      | Listado de evaluaciones                   |
| `(admin)`   | `/tests/new`                  | Crear evaluación                          |

### Diseño y componentes

- La paleta (azul marino `navy`, dorado `gold`, y colores `surface` e `ink` para fondos y texto) está definida en `tailwind.config.js`.
- Los componentes de `components/ui` encapsulan el estilo; las pantallas los componen en lugar de repetir clases.
- El tema claro/oscuro se guarda en el store de Zustand y se sincroniza con NativeWind en `app/_layout.tsx`.

### Estado y datos

Todo el estado de la aplicación vive en `store/useAppStore.ts` y parte de los datos ficticios de `data/mockData.ts`. Las acciones que pueden fallar (login, registro, unirse a un grupo) devuelven un objeto `{ ok, message }`, que simula la respuesta que luego entregará el servidor. Los datos se reinician al recargar la app.

## Backend y comunicación cliente-servidor

Pendiente Alan: describir aquí la arquitectura del servidor, los endpoints, la autenticación y cómo se conectará `apps/mobile` con la API (el paquete `packages/api` está vacío por ahora).

## Estado del proyecto

- Hecho: interfaz completa de 16 pantallas, navegación por roles, sistema de diseño, modo oscuro, reglas de negocio simuladas en el store.
- Pendiente: conexión con un servidor y base de datos reales, persistencia, autenticación segura (las contraseñas de prueba solo existen en el mock), traducción completa del idioma y pruebas automatizadas.

## Equipo

- Alan Martínez: arquitectura y backend.
- Javiera Acuña: frontend.
