// TODO (Phase 4): danh sách vé đã đặt, trạng thái, huỷ vé, hiển thị QR
import { AuthGuard } from "@/components/auth-guard";

export default function MyBookingsPage() {
  return (
    <AuthGuard>
      <h1 className="text-2xl font-bold">Vé của tôi</h1>
    </AuthGuard>
  );
}
