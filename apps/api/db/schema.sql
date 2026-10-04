-- Modelo de datos de Grupo de Estudio Duoc UC (PostgreSQL 16).
-- Es idempotente: se puede ejecutar varias veces (pnpm --filter api db:migrate).
-- Sprint 5: usuarios, grupos de estudio e integrantes.
-- Sprint 6: evaluaciones (diagnóstica y semanales), preguntas, resultados y encuentros de estudio.
-- Los mensajes del chat se agregan en un incremento siguiente.

DO $$ BEGIN
  CREATE TYPE rol AS ENUM ('student', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE jornada AS ENUM ('diurna', 'vespertina');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE nivel_ingles AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS usuarios (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correo         text NOT NULL UNIQUE
                 CHECK (correo = lower(correo) AND correo LIKE '%@duocuc.cl'),
  password_hash  text NOT NULL,            -- Argon2id, nunca la contraseña en texto plano (RNF-B04)
  nombre         text NOT NULL,
  carrera        text NOT NULL,
  jornada        jornada NOT NULL,
  nivel_ingles   nivel_ingles NOT NULL,
  rol            rol NOT NULL DEFAULT 'student',
  creado_en      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grupos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       text NOT NULL,
  descripcion  text NOT NULL DEFAULT '',
  codigo       text NOT NULL UNIQUE CHECK (codigo ~ '^DUOC-[0-9]{4}$'),  -- código de invitación (RNF-B09)
  nivel        nivel_ingles NOT NULL,
  creado_por   uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grupo_integrantes (
  grupo_id    uuid NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_id  uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  unido_en    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (grupo_id, usuario_id)       -- un estudiante no puede estar dos veces en el mismo grupo
);

CREATE INDEX IF NOT EXISTS grupo_integrantes_usuario_idx ON grupo_integrantes (usuario_id);

-- ---------------------------------------------------------------- evaluaciones (Sprint 6)

DO $$ BEGIN
  CREATE TYPE habilidad AS ENUM ('reading', 'writing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_evaluacion AS ENUM ('diagnostica', 'semanal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS evaluaciones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          tipo_evaluacion NOT NULL,
  titulo        text NOT NULL,
  habilidad     habilidad,                  -- solo tests semanales
  nivel         nivel_ingles,               -- solo tests semanales: lo ven los grupos de ese nivel
  fecha_limite  date,
  publicada     boolean NOT NULL DEFAULT true,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  CHECK (tipo = 'diagnostica' OR (habilidad IS NOT NULL AND nivel IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS preguntas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id    uuid NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
  orden            int NOT NULL,
  habilidad        habilidad NOT NULL,
  competencia      text NOT NULL,           -- Vocabulario, Comprensión lectora, Gramática, Conectores
  enunciado        text NOT NULL,
  opciones         text[] NOT NULL CHECK (array_length(opciones, 1) BETWEEN 2 AND 6),
  indice_correcto  int NOT NULL CHECK (indice_correcto >= 0 AND indice_correcto < array_length(opciones, 1)),
  UNIQUE (evaluacion_id, orden)
);

-- Un resultado por estudiante y evaluación. La calificación la calcula el servidor (H5).
CREATE TABLE IF NOT EXISTS resultados (
  evaluacion_id  uuid NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
  usuario_id     uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  respuestas     jsonb NOT NULL,            -- id de pregunta -> índice elegido
  correctas      int NOT NULL,
  total          int NOT NULL,
  puntaje        int NOT NULL CHECK (puntaje BETWEEN 0 AND 100),
  detalle        jsonb,                     -- resultado completo del diagnóstico
  rendido_en     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (evaluacion_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS evaluaciones_semanal_nivel_idx ON evaluaciones (nivel) WHERE tipo = 'semanal';
CREATE INDEX IF NOT EXISTS resultados_usuario_idx ON resultados (usuario_id);

-- ---------------------------------------------------------------- encuentros de estudio (Sprint 6)

DO $$ BEGIN
  CREATE TYPE modalidad_encuentro AS ENUM ('presencial', 'online');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE respuesta_asistencia AS ENUM ('yes', 'no');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS encuentros (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id      uuid NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  tema          text NOT NULL,
  inicio        timestamptz NOT NULL,
  duracion_min  int NOT NULL CHECK (duracion_min BETWEEN 15 AND 240),
  modalidad     modalidad_encuentro NOT NULL,
  lugar         text NOT NULL,              -- sala o sede si es presencial; enlace si es online
  creado_por    uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS asistencias (
  encuentro_id  uuid NOT NULL REFERENCES encuentros(id) ON DELETE CASCADE,
  usuario_id    uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  respuesta     respuesta_asistencia NOT NULL,
  PRIMARY KEY (encuentro_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS encuentros_grupo_inicio_idx ON encuentros (grupo_id, inicio);
