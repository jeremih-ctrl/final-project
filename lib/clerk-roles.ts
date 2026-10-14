import { useUser } from "@clerk/nextjs";

export type AppRole = "admin" | "vendor" | null;

/**
 * Resolves the application role strictly from a user's trusted Clerk publicMetadata.
 * Security Note: Does NOT infer administrator privileges from email domain, Gmail address,
 * display name, or unverified client metadata.
 */
export function resolveUserRole(
  publicMetadata?: Record<string, unknown> | null
): AppRole {
  if (publicMetadata?.role === "admin") {
    return "admin";
  }
  if (publicMetadata?.role === "vendor") {
    return "vendor";
  }
  return null;
}

/**
 * React hook to inspect the current user's verified application role
 */
export function useAppRole() {
  const { user, isLoaded, isSignedIn } = useUser();

  const email = user?.primaryEmailAddress?.emailAddress || null;
  const role: AppRole = isSignedIn ? resolveUserRole(user?.publicMetadata) : null;
  const isAdmin = role === "admin";
  const isVendor = role === "vendor";
  const isUnauthorized = Boolean(isSignedIn && role === null);

  return {
    user,
    isLoaded,
    isSignedIn,
    role,
    isAdmin,
    isVendor,
    isUnauthorized,
    email,
  };
}
