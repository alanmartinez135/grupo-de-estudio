# Versión web de la app, servida con nginx. Se construye desde la raíz del monorepo:
#   docker compose up -d --build
# La URL del API queda fija al construir (variable EXPO_PUBLIC_API_URL).

# 1) Exportar la app web con Expo
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --filter mobile... --no-frozen-lockfile
ARG EXPO_PUBLIC_API_URL=http://localhost:3000
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
WORKDIR /app/apps/mobile
RUN pnpm exec expo export --platform web --output-dir dist

# 2) Servir los archivos estáticos
FROM nginx:1.27-alpine
COPY apps/mobile/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/mobile/dist /usr/share/nginx/html
EXPOSE 80
