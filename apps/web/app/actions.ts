"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database, LocationRow } from "@/lib/types";

const isTemperatureUnit = (value: string): value is "c" | "f" => value === "c" || value === "f";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

type GeocodeResult = {
  admin1?: string;
  country?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
  name: string;
  timezone?: string;
};

type TrackedLocation = {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  timezone: string;
};

type OpenMeteoResponse = {
  current: {
    apparent_temperature: number;
    temperature_2m: number;
    time: string;
    weather_code: number;
    wind_speed_10m: number;
  };
};

type SnapshotInsert = Database["public"]["Tables"]["weather_snapshots"]["Insert"];

const buildRedirect = (message: string) => {
  const params = new URLSearchParams({ message });
  return `/?${params.toString()}`;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const buildLocationSlug = (result: GeocodeResult) =>
  slugify(
    [
      result.name,
      result.admin1,
      result.country_code ?? result.country,
      result.latitude.toFixed(2),
      result.longitude.toFixed(2)
    ]
      .filter(Boolean)
      .join("-")
  );

const findCityByName = async (query: string): Promise<GeocodeResult | null> => {
  const params = new URLSearchParams({
    name: query,
    count: "1",
    language: "en",
    format: "json"
  });

  const response = await fetch(`${GEOCODE_URL}?${params.toString()}`, {
    headers: {
      "User-Agent": "dbs-assignment4-web"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status}`);
  }

  const payload = (await response.json()) as { results?: GeocodeResult[] };
  return payload.results?.[0] ?? null;
};

const getAuthenticatedUser = async () => {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
};

const createAdminClient = () =>
  createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

const toTrackedLocation = (location: LocationRow): TrackedLocation => ({
  id: location.id,
  name: location.name,
  latitude: Number(location.latitude),
  longitude: Number(location.longitude),
  timezone: location.timezone
});

const fetchSnapshot = async (location: TrackedLocation): Promise<SnapshotInsert> => {
  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    current: "temperature_2m,apparent_temperature,wind_speed_10m,weather_code",
    timezone: location.timezone,
    wind_speed_unit: "kmh"
  });

  const response = await fetch(`${OPEN_METEO_URL}?${params.toString()}`, {
    headers: {
      "User-Agent": "dbs-assignment4-web"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo request failed for ${location.name}: ${response.status}`);
  }

  const payload = (await response.json()) as OpenMeteoResponse;

  return {
    location_id: location.id,
    observed_at: payload.current.time,
    temperature_c: payload.current.temperature_2m,
    apparent_temperature_c: payload.current.apparent_temperature,
    wind_speed_kph: payload.current.wind_speed_10m,
    weather_code: payload.current.weather_code,
    source_payload: payload
  };
};

const fetchAndStoreSnapshot = async (supabase: ReturnType<typeof createAdminClient>, location: TrackedLocation) => {
  const snapshot = await fetchSnapshot(location);
  const { error } = await supabase.from("weather_snapshots").insert([snapshot]);

  if (error) {
    throw new Error(error.message);
  }
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
};

export const updatePreferenceAction = async (formData: FormData) => {
  const { supabase, user } = await getAuthenticatedUser();

  const locationId = formData.get("location_id");
  const temperatureUnit = formData.get("temperature_unit");
  const { data: existingPreference, error: existingPreferenceError } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingPreferenceError) {
    throw new Error(existingPreferenceError.message);
  }

  const safeTemperatureUnit =
    typeof temperatureUnit === "string"
      ? isTemperatureUnit(temperatureUnit)
        ? temperatureUnit
        : null
      : existingPreference?.temperature_unit ?? "c";

  if (!safeTemperatureUnit) {
    throw new Error("Invalid temperature unit");
  }

  let safeLocationId: string | null = null;

  if (typeof locationId === "string" && locationId.length > 0) {
    const { data: trackedLocation, error: trackedLocationError } = await supabase
      .from("user_tracked_locations")
      .select("location_id")
      .eq("user_id", user.id)
      .eq("location_id", locationId)
      .maybeSingle();

    if (trackedLocationError) {
      throw new Error(trackedLocationError.message);
    }

    if (!trackedLocation) {
      throw new Error("Invalid location selection");
    }

    safeLocationId = trackedLocation.location_id;
  } else if (locationId === null) {
    safeLocationId = existingPreference?.location_id ?? null;
  }

  const { error } = await supabase.from("user_preferences").upsert({
    user_id: user.id,
    location_id: safeLocationId,
    temperature_unit: safeTemperatureUnit
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
};

export const addTrackedCityAction = async (formData: FormData) => {
  const { supabase, user } = await getAuthenticatedUser();
  const cityName = formData.get("city_name");

  if (typeof cityName !== "string" || cityName.trim().length === 0) {
    redirect(buildRedirect("Enter a city name."));
  }

  const result = await findCityByName(cityName.trim());

  if (!result) {
    redirect(buildRedirect("City not found. Try a more specific name."));
  }

  const slug = buildLocationSlug(result);
  const displayName = [result.name, result.admin1, result.country].filter(Boolean).join(", ");

  const { data: existingLocation, error: existingLocationError } = await supabase
    .from("tracked_locations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (existingLocationError) {
    throw new Error(existingLocationError.message);
  }

  let locationId = existingLocation?.id ?? null;
  let locationRecord = existingLocation;

  if (!locationId) {
    const { data: createdLocation, error: createdLocationError } = await supabase
      .from("tracked_locations")
      .insert({
        slug,
        name: displayName,
        latitude: Number(result.latitude.toFixed(4)),
        longitude: Number(result.longitude.toFixed(4)),
        timezone: result.timezone ?? "auto"
      })
      .select("*")
      .single();

    if (createdLocationError) {
      throw new Error(createdLocationError.message);
    }

    locationId = createdLocation.id;
    locationRecord = createdLocation;
  }

  const { data: existingSavedCity, error: existingSavedCityError } = await supabase
    .from("user_tracked_locations")
    .select("location_id")
    .eq("user_id", user.id)
    .eq("location_id", locationId)
    .maybeSingle();

  if (existingSavedCityError) {
    throw new Error(existingSavedCityError.message);
  }

  if (!existingSavedCity) {
    const { error: savedCityError } = await supabase.from("user_tracked_locations").insert({
      user_id: user.id,
      location_id: locationId
    });

    if (savedCityError) {
      throw new Error(savedCityError.message);
    }
  }

  const { data: existingPreference, error: existingPreferenceError } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingPreferenceError) {
    throw new Error(existingPreferenceError.message);
  }

  if (!existingPreference?.location_id) {
    const { error: preferenceError } = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      location_id: locationId,
      temperature_unit: existingPreference?.temperature_unit ?? "c"
    });

    if (preferenceError) {
      throw new Error(preferenceError.message);
    }
  }

  if (!existingSavedCity && locationRecord) {
    try {
      await fetchAndStoreSnapshot(createAdminClient(), toTrackedLocation(locationRecord));
    } catch (error) {
      console.error(`Initial weather fetch failed for ${locationRecord.name}:`, error);
    }
  }

  revalidatePath("/");
};

export const removeTrackedCityAction = async (formData: FormData) => {
  const { supabase, user } = await getAuthenticatedUser();
  const locationId = formData.get("location_id");

  if (typeof locationId !== "string" || locationId.length === 0) {
    throw new Error("Missing location id");
  }

  const { error: deleteError } = await supabase
    .from("user_tracked_locations")
    .delete()
    .eq("user_id", user.id)
    .eq("location_id", locationId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const [{ data: preference, error: preferenceError }, { data: remainingCities, error: remainingCitiesError }] =
    await Promise.all([
      supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_tracked_locations").select("location_id").eq("user_id", user.id).order("created_at")
    ]);

  if (preferenceError) {
    throw new Error(preferenceError.message);
  }

  if (remainingCitiesError) {
    throw new Error(remainingCitiesError.message);
  }

  if (preference?.location_id === locationId) {
    const { error: updateError } = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      location_id: remainingCities?.[0]?.location_id ?? null,
      temperature_unit: preference.temperature_unit
    });

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  revalidatePath("/");
};
