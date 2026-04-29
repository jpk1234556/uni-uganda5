import type { UserRole } from "@/types";

export const appRoutes = {
  home: "/",
  search: "/search",
  roommates: "/roommates",
  faq: "/faq",
  auth: "/auth",
  verifyEmail: "/verify-email",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  studentDashboard: "/student/dashboard",
  ownerDashboard: "/owner/dashboard",
  adminDashboard: "/admin/dashboard",
  hostelDetail: (id: string) => `/hostel/${id}`,
} as const;

export const portalRoutes: Record<UserRole, string> = {
  student: appRoutes.studentDashboard,
  hostel_owner: appRoutes.ownerDashboard,
  super_admin: appRoutes.adminDashboard,
};
