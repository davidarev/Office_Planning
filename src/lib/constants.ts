/**
 * Shared constants for the Office Desk Booking application.
 *
 * This module only defines primitive constants — no project imports.
 *
 * @module constants
 */

import type { ServiceErrorCode } from "@/domain/types";

/**
 * Maps service error codes to their corresponding HTTP status codes.
 * Extracted from route handlers to avoid duplication (H-131-2).
 */
export const HTTP_STATUS: Record<ServiceErrorCode, number> = {
  validation: 400,
  not_found: 404,
  forbidden: 403,
  conflict: 409,
};

/**
 * Maximum allowed date range (in days) for week-based queries.
 *
 * A value of 14 allows a diff of up to 14 days between start and end,
 * which covers the current week (Mon) to the following week (Sun) — exactly
 * 13 days apart. The check `diffDays > MAX_RANGE_DAYS` therefore permits
 * any range up to and including 14 days difference (H-132-09).
 */
export const MAX_RANGE_DAYS = 14;
