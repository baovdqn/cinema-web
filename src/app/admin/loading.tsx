import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

export default function AdminLoading() {
  return (
    <div role="status" aria-label="Đang tải" className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 w-full" />
      <div className="flex justify-center py-4">
        <Spinner />
      </div>
    </div>
  );
}
