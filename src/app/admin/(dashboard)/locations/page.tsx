import { getStatesWithCities } from "@/lib/locations";
import LocationManager from "./LocationManager";

export const dynamic = "force-dynamic";

export default async function AdminLocationsPage() {
  // Load all states and cities (including inactive so admin can manage them)
  const locations = await getStatesWithCities(false);

  return <LocationManager initialLocations={locations} />;
}
