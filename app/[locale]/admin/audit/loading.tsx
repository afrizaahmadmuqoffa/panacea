import { AdminTablePageSkeleton } from "@/components/skeletons/admin";

export default function Loading() {
  return (
    <AdminTablePageSkeleton
      columns={5}
      rows={8}
      filterColumns="md:grid-cols-[1fr_auto]"
      filterInputs={2}
      mobileCards={false}
    />
  );
}
