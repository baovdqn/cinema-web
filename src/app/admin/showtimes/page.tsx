import { Suspense } from "react";
import { ShowtimesManager } from "@/features/admin/components/showtimes-manager";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminShowtimesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <ShowtimesManager />
    </Suspense>
  );
}
