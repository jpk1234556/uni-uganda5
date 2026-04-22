import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Overview = lazy(() => import("./components/admin/Overview"));
const UsersManager = lazy(() => import("./components/admin/UsersManager"));
const HostelsManager = lazy(() => import("./components/admin/HostelsManager"));
const BookingsManager = lazy(() => import("./components/admin/BookingsManager"));
const PaymentsManager = lazy(() => import("./components/admin/PaymentsManager"));
const ReviewsManager = lazy(() => import("./components/admin/ReviewsManager"));
const ReportsManager = lazy(() => import("./components/admin/ReportsManager"));
const HostelVerification = lazy(() => import("./components/admin/HostelVerification"));
const Settings = lazy(() => import("./components/admin/Settings"));
const UniversityManager = lazy(() => import("./components/admin/UniversityManager"));
const AdminSidebar = lazy(() => import("./components/admin/AdminSidebar"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));

export default function App() {
  const fallback = (
    <div className="min-h-[40vh] flex items-center justify-center text-slate-500 text-sm">
      Loading...
    </div>
  );

  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={fallback}>
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route path="/auth" element={<Auth appType="admin" />} />

            {/* Admin Dashboard with Sidebar Layout */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={["super_admin"]}>
                  <AdminLayout sidebar={<AdminSidebar />}>
                    <div className="p-4 md:p-8">
                      <Routes>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="users" element={<UsersManager />} />
                        <Route path="hostels" element={<HostelsManager />} />
                        <Route path="bookings" element={<BookingsManager />} />
                        <Route path="payments" element={<PaymentsManager />} />
                        <Route path="reviews" element={<ReviewsManager />} />
                        <Route path="reports" element={<ReportsManager />} />
                        <Route
                          path="verification"
                          element={<HostelVerification />}
                        />
                        <Route
                          path="universities"
                          element={<UniversityManager />}
                        />
                        <Route path="settings" element={<Settings />} />
                        <Route
                          path="*"
                          element={<Navigate to="dashboard" replace />}
                        />
                      </Routes>
                    </div>
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={<Navigate to="/admin/dashboard" replace />}
            />
          </Routes>
        </Suspense>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}
