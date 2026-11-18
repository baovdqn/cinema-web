import { AuthGuard } from "@/components/auth-guard";
import { SeatSelection } from "@/features/booking/components/seat-selection";

export default async function SeatSelectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AuthGuard>
      <SeatSelection showtimeId={id} />
    </AuthGuard>
  );
}
