import { AuthGuard } from "@/components/auth-guard";
import { Checkout } from "@/features/booking/components/checkout";

export default async function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  return (
    <AuthGuard>
      <Checkout bookingId={bookingId} />
    </AuthGuard>
  );
}
