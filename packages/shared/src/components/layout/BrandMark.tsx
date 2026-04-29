import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";

interface BrandMarkProps {
  className?: string;
  compact?: boolean;
}

export default function BrandMark({
  className = "",
  compact = false,
}: BrandMarkProps) {
  return (
    <Link to="/" className={`inline-flex items-center gap-3 ${className}`}>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-amber-500 text-primary-foreground shadow-lg shadow-primary/20">
        <Building2 className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Uni-Nest
        </span>
        {!compact && (
          <span className="text-xs font-medium text-muted-foreground">
            Verified hostels for students
          </span>
        )}
      </span>
    </Link>
  );
}
