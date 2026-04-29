import type { UserRole } from "@/types";
import { portalRoutes } from "./routes";

type PortalUrlConfig = {
  student: string;
  hostel_owner: string;
  super_admin: string;
};

const resolvePortalConfig = (): PortalUrlConfig => {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};

  return {
    student: env.VITE_STUDENT_PORTAL_URL ?? "/",
    hostel_owner: env.VITE_OWNER_PORTAL_URL ?? "/owner/dashboard",
    super_admin: env.VITE_ADMIN_PORTAL_URL ?? "/admin/dashboard",
  };
};

export const getPortalUrlForRole = (
  role: UserRole,
  config: PortalUrlConfig = resolvePortalConfig(),
): string => {
  return config[role] ?? "/";
};
