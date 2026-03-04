import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import Roommates from "@/pages/Roommates";
import Auth from "@/pages/Auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-background text-foreground animate-in fade-in duration-500">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/roommates" element={<Roommates />} />
            <Route path="/hostel/:id" element={<HostelDetail />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
