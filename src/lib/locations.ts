import { createAdminClient } from "@/lib/supabase/admin";

export interface CityRow {
  id: string;
  state_id: string;
  name: string;
  display_order: number;
}

export interface StateRow {
  id: string;
  name: string;
  code: string;
  display_order: number;
  cities?: CityRow[];
}

export async function getStatesWithCities(): Promise<StateRow[]> {
  const adminClient = createAdminClient();
  const { data: states, error } = await adminClient
    .from("states")
    .select(`
      id,
      name,
      code,
      display_order,
      cities (
        id,
        state_id,
        name,
        display_order
      )
    `)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !states) {
    console.error("Failed to load locations from database", error);
    return [];
  }

  // Sort nested cities by display_order
  return states.map((state: any) => ({
    ...state,
    cities: (state.cities || []).sort(
      (a: CityRow, b: CityRow) => a.display_order - b.display_order
    ),
  }));
}
