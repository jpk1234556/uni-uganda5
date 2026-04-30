import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import studentBackground from "../../../images/e0901fce5aa5c561965db8d07c519a71.jpg";
import { Toaster } from "sonner";

const Home = lazy(() => import("./pages/Home"));
const Search = lazy(() => import("./pages/Search"));
const HostelDetail = lazy(() => import("./pages/HostelDetail"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const Roommates = lazy(() => import("./pages/Roommates"));
const Auth = lazy(() => import("@/pages/Auth"));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="relative flex flex-col min-h-screen">
          <div
            className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${studentBackground})` }}
            aria-hidden="true"
          />
          <div
            className="fixed inset-0 -z-10 bg-gradient-to-b from-white/90 via-white/86 to-slate-100/86"
            aria-hidden="true"
          />
          <Navbar />
          <main className="flex-grow">
            <Suspense
              fallback={
                <div className="container mx-auto px-4 py-16 text-center text-slate-500">
                  Loading page...
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth appType="student" />} />
                <Route path="/search" element={<Search />} />
                <Route path="/roommates" element={<Roommates />} />
                <Route path="/hostel/:id" element={<HostelDetail />} />
                <Route
                  path="/student/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <Toaster position="top-center" richColors />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
