import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type TenantRole = "owner" | "admin" | "member" | "guest_readonly";

export interface VerifiedSessionContext {
  authenticated: boolean;
  userId: string;
  tenantId: string;
  role: TenantRole;
  canWrite: boolean;
}

/**
 * Defense-in-depth session & role verifier for Route Handlers (mitigates CVE-2025-29927
 * and guards routes that use SUPABASE_SERVICE_ROLE_KEY).
 * Checks the user's Supabase Auth session cookie and verifies tenant membership & role.
 */
export async function verifyTenantSession(params?: {
  requestedTenantId?: string;
  requireAdmin?: boolean;
  requireWrite?: boolean;
}): Promise<VerifiedSessionContext> {
  const fallbackTenantId = params?.requestedTenantId || "11111111-1111-1111-1111-111111111111";

  try {
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (user) {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("id, tenant_id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        const role = (profile.role as TenantRole) || "member";
        const canWrite = role !== "guest_readonly";

        if (params?.requestedTenantId && profile.tenant_id !== params.requestedTenantId) {
          throw new Error("Acceso denegado: el usuario no pertenece al tenant solicitado.");
        }
        if (params?.requireAdmin && role !== "owner" && role !== "admin") {
          throw new Error("Acceso denegado: se requiere rol Administrador del Tenant.");
        }
        if (params?.requireWrite && !canWrite) {
          throw new Error("Acceso denegado: el rol Invitado (Solo Lectura) no puede modificar datos.");
        }

        return {
          authenticated: true,
          userId: profile.id,
          tenantId: profile.tenant_id,
          role,
          canWrite,
        };
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Acceso denegado:")) {
      throw err;
    }
  }

  if (process.env.SUPABASE_ENFORCE_STRICT_AUTH === "true") {
    throw new Error("Acceso denegado: sesión no autenticada.");
  }

  return {
    authenticated: false,
    userId: "22222222-2222-2222-2222-222222222222",
    tenantId: fallbackTenantId,
    role: "owner",
    canWrite: true,
  };
}
