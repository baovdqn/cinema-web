import { CinemaRooms } from "@/features/admin/components/cinema-rooms";

export default async function AdminCinemaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CinemaRooms cinemaId={Number(id)} />;
}
