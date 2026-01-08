import { Suspense } from "react";
import CompleteProfileClient from "./CompleteProfileClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <CompleteProfileClient />
    </Suspense>
  );
}
