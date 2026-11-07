/** Fail-closed authorization boundary for private TanStack server functions. */
import { createMiddleware } from "@tanstack/react-start";

import { runVerifiedStaffStatusHandler } from "./staff-access-policy";

export const staffStatusMiddleware = createMiddleware().server(async ({ next }) => {
  return await runVerifiedStaffStatusHandler(() => next());
});
