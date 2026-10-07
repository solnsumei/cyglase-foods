import { requireVendor } from "@/lib/vendor";
import VendorSettingsClient from "./VendorSettingsClient";
import { redirect } from "next/navigation";
import { getStatesWithCities } from "@/lib/locations";

export const dynamic = "force-dynamic";

export default async function VendorSettingsPage() {
  const { vendor } = await requireVendor();

  if (!vendor) {
    redirect("/vendor/onboarding");
  }

  const locationStates = await getStatesWithCities();

  return <VendorSettingsClient vendor={vendor} locationStates={locationStates} />;
}

