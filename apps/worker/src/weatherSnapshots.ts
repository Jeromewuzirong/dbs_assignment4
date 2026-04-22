import type { TrackedLocation } from "./openMeteo.js";
import { fetchSnapshot, type SnapshotInsert } from "./openMeteo.js";

type SnapshotWriter = {
  from: (table: "weather_snapshots") => {
    insert: (values: SnapshotInsert[]) => unknown;
  };
};

export const storeSnapshots = async (supabase: SnapshotWriter, snapshots: SnapshotInsert[]) => {
  if (snapshots.length === 0) {
    return;
  }

  const { error } = (await supabase.from("weather_snapshots").insert(snapshots)) as {
    error: {
      message: string;
    } | null;
  };

  if (error) {
    throw new Error(error.message);
  }
};

export const fetchAndStoreSnapshot = async (supabase: SnapshotWriter, location: TrackedLocation) => {
  const snapshot = await fetchSnapshot(location);
  await storeSnapshots(supabase, [snapshot]);
  return snapshot;
};
