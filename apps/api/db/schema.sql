-- Modelo de datos de Grupo de Estudio Duoc UC (PostgreSQL 16).
-- Es idempotente: se puede ejecutar varias veces (pnpm --filter api db:migrate).
-- Incremento 1 (Sprint 5): usuarios, grupos de estudio e integrantes.
-- Evaluaciones, resultados y mensajes se agregan en los incrementos siguientes.

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
