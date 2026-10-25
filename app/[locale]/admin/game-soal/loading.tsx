import { AdminTablePageSkeleton } from "@/components/skeletons/admin";

export default function Loading() {
  return (
    <AdminTablePageSkeleton
      columns={6}
      rows={6}
      stats={2}
      filterColumns="md:grid-cols-[1fr_auto]"
      filterInputs={2}
    />
  );
}
