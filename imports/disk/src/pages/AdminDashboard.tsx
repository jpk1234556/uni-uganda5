import { useAuth } from "@/context/AuthContext";

export default function AdminDashboard() {
  const { dbUser } = useAuth();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">Welcome back, {dbUser?.first_name}!</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
            <h3 className="text-xl font-semibold mb-2">User Management</h3>
            <p className="text-muted-foreground">Manage students and owners.</p>
          </div>
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Hostel Verification</h3>
            <p className="text-muted-foreground">Review and approve new hostels.</p>
          </div>
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
            <h3 className="text-xl font-semibold mb-2">System Reports</h3>
            <p className="text-muted-foreground">View overall platform performance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
