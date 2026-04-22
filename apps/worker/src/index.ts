import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv({
  path: path.resolve(__dirname, "../.env.local"),
  override: false
});

const [{ config }, { fetchAndStoreSnapshot }, { supabase }] = await Promise.all([
  import("./config.js"),
  import("./weatherSnapshots.js"),
  import("./supabase.js")
]);

type TrackedLocation = {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  timezone: string;
};

const loadTrackedLocations = async (): Promise<TrackedLocation[]> => {
  const { data: trackedRows, error: trackedRowsError } = await supabase.from("user_tracked_locations").select("location_id");

  if (trackedRowsError) {
    throw trackedRowsError;
  }

  const locationIds = [...new Set((trackedRows ?? []).map((row) => row.location_id))];

  if (locationIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("tracked_locations")
    .select("id, name, latitude, longitude, timezone")
    .in("id", locationIds)
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    ...row,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude)
  }));
};

const pollOnce = async () => {
  const startedAt = new Date().toISOString();
  console.log(`[${startedAt}] Starting weather poll`);

  const locations = await loadTrackedLocations();

  if (locations.length === 0) {
    console.log("No tracked locations found. Nothing to poll.");
    return;
  }

  const results = await Promise.allSettled(locations.map((location) => fetchAndStoreSnapshot(supabase, location)));
  let successfulSnapshots = 0;

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successfulSnapshots += 1;
      return;
    }

    console.error(`Failed to fetch ${locations[index]?.name ?? "unknown location"}:`, result.reason);
  });

  console.log(`Stored ${successfulSnapshots} weather snapshots`);
};

const main = async () => {
  await pollOnce();

  setInterval(() => {
    void pollOnce().catch((error) => {
      console.error("Polling iteration failed:", error);
    });
  }, config.pollIntervalMs);
};

void main().catch((error) => {
  console.error("Worker failed to start:", error);
  process.exit(1);
});
