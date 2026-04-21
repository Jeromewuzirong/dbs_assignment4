import "dotenv/config";

import { config } from "./config.js";
import { fetchSnapshot, type SnapshotInsert } from "./openMeteo.js";
import { supabase } from "./supabase.js";

type TrackedLocation = {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  timezone: string;
};

const loadTrackedLocations = async (): Promise<TrackedLocation[]> => {
  const { data, error } = await supabase
    .from("tracked_locations")
    .select("id, name, latitude, longitude, timezone")
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

const storeSnapshots = async (snapshots: SnapshotInsert[]) => {
  if (snapshots.length === 0) {
    return;
  }

  const { error } = await supabase.from("weather_snapshots").insert(snapshots);

  if (error) {
    throw error;
  }
};

const pollOnce = async () => {
  const startedAt = new Date().toISOString();
  console.log(`[${startedAt}] Starting weather poll`);

  const locations = await loadTrackedLocations();

  if (locations.length === 0) {
    console.log("No tracked locations found. Nothing to poll.");
    return;
  }

  const results = await Promise.allSettled(locations.map((location) => fetchSnapshot(location)));
  const successfulSnapshots: SnapshotInsert[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successfulSnapshots.push(result.value);
      return;
    }

    console.error(`Failed to fetch ${locations[index]?.name ?? "unknown location"}:`, result.reason);
  });

  await storeSnapshots(successfulSnapshots);
  console.log(`Stored ${successfulSnapshots.length} weather snapshots`);
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
