import { createClient } from "@/lib/supabase/server";
import type { LocationRow, TemperatureUnit, UserPreferenceRow, UserTrackedLocationRow, WeatherSnapshotRow } from "@/lib/types";

type DashboardData = {
  latestSnapshot: WeatherSnapshotRow | null;
  locations: LocationRow[];
  selectedLocation: LocationRow | null;
  temperatureUnit: TemperatureUnit;
  userPreference: UserPreferenceRow | null;
};

const seedDefaultLocations = async (userId: string) => {
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("user_tracked_locations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const { data: defaults, error: defaultsError } = await supabase.from("tracked_locations").select("id").order("name").limit(4);

  if (defaultsError) {
    throw new Error(defaultsError.message);
  }

  if (!defaults || defaults.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("user_tracked_locations").insert(
    defaults.map((location) => ({
      user_id: userId,
      location_id: location.id
    }))
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
};

export const getDashboardData = async (userId: string): Promise<DashboardData> => {
  const supabase = await createClient();
  await seedDefaultLocations(userId);

  const [{ data: trackedRows, error: trackedRowsError }, { data: userPreference, error: userPreferenceError }] = await Promise.all([
    supabase.from("user_tracked_locations").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle()
  ]);

  if (trackedRowsError) {
    throw new Error(trackedRowsError.message);
  }

  if (userPreferenceError) {
    throw new Error(userPreferenceError.message);
  }

  const locationIds = (trackedRows ?? []).map((row: UserTrackedLocationRow) => row.location_id);
  let safeLocations: LocationRow[] = [];

  if (locationIds.length > 0) {
    const { data: locations, error: locationsError } = await supabase.from("tracked_locations").select("*").in("id", locationIds);

    if (locationsError) {
      throw new Error(locationsError.message);
    }

    const locationsById = new Map((locations ?? []).map((location) => [location.id, location]));
    safeLocations = locationIds
      .map((locationId) => locationsById.get(locationId))
      .filter((location): location is LocationRow => Boolean(location));
  }

  const selectedLocation =
    safeLocations.find((location) => location.id === userPreference?.location_id) ?? safeLocations[0] ?? null;

  let latestSnapshot: WeatherSnapshotRow | null = null;

  if (selectedLocation) {
    const { data, error } = await supabase
      .from("weather_snapshots")
      .select("*")
      .eq("location_id", selectedLocation.id)
      .order("observed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    latestSnapshot = data;
  }

  return {
    locations: safeLocations,
    selectedLocation,
    latestSnapshot,
    temperatureUnit: userPreference?.temperature_unit ?? "c",
    userPreference
  };
};
