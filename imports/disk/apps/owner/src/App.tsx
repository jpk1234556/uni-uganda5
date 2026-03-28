import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import OwnerDashboard from "./pages/OwnerDashboard";
import Auth from "@/pages/Auth";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex flex-col min-h-screen dark bg-slate-950">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route
                path="/"
                element={<Navigate to="/owner/dashboard" replace />}
              />
              <Route path="/auth" element={<Auth appType="owner" />} />
              <Route
                path="/owner/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["hostel_owner"]}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="*"
                element={<Navigate to="/owner/dashboard" replace />}
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
