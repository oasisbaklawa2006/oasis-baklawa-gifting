/**
 * Staff status data may only be released after a verified Oasis staff session
 * and role authorization. The Gifting website has no approved Core SSO bridge
 * yet; never interpret a public preview session or noindex as staff authority.
 */
export async function requireVerifiedStaffStatusAccess(): Promise<void> {
  throw new Error("Gifting staff status access is disabled pending verified Core SSO.");
}

/** Ensure unverified callers cannot reach a private diagnostic handler. */
export async function runVerifiedStaffStatusHandler<T>(handler: () => Promise<T>): Promise<T> {
  await requireVerifiedStaffStatusAccess();
  return await handler();
}
