// This file redirects to the student app's HostelDetail page
// The main implementation is in apps/student/src/pages/HostelDetail.tsx
// This stub exists for backward compatibility with the root app routing

import { Navigate, useParams } from "react-router-dom";

export default function HostelDetail() {
  const { id } = useParams();

  // Redirect to student app's hostel detail page
  return <Navigate to={`/student/hostel/${id}`} replace />;
}
