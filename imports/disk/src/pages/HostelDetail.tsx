import { useParams } from "react-router-dom";

export default function HostelDetail() {
  const { id } = useParams();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Hostel Details</h1>
        <p className="text-muted-foreground mb-8">Viewing hostel with ID: {id}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center">
            <span className="text-slate-400">Hostel Image</span>
          </div>
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">About this Hostel</h2>
            <p className="text-muted-foreground">Detailed information about the hostel will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
