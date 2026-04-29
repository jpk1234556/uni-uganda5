import { Search as SearchIcon, Filter, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BrandMark from "@/components/layout/BrandMark";
import { appRoutes } from "@/lib/routes";

export default function Search() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-col gap-6 rounded-3xl border border-border/60 bg-card p-6 shadow-sm md:p-8">
          <BrandMark compact />
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Search smarter
              </span>
              <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                Find a hostel that feels easy to trust.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                Search by university, location, or name. The interface is tuned
                for quick scanning, with clear spacing and no cramped copy.
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl bg-slate-950 p-4 text-sm text-slate-200 shadow-lg shadow-slate-950/20 md:grid-cols-3 lg:grid-cols-1">
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                <MapPin className="h-4 w-4 text-amber-300" />
                <span>University-focused filters</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                <Filter className="h-4 w-4 text-amber-300" />
                <span>Cleaner results layout</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                <SearchIcon className="h-4 w-4 text-amber-300" />
                <span>Faster hostel discovery</span>
              </div>
            </div>
          </div>

          <Card className="border-border/60 shadow-none">
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
                <div className="relative">
                  <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, university, or location..."
                    className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="University or area"
                    className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <Link to={appRoutes.search}>
                  <Button className="h-12 px-6">Search hostels</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground md:col-span-2 lg:col-span-3">
            Start searching to find your next home.
          </div>
        </div>
      </div>
    </div>
  );
}
