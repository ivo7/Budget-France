# Image pour le dashboard : build Vite, puis nginx pour servir le résultat.
# Le JSON du pipeline est monté en volume à /usr/share/nginx/html/data
# pour que le dashboard puisse le récupérer sans rebuild.

# --- Build stage ---
FROM node:22-alpine AS build

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./frontend/
WORKDIR /app/frontend

# Timeouts généreux + retries (connexions lentes, ETIMEDOUT occasionnels)
RUN npm config set fetch-timeout 600000 \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm install --no-audit --no-fund --prefer-offline

COPY frontend/ ./
RUN npm run build

# --- Runtime stage ---
FROM nginx:1.27-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# /usr/share/nginx/html/data est monté depuis ../data en production
EXPOSE 80
