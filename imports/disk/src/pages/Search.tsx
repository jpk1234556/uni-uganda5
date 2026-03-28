import { Search as SearchIcon } from "lucide-react";

export default function Search() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Search Hostels</h1>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name, university, or location..."
            className="w-full h-12 pl-10 pr-4 rounded-full border bg-background"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Placeholder for results */}
        <p className="col-span-full text-center text-muted-foreground py-12">
          Start searching to find your next home.
        </p>
      </div>
    </div>
  );
}
