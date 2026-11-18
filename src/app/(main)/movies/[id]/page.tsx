// TODO (Phase 2): chi tiết phim (poster, mô tả, trailer) + chọn ngày + list suất chiếu theo rạp
export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <h1 className="text-2xl font-bold">Chi tiết phim #{id}</h1>;
}
