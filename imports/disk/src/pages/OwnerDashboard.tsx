import { useAuth } from "@/context/AuthContext";

export default function OwnerDashboard() {
  const { dbUser } = useAuth();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Owner Dashboard</h1>
        <p className="text-muted-foreground mb-8">Welcome back, {dbUser?.first_name}!</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
            <h3 className="text-xl font-semibold mb-2">My Hostels</h3>
            <p className="text-muted-foreground">Manage your listed hostels.</p>
          </div>
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Bookings</h3>
            <p className="text-muted-foreground">Manage student bookings for your hostels.</p>
          </div>
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Earnings</h3>
            <p className="text-muted-foreground">View your earnings and reports.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
