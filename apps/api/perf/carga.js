// Prueba de carga y rendimiento de la API (RNF-B01 y RNF-B03) con k6.
//
// Con la API corriendo (pnpm --filter api dev o docker compose), desde la raíz del repo:
//   docker run --rm -i -e BASE_URL=http://host.docker.internal:3000 grafana/k6 run - < apps/api/perf/carga.js
// Prueba formal de 10 minutos:
//   docker run --rm -i -e BASE_URL=http://host.docker.internal:3000 -e DURACION=10m grafana/k6 run - < apps/api/perf/carga.js
//
// Qué hace:
//  - setup: registra USUARIOS estudiantes de prueba, los reparte en grupos de nivel B1
//    (6 por grupo) y propone un encuentro por grupo.
//  - escenario "lectura": USUARIOS usuarios virtuales consultan su perfil, los grupos,
//    sus tests semanales y sus próximos encuentros, con una pausa de 1 s entre vueltas.
//  - escenario "login": 1 inicio de sesión por segundo (respeta el límite de 5 por minuto por correo).
//  - teardown: cada usuario de prueba abandona su grupo y elimina su cuenta.
// Umbrales (si no se cumplen, k6 termina con error):
//  - RNF-B01: el 95 % de las solicitudes responde en menos de 500 ms.
//  - RNF-B03: menos del 1 % de errores con USUARIOS usuarios simultáneos.
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = `${__ENV.BASE_URL || "http://localhost:3000"}/api/v1`;
const USUARIOS = Number(__ENV.USUARIOS || 100);
const DURACION = __ENV.DURACION || "1m";
const PASSWORD = "clave-de-carga-123";
const JSON_HEADERS = { "Content-Type": "application/json" };

export const options = {
  setupTimeout: "5m",
  teardownTimeout: "5m",
  scenarios: {
    lectura: {
      executor: "ramping-vus",
      exec: "lectura",
      startVUs: 0,
      stages: [
        { duration: "30s", target: USUARIOS },
        { duration: DURACION, target: USUARIOS },
        { duration: "10s", target: 0 },
      ],
    },
    login: {
      executor: "constant-arrival-rate",
      exec: "login",
      rate: 1,
      timeUnit: "1s",
      duration: DURACION,
      startTime: "30s",
      preAllocatedVUs: 5,
    },
  },
  thresholds: {
    "http_req_duration{scenario:lectura}": ["p(95)<500"],
    "http_req_duration{scenario:login}": ["p(95)<500"],
    "http_req_failed{scenario:lectura}": ["rate<0.01"],
    "http_req_failed{scenario:login}": ["rate<0.01"],
  },
};

const auth = (token) => ({ headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` } });
// Sin cuerpo no se envía Content-Type: Fastify rechaza (400) un JSON vacío.
const authSinCuerpo = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

function exigir(res, esperado, accion) {
  if (res.status !== esperado) throw new Error(`${accion}: ${res.status} ${res.body}`);
  return res;
}

export function setup() {
  const run = Date.now();
  const users = [];
  let groupId = null;
  for (let i = 0; i < USUARIOS; i++) {
    const correo = `carga.k6.${run}.${i}@duocuc.cl`;
    const res = http.post(
      `${BASE}/auth/registro`,
      JSON.stringify({ correo, password: PASSWORD, name: `Carga ${i}`, career: "Prueba de carga", jornada: "diurna", englishLevel: "B1" }),
      { headers: JSON_HEADERS },
    );
    if (res.status !== 201) throw new Error(`No se pudo registrar ${correo}: ${res.status} ${res.body}`);
    const token = res.json("accessToken");

    if (i % 6 === 0) {
      groupId = exigir(
        http.post(`${BASE}/grupos`, JSON.stringify({ name: `Carga k6 ${i / 6 + 1}`, level: "B1" }), auth(token)),
        201,
        "Crear grupo",
      ).json("id");
      const encuentro = http.post(
        `${BASE}/grupos/${groupId}/encuentros`,
        JSON.stringify({
          topic: "Encuentro de prueba de carga",
          startsAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          durationMinutes: 60,
          mode: "presencial",
          location: "Sala de prueba",
        }),
        auth(token),
      );
      exigir(encuentro, 201, "Proponer encuentro");
    } else {
      exigir(http.post(`${BASE}/grupos/${groupId}/integrantes`, null, authSinCuerpo(token)), 200, "Unirse al grupo");
    }
    users.push({ correo, groupId });
  }
  return { users };
}

// Los tokens de acceso duran 15 minutos: cada usuario virtual inicia sesión una vez y lo reutiliza.
const tokens = {};
function tokenDe(user) {
  if (!tokens[user.correo]) {
    const res = http.post(`${BASE}/auth/login`, JSON.stringify({ correo: user.correo, password: PASSWORD }), {
      headers: JSON_HEADERS,
      tags: { name: "login-inicial" },
    });
    tokens[user.correo] = res.json("accessToken");
  }
  return tokens[user.correo];
}

export function lectura(data) {
  const user = data.users[(__VU - 1) % data.users.length];
  const params = auth(tokenDe(user));
  const respuestas = http.batch([
    ["GET", `${BASE}/usuarios/me`, null, { ...params, tags: { name: "GET /usuarios/me" } }],
    ["GET", `${BASE}/grupos`, null, { ...params, tags: { name: "GET /grupos" } }],
    ["GET", `${BASE}/tests`, null, { ...params, tags: { name: "GET /tests" } }],
    ["GET", `${BASE}/encuentros/proximos`, null, { ...params, tags: { name: "GET /encuentros/proximos" } }],
  ]);
  check(respuestas, { "todas responden 200": (rs) => rs.every((r) => r.status === 200) });
  sleep(1);
}

let siguiente = 0;
export function login(data) {
  // Rota los correos para no superar el límite de 5 intentos por minuto por correo (RNF-B08).
  const user = data.users[(siguiente++ * 7 + __VU) % data.users.length];
  const res = http.post(`${BASE}/auth/login`, JSON.stringify({ correo: user.correo, password: PASSWORD }), {
    headers: JSON_HEADERS,
    tags: { name: "POST /auth/login" },
  });
  check(res, { "login 200": (r) => r.status === 200 });
}

export function teardown(data) {
  for (const user of data.users) {
    const res = http.post(`${BASE}/auth/login`, JSON.stringify({ correo: user.correo, password: PASSWORD }), { headers: JSON_HEADERS });
    const token = res.json("accessToken");
    if (!token) continue;
    // Eliminar la cuenta la saca de su grupo, y el grupo se borra al quedar vacío.
    const res2 = http.del(`${BASE}/usuarios/me`, null, authSinCuerpo(token));
    if (res2.status !== 204) console.warn(`No se pudo eliminar ${user.correo}: ${res2.status}`);
  }
}
