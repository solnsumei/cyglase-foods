import { requireVendor } from "@/lib/vendor";
import VendorSettingsClient from "./VendorSettingsClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VendorSettingsPage() {
  const { vendor } = await requireVendor();

  if (!vendor) {
    redirect("/vendor/onboarding");
  }

  return <VendorSettingsClient vendor={vendor} />;
}
