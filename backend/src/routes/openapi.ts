// ============================================================================
// routes/openapi.ts — sert la spécification OpenAPI 3.0 de l'API publique
// ============================================================================
//
// Endpoint :
//   GET /api/openapi.json  → spec OpenAPI 3.0.3 complète au format JSON
//
// La spec est définie dans src/lib/openapiSpec.ts et affichée sur la page
// /api-docs du frontend via Redoc (composant standard pour visualiser des
// specs OpenAPI).
// ============================================================================

import type { FastifyInstance } from "fastify";
import { OPENAPI_SPEC } from "../lib/openapiSpec.ts";

export function registerOpenapiRoutes(app: FastifyInstance) {
  app.get("/api/openapi.json", async (_req, reply) => {
    reply.header("Cache-Control", "public, max-age=600"); // 10 min cache
    return OPENAPI_SPEC;
  });
}
