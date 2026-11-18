// TODO (Phase 4): tóm tắt booking, countdown giữ ghế (expiresAt), chọn phương thức thanh toán
import { AuthGuard } from "@/components/auth-guard";

export default async function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  return (
    <AuthGuard>
      <h1 className="text-2xl font-bold">Thanh toán — đơn #{bookingId}</h1>
    </AuthGuard>
  );
}
