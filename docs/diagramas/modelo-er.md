# Modelo entidad-relación

Fuente: `apps/api/db/schema.sql` (PostgreSQL 16). Las claves primarias compuestas (PK,FK) impiden duplicados: un estudiante no puede estar dos veces en un grupo, rendir dos veces la misma evaluación ni responder dos veces un encuentro.

```mermaid
erDiagram
  USUARIOS ||--o{ GRUPO_INTEGRANTES : "integra"
  GRUPOS ||--|{ GRUPO_INTEGRANTES : "tiene (1 a 6)"
  USUARIOS |o--o{ GRUPOS : "crea"
  EVALUACIONES ||--|{ PREGUNTAS : "contiene"
  EVALUACIONES ||--o{ RESULTADOS : "registra"
  USUARIOS ||--o{ RESULTADOS : "rinde"
  GRUPOS ||--o{ ENCUENTROS : "programa"
  USUARIOS |o--o{ ENCUENTROS : "propone"
  ENCUENTROS ||--o{ ASISTENCIAS : "recibe"
  USUARIOS ||--o{ ASISTENCIAS : "responde"

  USUARIOS {
    uuid id PK
    text correo UK "@duocuc.cl, minúsculas"
    text password_hash "Argon2id"
    text nombre
    text carrera
    jornada jornada "diurna | vespertina"
    nivel_ingles nivel_ingles "A1 a C2"
    rol rol "student | admin"
    timestamptz creado_en
  }
  GRUPOS {
    uuid id PK
    text nombre
    text descripcion
    text codigo UK "DUOC-####"
    nivel_ingles nivel
    uuid creado_por FK "SET NULL"
    timestamptz creado_en
  }
  GRUPO_INTEGRANTES {
    uuid grupo_id PK,FK
    uuid usuario_id PK,FK
    timestamptz unido_en
  }
  EVALUACIONES {
    uuid id PK
    tipo_evaluacion tipo "diagnostica | semanal"
    text titulo
    habilidad habilidad "reading | writing"
    nivel_ingles nivel "solo semanal"
    date fecha_limite
    boolean publicada
    timestamptz creado_en
  }
  PREGUNTAS {
    uuid id PK
    uuid evaluacion_id FK
    int orden
    habilidad habilidad
    text competencia
    text enunciado
    text_array opciones "2 a 6"
    int indice_correcto "nunca sale del servidor"
  }
  RESULTADOS {
    uuid evaluacion_id PK,FK
    uuid usuario_id PK,FK
    jsonb respuestas
    int correctas
    int total
    int puntaje "0 a 100"
    jsonb detalle
    timestamptz rendido_en
  }
  ENCUENTROS {
    uuid id PK
    uuid grupo_id FK
    text tema
    timestamptz inicio
    int duracion_min "15 a 240"
    modalidad_encuentro modalidad "presencial | online"
    text lugar
    uuid creado_por FK "SET NULL"
    timestamptz creado_en
  }
  ASISTENCIAS {
    uuid encuentro_id PK,FK
    uuid usuario_id PK,FK
    respuesta_asistencia respuesta "yes | no"
  }
```
