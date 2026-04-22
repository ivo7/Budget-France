import { randomBytes } from "node:crypto";

/** Génère un token URL-safe de 32 caractères. */
export function newToken(): string {
  return randomBytes(24).toString("base64url");
}
