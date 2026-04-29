import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";
import { getPortalUrlForRole } from "../../lib/portalRouting";
import { appRoutes } from "../../lib/routes";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

import { Loader2 } from "lucide-react";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, dbUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-slate-100">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={appRoutes.auth} replace />;
  }

  if (allowedRoles && !dbUser) {
    return <Navigate to={appRoutes.auth} replace />;
  }

  if (allowedRoles && dbUser && !allowedRoles.includes(dbUser.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 max-w-md w-full">
          <div className="h-16 w-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Access Denied
          </h2>
          <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
            You are logged in as a{" "}
            <strong className="text-slate-700 capitalize">
              {dbUser.role.replace("_", " ")}
            </strong>
            , but this portal requires{" "}
            <strong className="text-slate-700 capitalize">
              {allowedRoles[0].replace("_", " ")}
            </strong>{" "}
            privileges.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                window.location.assign(getPortalUrlForRole(dbUser.role));
              }}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98]"
            >
              Go to my portal
            </button>
            <button
              onClick={() => window.location.assign(appRoutes.auth)}
              className="w-full h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
            >
              Switch Accounts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
