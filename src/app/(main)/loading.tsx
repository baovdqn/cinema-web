import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

export default function MainLoading() {
  return (
    <div role="status" aria-label="Đang tải" className="space-y-4">
      <Skeleton className="h-64 w-full" />
      <div className="flex justify-center py-4">
        <Spinner />
      </div>
    </div>
  );
}
