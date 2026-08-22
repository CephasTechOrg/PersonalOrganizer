import { Suspense } from "react";
import { OpportunitiesView } from "@/ui/opportunities/OpportunitiesView";

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={null}>
      <OpportunitiesView />
    </Suspense>
  );
}
