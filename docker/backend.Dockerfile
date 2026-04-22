# Backend Fastify + Prisma + Postgres client.
FROM node:22-alpine AS backend

# OpenSSL requis par Prisma runtime
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Installation des dépendances (cache-friendly)
COPY backend/package.json backend/package-lock.json* ./backend/
COPY backend/prisma ./backend/prisma
WORKDIR /app/backend

# Timeouts généreux + retries pour résister aux connexions lentes/saturées
# (ETIMEDOUT courant sur connexions instables vers registry.npmjs.org).
RUN npm config set fetch-timeout 600000 \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm install --no-audit --no-fund --prefer-offline

# Génération du client Prisma à partir du schema
RUN npx prisma generate

# Copie du code
COPY backend/src ./src
COPY backend/tsconfig.json ./

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# L'entrypoint applique les migrations SQL puis lance le serveur.
# - prisma db push synchronise le schéma Prisma vers la DB (dev/staging-friendly).
#   Pour la prod stricte, remplacer par `prisma migrate deploy` avec des migrations
#   générées au préalable via `npm run db:dev` en local.
CMD ["sh", "-c", "npx prisma db push --accept-data-loss --skip-generate && npx tsx src/server.ts"]
