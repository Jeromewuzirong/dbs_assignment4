import { createClient } from "@/lib/supabase/server";
import type { LocationRow, TemperatureUnit, UserPreferenceRow, WeatherSnapshotRow } from "@/lib/types";

type DashboardData = {
  latestSnapshot: WeatherSnapshotRow | null;
  locations: LocationRow[];
  selectedLocation: LocationRow | null;
  temperatureUnit: TemperatureUnit;
  userPreference: UserPreferenceRow | null;
};

export const getDashboardData = async (userId: string): Promise<DashboardData> => {
  const supabase = await createClient();

  const [{ data: locations, error: locationsError }, { data: userPreference, error: userPreferenceError }] = await Promise.all([
    supabase.from("tracked_locations").select("*").order("name"),
    supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle()
  ]);

  if (locationsError) {
    throw new Error(locationsError.message);
  }

  if (userPreferenceError) {
    throw new Error(userPreferenceError.message);
  }

  const safeLocations = locations ?? [];
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
