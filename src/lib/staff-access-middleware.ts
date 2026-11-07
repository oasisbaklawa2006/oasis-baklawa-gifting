/** Fail-closed authorization boundary for private TanStack server functions. */
import { createMiddleware } from "@tanstack/react-start";

import { requireVerifiedStaffStatusAccess } from "./staff-access-policy";

export const staffStatusMiddleware = createMiddleware().server(async ({ next }) => {
  await requireVerifiedStaffStatusAccess();
  return await next();
});
