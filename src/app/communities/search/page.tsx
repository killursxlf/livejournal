import { Suspense } from "react";
import CommunitiesSearchClient from "./CommunitiesSearchClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <CommunitiesSearchClient />
    </Suspense>
  );
}
