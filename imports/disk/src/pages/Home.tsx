import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, Shield, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=2000"
            alt="Hostel"
            className="w-full h-full object-cover brightness-50"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="container relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Find Your Perfect Student Home in Uganda</h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-slate-200">
            Discover verified hostels near your university. Safe, affordable, and convenient living for students.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                Start Searching
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-8">
                Register as Student
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Uni-Nest?</h2>
          <p className="text-muted-foreground">We make finding a hostel simple and secure.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Verified Hostels</h3>
            <p className="text-muted-foreground">All hostels on our platform are manually verified for safety and quality standards.</p>
          </div>
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Discovery</h3>
            <p className="text-muted-foreground">Filter by university, price, and amenities to find exactly what you need.</p>
          </div>
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Student Reviews</h3>
            <p className="text-muted-foreground">Read honest reviews from fellow students to make an informed decision.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Verified Hostels</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10k+</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Happy Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">15+</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Universities</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Support</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
