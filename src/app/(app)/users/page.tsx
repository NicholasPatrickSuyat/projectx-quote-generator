import { UsersView } from "@/components/users/users-view";
import { UsersCapabilityGate } from "@/components/users/users-capability-gate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users",
};

export default function UsersPage() {
  return (
    <UsersCapabilityGate>
      <UsersView />
    </UsersCapabilityGate>
  );
}
