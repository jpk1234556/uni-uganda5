import { useAuth } from "@/context/AuthContext";

export default function StudentDashboard() {
  const { dbUser } = useAuth();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Student Dashboard</h1>
        <p className="text-muted-foreground mb-8">Welcome back, {dbUser?.first_name}!</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
            <h3 className="text-xl font-semibold mb-2">My Bookings</h3>
            <p className="text-muted-foreground">Manage your hostel bookings.</p>
          </div>
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
            <h3 className="text-xl font-semibold mb-2">My Profile</h3>
            <p className="text-muted-foreground">Update your personal information.</p>
          </div>
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Saved Hostels</h3>
            <p className="text-muted-foreground">View hostels you've saved for later.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
