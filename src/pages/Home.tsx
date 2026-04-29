import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, Shield, Star, Building2 } from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";
import { appRoutes } from "@/lib/routes";

export default function Home() {
  return (
    <div className="flex flex-col gap-20 pb-16">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=2000"
            alt="Hostel"
            className="h-full w-full object-cover brightness-[0.55]"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/70 to-background" />

        <div className="container relative z-10 px-4 py-16 md:py-24 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-3xl text-left text-white">
              <BrandMark className="mb-6 text-white" compact />
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                Trusted hostel discovery
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl lg:text-7xl">
                Find your perfect student home in Uganda.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
                Discover verified hostels near your university with clearer
                listings, better filters, and a cleaner path to booking.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to={appRoutes.search}>
                  <Button size="lg" className="h-12 px-8 text-base">
                    Start searching
                  </Button>
                </Link>
                <Link to={`${appRoutes.auth}?mode=signup`}>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-12 px-8 text-base"
                  >
                    Register as student
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/8 p-4 shadow-2xl shadow-slate-950/30 backdrop-blur md:p-6">
              {[
                "Verified hostel listings",
                "Clear prices and amenities",
                "Quick search by university",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-4 text-sm text-white"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary-foreground">
                    <Building2 className="h-5 w-5 text-amber-300" />
                  </div>
                  <span className="leading-6">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Why choose Uni-Nest?
          </h2>
          <p className="mt-3 text-muted-foreground leading-7">
            We make finding a hostel simple, secure, and much easier to scan on
            mobile and desktop.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Verified hostels</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              All hostels on our platform are manually verified for safety and
              quality standards.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Easy discovery</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Filter by university, price, and amenities to find exactly what
              you need.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Student reviews</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Read honest reviews from fellow students to make an informed
              decision.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4 md:gap-8">
            <div>
              <div className="mb-2 text-4xl font-semibold text-primary">
                500+
              </div>
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Verified hostels
              </div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-semibold text-primary">
                10k+
              </div>
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Happy students
              </div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-semibold text-primary">
                15+
              </div>
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Universities
              </div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-semibold text-primary">
                24/7
              </div>
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Support
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
