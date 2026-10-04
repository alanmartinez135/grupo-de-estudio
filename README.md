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
│   ├── api/             # API REST (Fastify + PostgreSQL). Backend del proyecto.
│   └── mobile/          # App Expo (React Native + web). Frontend del proyecto.
└── packages/
    ├── types/           # Esquemas y tipos compartidos (Zod): usuarios, grupos, auth y errores
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

El inicio de sesión y el registro usan la API real, así que las cuentas viven en PostgreSQL:

- **Estudiante:** crea una desde la pantalla de registro (correo `@duocuc.cl`, contraseña de al menos 8 caracteres).
- **Administrador:** define `SEED_ADMIN_CORREO` y `SEED_ADMIN_PASSWORD` en `apps/api/.env` y ejecuta `pnpm --filter api db:seed`.

Dentro de la app, el botón flotante dorado (**⇄**, "Dev Toolbar") permite cambiar entre la vista de Alumno y la de Administrador para revisar las pantallas. Es solo visual: la API sigue validando el rol real en cada solicitud.

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

La API vive en `apps/api`: Node.js con TypeScript y Fastify, base de datos PostgreSQL 16 y despliegue con Docker Compose. Valida las entradas con los mismos esquemas Zod de `packages/types` que usa la app.

### Cómo levantar el backend

Requisitos: Docker Desktop y pnpm.

```sh
# 1. Variables de entorno (una sola vez)
copy apps\api\.env.example apps\api\.env      # Windows (en macOS/Linux: cp)

# 2. Base de datos en Docker
docker compose up -d db

# 3. Dependencias y API en modo desarrollo (aplica el esquema al iniciar)
pnpm install
pnpm --filter api dev                          # http://localhost:3000/health

# Opcional: cuenta de administrador (define SEED_ADMIN_PASSWORD en apps/api/.env)
pnpm --filter api db:seed

# Pruebas automatizadas (requieren la base de Docker)
pnpm --filter api test
```

Para levantar todo en contenedores (base y API): `docker compose up -d --build`.

### Endpoints disponibles

Todas las rutas usan el prefijo `/api/v1`. Los errores responden siempre con `{ "error": { "codigo", "mensaje" } }`.

| Método | Ruta              | Acceso        | Descripción                                          |
| ------ | ----------------- | ------------- | ---------------------------------------------------- |
| POST   | `/auth/registro`  | Público       | Crea un estudiante (correo `@duocuc.cl`) y entrega tokens |
| POST   | `/auth/login`     | Público       | Inicia sesión; máximo 5 intentos por minuto          |
| POST   | `/auth/renovar`   | Público       | Entrega tokens nuevos a partir del token de renovación |
| GET    | `/usuarios/me`    | Con sesión    | Datos del usuario de la sesión                       |
| DELETE | `/usuarios/me`    | Con sesión    | Elimina la cuenta y sus datos                        |
| GET    | `/usuarios`       | Administrador | Lista y filtra usuarios (`?q=` y `?rol=`)             |
| GET    | `/grupos`         | Con sesión    | Lista los grupos con sus integrantes                 |
| POST   | `/grupos`         | Con sesión    | Crea un grupo (código `DUOC-####`); el creador queda como integrante |
| GET    | `/grupos/:id`     | Con sesión    | Detalle de un grupo                                  |
| POST   | `/grupos/unirse`  | Con sesión    | Unirse con el código de invitación                   |
| POST   | `/grupos/:id/integrantes` | Con sesión | Unirse desde el listado (máximo 6 integrantes)   |
| DELETE | `/grupos/:id/integrantes/me` | Con sesión | Abandonar el grupo; si queda vacío, se elimina |
| GET    | `/health`         | Público       | Estado de la API y de la base (sin prefijo)          |

### Seguridad

- Contraseñas con hash Argon2id; la base nunca guarda el texto plano.
- Token de acceso JWT de 15 minutos y token de renovación de 7 días.
- El rol se verifica en el servidor en cada ruta de administración.
- El login responde igual si el correo no existe o si la contraseña es incorrecta, para no revelar qué cuentas existen.
- El cupo de 6 integrantes se controla en una transacción que bloquea el grupo (`SELECT … FOR UPDATE`): aunque varias personas intenten unirse a la vez, nadie supera el límite.

### Modelo de datos

El esquema está en `apps/api/db/schema.sql`: tablas `usuarios`, `grupos` y `grupo_integrantes`. Evaluaciones, resultados y mensajes se agregan en los próximos incrementos.

### Conexión de la app con la API

`packages/api` es el cliente HTTP que usa la app: adjunta el token, lo renueva cuando vence y entrega los errores con su mensaje. Hoy están conectados el **registro, el inicio de sesión, el cierre de sesión, la eliminación de cuenta y los grupos de estudio**; la evaluación diagnóstica, los tests semanales, el chat y la administración siguen con datos simulados.

```sh
copy apps\mobile\.env.example apps\mobile\.env   # Windows (en macOS/Linux: cp)
```

En `apps/mobile/.env`, `EXPO_PUBLIC_API_URL` apunta a `http://localhost:3000` para la versión web. Para probar en un teléfono con Expo Go, usa la IP del computador en la misma red WiFi (la API la muestra al iniciar) y reinicia Expo. En el teléfono la sesión se guarda cifrada con `expo-secure-store`; en web queda solo en memoria.

### Pendiente

Endpoints de evaluaciones (diagnóstica y tests semanales), chat y administración de usuarios, y su conexión con la app.

## Estado del proyecto

- Hecho: interfaz completa de 16 pantallas, navegación por roles, sistema de diseño, modo oscuro, reglas de negocio simuladas en el store.
- Pendiente: conexión con un servidor y base de datos reales, persistencia, autenticación segura (las contraseñas de prueba solo existen en el mock), traducción completa del idioma y pruebas automatizadas.

## Equipo

- Alan Martínez: arquitectura y backend.
- Javiera Acuña: frontend.
