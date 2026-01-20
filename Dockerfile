# syntax = docker/dockerfile:1
ARG NODE_VERSION=22.18.0

FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app

# -------- Build stage --------
FROM base AS build

# deps para bcrypt/better-sqlite3
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

# IMPORTANT: copy workspace manifests first (cache + correct install)
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
COPY web/package.json ./web/package.json

# install including dev deps (tsc/vite live here)
RUN npm ci --include=dev

# now copy the rest
COPY . .

# build web + server (your root script)
RUN npm run build

# prune dev deps for runtime image
RUN npm prune --omit=dev

# -------- Runtime stage --------
FROM base AS final
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app /app

# tu server en el código escucha 3001 (por defecto)
EXPOSE 3001

# IMPORTANTE: start desde la raíz (donde está el script)
CMD ["npm","run","start"]