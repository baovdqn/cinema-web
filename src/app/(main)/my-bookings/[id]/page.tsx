import { AuthGuard } from "@/components/auth-guard";
import { TicketDetail } from "@/features/booking/components/ticket-detail";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AuthGuard>
      <TicketDetail bookingId={id} />
    </AuthGuard>
  );
}
