# Imagen de la API. Se construye desde la raíz del monorepo:
#   docker compose up -d --build
FROM node:24-alpine

WORKDIR /app
RUN corepack enable

# Se copia el monorepo (sin node_modules, ver .dockerignore) y se instala solo lo que usa la API.
COPY . .
RUN pnpm install --filter api... --no-frozen-lockfile

WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["/app/node_modules/.bin/tsx", "src/server.ts"]
