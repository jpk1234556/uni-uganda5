import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Bookmark,
  CalendarCheck2,
  CheckCircle2,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { appRoutes } from "@/lib/routes";

const dashboardStats = [
  { label: "Saved hostels", value: "08", hint: "2 new this week" },
  { label: "Pending bookings", value: "02", hint: "Awaiting replies" },
  { label: "Profile completeness", value: "84%", hint: "Add a phone number" },
];

const actionItems = [
  {
    title: "Continue browsing",
    description: "Pick up from your latest search and shortlist new hostels.",
    cta: "Open search",
    href: appRoutes.search,
    icon: Search,
  },
  {
    title: "Review saved hostels",
    description: "Revisit the places you liked and compare prices side by side.",
    cta: "View saved",
    href: appRoutes.search,
    icon: Bookmark,
  },
  {
    title: "Check booking status",
    description: "See whether your reservation requests need attention.",
    cta: "Go to bookings",
    href: appRoutes.search,
    icon: CalendarCheck2,
  },
];

const activityFeed = [
  {
    title: "Shortlisted Makerere Garden Hostel",
    detail: "Saved 12 minutes ago · 4.8 rating",
  },
  {
    title: "Booking request sent to Kyambogo Hub",
    detail: "Waiting for hostel owner reply",
  },
  {
    title: "Profile reminder",
    detail: "Add your contact number to improve response time",
  },
];

const savedHostels = [
  {
    name: "Makerere Garden Hostel",
    area: "Wandegeya",
    price: "UGX 550k - 850k",
    rating: 4.8,
  },
  {
    name: "Kyambogo Hub Residency",
    area: "Kyambogo",
    price: "UGX 420k - 700k",
    rating: 4.6,
  },
];

export default function StudentDashboard() {
  const { dbUser } = useAuth();

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="grid gap-6 rounded-3xl border border-border/60 bg-card p-6 shadow-sm lg:grid-cols-[1.4fr_0.9fr] lg:p-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Student workspace
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Welcome back, {dbUser?.first_name || "student"}.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                Use this space to continue searches, track bookings, and finish
                the small tasks that move your housing decision forward.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to={appRoutes.search}>
                <Button className="h-11 px-5">
                  Search hostels <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to={appRoutes.auth}>
                <Button variant="outline" className="h-11 px-5">
                  Complete profile
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl bg-muted/40 p-4">
            <div className="flex items-center justify-between rounded-xl bg-background px-4 py-3 shadow-sm">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Response speed
                </div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  Faster with a complete profile
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground">
              <Bell className="h-4 w-4 text-primary" />
              Booking reminders and updates will appear here.
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {dashboardStats.map((stat) => (
            <Card key={stat.label} className="border-border/60 shadow-sm">
              <CardContent className="space-y-2 p-5">
                <div className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </div>
                <div className="text-3xl font-semibold tracking-tight text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.hint}</div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-4 p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    Next actions
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Clear next steps so the dashboard feels useful, not empty.
                  </p>
                </div>
                <Star className="h-5 w-5 text-amber-500" />
              </div>

              <div className="grid gap-4">
                {actionItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <Link to={item.href} className="sm:self-center">
                        <Button variant="outline" className="w-full sm:w-auto">
                          {item.cta}
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="space-y-4 p-5 md:p-6">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    Recent activity
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A quick summary of what changed since your last visit.
                  </p>
                </div>

                <div className="space-y-3">
                  {activityFeed.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-border/60 bg-muted/30 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-background p-2 shadow-sm">
                          <CalendarCheck2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {item.title}
                          </div>
                          <div className="mt-1 text-sm leading-6 text-muted-foreground">
                            {item.detail}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardContent className="space-y-4 p-5 md:p-6">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    Saved hostels
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Compare your shortlist without starting over.
                  </p>
                </div>

                <div className="space-y-3">
                  {savedHostels.map((hostel) => (
                    <div
                      key={hostel.name}
                      className="rounded-2xl border border-border/60 bg-background p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-foreground">
                            {hostel.name}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {hostel.area}
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {hostel.rating}
                        </div>
                      </div>
                      <div className="mt-3 text-sm font-medium text-foreground">
                        {hostel.price}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
