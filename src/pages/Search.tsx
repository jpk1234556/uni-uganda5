import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Filter,
  MapPin,
  Search as SearchIcon,
  ShieldCheck,
  Sparkles,
  Star,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BrandMark from "@/components/layout/BrandMark";
import { appRoutes } from "@/lib/routes";

const hostelOptions = [
  {
    id: "makerere-garden",
    name: "Makerere Garden Hostel",
    university: "Makerere University",
    area: "Wandegeya",
    price: "UGX 550k - 850k",
    rating: 4.8,
    verified: true,
    status: "Available now",
    description:
      "Quiet rooms, strong Wi-Fi, and an easy walk to campus with 24/7 security.",
    amenities: ["Wi-Fi", "Security", "Study space"],
  },
  {
    id: "kyu-hub",
    name: "Kyambogo Hub Residency",
    university: "Kyambogo University",
    area: "Kyambogo",
    price: "UGX 420k - 700k",
    rating: 4.6,
    verified: true,
    status: "Fast booking",
    description:
      "Balanced budget rooms with private bathrooms and reliable water supply.",
    amenities: ["Water tank", "Caretaker", "Laundry"],
  },
  {
    id: "mubs-stay",
    name: "MUBS Stay Point",
    university: "Makerere University Business School",
    area: "Nakawa",
    price: "UGX 380k - 620k",
    rating: 4.5,
    verified: true,
    status: "Popular choice",
    description:
      "Practical rooms near lecture halls with social spaces and solid access roads.",
    amenities: ["Parking", "Wi-Fi", "Near campus"],
  },
  {
    id: "ucu-reserve",
    name: "UCU Reserve House",
    university: "Uganda Christian University",
    area: "Mukono",
    price: "UGX 300k - 540k",
    rating: 4.7,
    verified: false,
    status: "New listing",
    description:
      "A calm option for students who want a quieter environment and lower rent.",
    amenities: ["Quiet zone", "Kitchen", "Study desk"],
  },
];

export default function Search() {
  const [query, setQuery] = useState("");
  const [university, setUniversity] = useState("all");

  const results = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();

    return hostelOptions.filter((hostel) => {
      const matchesUniversity =
        university === "all" || hostel.university === university;
      const matchesQuery =
        searchTerm.length === 0 ||
        [hostel.name, hostel.university, hostel.area, hostel.description]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm);

      return matchesUniversity && matchesQuery;
    });
  }, [query, university]);

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
                Search by university, location, or name, then compare verified
                options without losing context.
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
                <ShieldCheck className="h-4 w-4 text-amber-300" />
                <span>Verified hostels first</span>
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
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by name, university, or location..."
                    className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={university}
                    onChange={(event) => setUniversity(event.target.value)}
                    className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">All universities</option>
                    <option value="Makerere University">Makerere University</option>
                    <option value="Kyambogo University">Kyambogo University</option>
                    <option value="Makerere University Business School">
                      Makerere University Business School
                    </option>
                    <option value="Uganda Christian University">
                      Uganda Christian University
                    </option>
                  </select>
                </div>
                <Button className="h-12 px-6" type="button">
                  Browse matches
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              Available hostels
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {results.length} result{results.length === 1 ? "" : "s"} based on your filters.
            </p>
          </div>
          <Link
            to={appRoutes.auth}
            className="hidden items-center gap-2 text-sm font-medium text-primary transition hover:text-primary/80 md:inline-flex"
          >
            Save favorites later <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background text-muted-foreground">
              <SearchIcon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              No matches found
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Try a broader search term or clear the university filter to see more options.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2">
            {results.map((hostel) => (
              <Card key={hostel.id} className="border-border/60 shadow-sm">
                <CardContent className="space-y-4 p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {hostel.name}
                        </h3>
                        {hostel.verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {hostel.university} · {hostel.area}
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {hostel.rating}
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-muted-foreground">
                    {hostel.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {hostel.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground"
                      >
                        <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {hostel.price}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {hostel.status}
                      </div>
                    </div>

                    <Link to={appRoutes.hostelDetail(hostel.id)}>
                      <Button variant="outline" className="w-full sm:w-auto">
                        View details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
