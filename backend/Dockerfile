# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

# ---------- deps: instala todo el arbol (incluye dev deps) ----------
FROM base AS deps
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --no-audit --no-fund --include-workspace-root=false

# ---------- build: compila solo el backend ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY backend ./backend
WORKDIR /app/backend
RUN /app/node_modules/.bin/nest build && ls -la /app/backend/dist | head

# ---------- prod-deps: solo dependencias de produccion ----------
FROM base AS prod-deps
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --omit=dev --no-audit --no-fund --include-workspace-root=false

# ---------- runtime ----------
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=prod-deps /app/node_modules ./node_modules
WORKDIR /app/backend
USER node
EXPOSE 3030
CMD ["node", "dist/main.js"]