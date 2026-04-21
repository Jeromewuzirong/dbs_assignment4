import { updatePreferenceAction } from "@/app/actions";
import type { LocationRow, TemperatureUnit } from "@/lib/types";

type PreferencesFormProps = {
  locations: LocationRow[];
  selectedLocationId: string | null;
  temperatureUnit: TemperatureUnit;
};

export const PreferencesForm = ({ locations, selectedLocationId, temperatureUnit }: PreferencesFormProps) => {
  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_20px_80px_rgba(15,23,42,0.06)] backdrop-blur">
      <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Preferences</p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-slate-900">
        Choose what you follow
      </h2>

      <form action={updatePreferenceAction} className="mt-6 space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">City</span>
          <select
            name="location_id"
            defaultValue={selectedLocationId ?? locations[0]?.id ?? ""}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)]"
          >
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-slate-700">Temperature unit</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3">
              <input type="radio" name="temperature_unit" value="c" defaultChecked={temperatureUnit === "c"} />
              <span>Celsius</span>
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3">
              <input type="radio" name="temperature_unit" value="f" defaultChecked={temperatureUnit === "f"} />
              <span>Fahrenheit</span>
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Save preferences
        </button>
      </form>
    </section>
  );
};
