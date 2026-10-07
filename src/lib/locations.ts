import { createAdminClient } from "@/lib/supabase/admin";

export interface CityRow {
  id: string;
  state_id: string;
  name: string;
  is_active: boolean;
  display_order: number;
}

export interface StateRow {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  display_order: number;
  cities?: CityRow[];
}

export async function getStatesWithCities(onlyActive = true): Promise<StateRow[]> {
  const adminClient = createAdminClient();
  let query = adminClient
    .from("states")
    .select(`
      id,
      name,
      code,
      is_active,
      display_order,
      cities (
        id,
        state_id,
        name,
        is_active,
        display_order
      )
    `)
    .order("display_order", { ascending: true });

  if (onlyActive) {
    query = query.eq("is_active", true);
  }

  const { data: states, error } = await query;

  if (error || !states) {
    console.error("Failed to load locations from database", error);
    return [];
  }

  // Sort nested cities by display_order
  return states.map((state: any) => ({
    ...state,
    cities: (state.cities || [])
      .filter((c: any) => (!onlyActive ? true : c.is_active))
      .sort((a: CityRow, b: CityRow) => a.display_order - b.display_order),
  }));
}

/**
 * When a vendor registers, onboards, or updates their settings with an area
 * that isn't already in the database, automatically insert it into public.cities!
 */
export async function ensureCityExists(stateName: string, cityName: string): Promise<void> {
  const sName = stateName?.trim();
  const cName = cityName?.trim();
  if (!sName || !cName) return;

  const adminClient = createAdminClient();

  try {
    // 1. Find the state (case-insensitive)
    let { data: state } = await adminClient
      .from("states")
      .select("id, name")
      .ilike("name", sName)
      .maybeSingle();

    // If state doesn't exist, create it dynamically
    if (!state) {
      const code = sName.slice(0, 3).toUpperCase();
      const { data: newState, error: stateError } = await adminClient
        .from("states")
        .insert({
          name: sName,
          code,
          is_active: true,
          display_order: 50,
        })
        .select("id, name")
        .single();

      if (stateError) {
        console.error("Error auto-creating state:", stateError);
        return;
      }
      state = newState;
    }

    if (!state) return;

    // 2. Check if city already exists in this state (case-insensitive)
    const { data: existingCity } = await adminClient
      .from("cities")
      .select("id")
      .eq("state_id", state.id)
      .ilike("name", cName)
      .maybeSingle();

    // 3. If city doesn't exist, insert it!
    if (!existingCity) {
      const { error: cityInsertError } = await adminClient.from("cities").insert({
        state_id: state.id,
        name: cName,
        is_active: true,
        display_order: 50,
      });

      if (cityInsertError) {
        console.error("Error auto-creating city:", cityInsertError);
      } else {
        console.log(`Auto-created new city/area "${cName}" under state "${sName}".`);
      }
    }
  } catch (err) {
    console.error("Error in ensureCityExists:", err);
  }
}
