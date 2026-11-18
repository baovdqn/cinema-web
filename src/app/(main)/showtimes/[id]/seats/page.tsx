// TODO (Phase 3): sơ đồ ghế + tóm tắt đơn + nút "Tiếp tục" -> tạo booking -> /checkout/[bookingId]
import { AuthGuard } from "@/components/auth-guard";

export default async function SeatSelectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AuthGuard>
      <h1 className="text-2xl font-bold">Chọn ghế — suất #{id}</h1>
    </AuthGuard>
  );
}
