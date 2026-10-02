/**
 * Server-side session helper for API routes.
 */
import { getServerSession } from "next-auth";
import { authOptions, type AppSession } from "@/lib/auth";
import type { SessionClaims } from "@/lib/rbac";

export async function getClaims(): Promise<SessionClaims | null> {
  const session = (await getServerSession(authOptions)) as AppSession | null;
  if (!session?.user) return null;
  return {
    userId: session.user.id,
    role: session.user.role,
    assignedLgdCode: session.user.assignedLgdCode,
    assignedMinistryId: session.user.assignedMinistryId,
  };
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden(reason = "Insufficient role or LGD scope") {
  return Response.json({ error: "Forbidden", reason }, { status: 403 });
}
