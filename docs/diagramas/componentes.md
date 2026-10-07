# Diagrama de componentes (versión 2)

Agrega respecto de la versión 1 del anexo: el componente Autenticación y roles, el contrato compartido `packages/types` usado por cliente y servidor, la variable `EXPO_PUBLIC_API_URL`, el módulo de encuentros y administración, y el chat y el servicio de correo como trabajo futuro (líneas punteadas).

```mermaid
flowchart TB
  subgraph CLIENTE["Cliente · apps/mobile (Expo: Android, iOS y web)"]
    direction LR
    UI["Pantallas por rol<br/>Expo Router: auth, estudiante, admin"]
    ST["Estado global<br/>Zustand"]
    SES["Sesión<br/>expo-secure-store / memoria en web"]
    ENV[/"EXPO_PUBLIC_API_URL"/]
  end

  API_CLI["Cliente de API<br/>packages/api<br/>token Bearer, renovación, errores"]
  TYPES[["Contrato compartido<br/>packages/types (esquemas Zod)"]]

  subgraph SERVIDOR["Servidor · apps/api (Fastify, Node 24)"]
    direction LR
    SEC["Autenticación y roles<br/>JWT · Argon2id · rol leído de la BD · límite de intentos"]
    AUTH["Auth<br/>/auth"]
    USR["Usuarios<br/>/usuarios"]
    GRP["Grupos<br/>/grupos"]
    EVA["Evaluaciones<br/>/diagnostico · /tests"]
    MEE["Encuentros<br/>/encuentros"]
    ADM["Administración<br/>/admin"]
    HEA["Salud<br/>/health"]
  end

  DB[("PostgreSQL 16")]

  CHAT["Chat · WebSocket<br/>(trabajo futuro)"]
  MAIL["Servicio de correo<br/>(trabajo futuro)"]

  UI --> ST
  UI --> API_CLI
  ST --> API_CLI
  API_CLI --> SES
  ENV -.-> API_CLI
  API_CLI == "HTTP/REST JSON · /api/v1" ==> SEC
  SEC --> AUTH & USR & GRP & EVA & MEE & ADM
  AUTH & USR & GRP & EVA & MEE & ADM & HEA --> DB
  API_CLI -. usa .-> TYPES
  SERVIDOR -. valida con .-> TYPES
  UI -.-> CHAT
  AUTH -.-> MAIL

  classDef futuro stroke-dasharray: 5 5,fill:#f6f6f6,color:#777
  class CHAT,MAIL futuro
```
