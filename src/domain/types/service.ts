/**
 * Generic result type for service operations that can fail with
 * a business-level error (validation, conflict, authorization).
 *
 * Using a discriminated union instead of throwing exceptions allows
 * API routes to translate errors to appropriate HTTP status codes
 * without try/catch chains.
 */

/**
 * Error codes returned by service operations.
 *
 * - validation: input is invalid (→ 400)
 * - not_found: entity does not exist (→ 404)
 * - forbidden: user lacks permission (→ 403)
 * - conflict: operation conflicts with existing state (→ 409)
 */
export type ServiceErrorCode = "validation" | "not_found" | "forbidden" | "conflict";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ServiceErrorCode; message: string };
