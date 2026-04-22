# Image pour le pipeline d'ingestion.
# Usage :
#   docker compose run --rm pipeline              # ingestion réelle -> ../data/budget.json
#   docker compose run --rm pipeline --mock       # mode mock
FROM node:22-alpine AS pipeline

WORKDIR /app

# Installation des dépendances (cache-friendly)
COPY pipeline/package.json pipeline/package-lock.json* ./pipeline/
WORKDIR /app/pipeline

# Timeouts généreux + retries (connexions lentes, ETIMEDOUT occasionnels)
RUN npm config set fetch-timeout 600000 \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm install --no-audit --no-fund --prefer-offline

# Copie du code
COPY pipeline/src ./src
COPY pipeline/tsconfig.json ./

# /data est monté en volume depuis l'hôte par docker-compose
VOLUME ["/data"]

ENV NODE_ENV=production

ENTRYPOINT ["npx", "tsx", "src/ingest.ts"]
CMD ["--output", "/data/budget.json"]
