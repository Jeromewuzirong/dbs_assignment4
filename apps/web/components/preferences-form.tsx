import { addTrackedCityAction, removeTrackedCityAction, updatePreferenceAction } from "@/app/actions";
import type { LocationRow, TemperatureUnit } from "@/lib/types";

type PreferencesFormProps = {
  locations: LocationRow[];
  message?: string | null;
  selectedLocationId: string | null;
  temperatureUnit: TemperatureUnit;
};

export const PreferencesForm = ({ locations, message, selectedLocationId, temperatureUnit }: PreferencesFormProps) => {
  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_20px_80px_rgba(15,23,42,0.06)] backdrop-blur">
      <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Preferences</p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-slate-900">
        Choose what you follow
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Save cities and choose the dashboard focus.</p>

      <form action={addTrackedCityAction} className="mt-6 space-y-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Add a city</span>
          <input
            required
            type="text"
            name="city_name"
            placeholder="Chicago"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)]"
          />
        </label>
        <button
          type="submit"
          className="inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99] focus-visible:bg-slate-800"
        >
          Add city
        </button>
      </form>

      {message ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</p>
      ) : null}

      <div className="mt-6 space-y-3">
        <p className="text-sm font-medium text-slate-700">Saved cities</p>
        {locations.length > 0 ? (
          <div className="space-y-2">
            {locations.map((location) => (
              <div
                key={location.id}
                className={`flex items-center justify-between gap-3 rounded-[1.25rem] border px-4 py-3 transition ${
                  location.id === selectedLocationId
                    ? "border-[var(--accent)] bg-emerald-50 shadow-[0_10px_30px_rgba(15,118,110,0.12)]"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <form action={updatePreferenceAction}>
                    <input type="hidden" name="location_id" value={location.id} />
                    <button
                      type="submit"
                      className="w-full cursor-pointer text-left"
                      aria-current={location.id === selectedLocationId ? "true" : undefined}
                    >
                      <p className="text-sm font-semibold text-slate-900">{location.name}</p>
                      {location.id === selectedLocationId ? (
                        <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Active</p>
                      ) : (
                        <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Select</p>
                      )}
                    </button>
                  </form>
                </div>
                <form action={removeTrackedCityAction}>
                  <input type="hidden" name="location_id" value={location.id} />
                  <button
                    type="submit"
                    className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] focus-visible:bg-slate-100 focus-visible:text-slate-900"
                  >
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-sm leading-6 text-slate-600">
            No saved cities yet. Add one above to start polling weather for your account.
          </p>
        )}
      </div>

      <div className="mt-6 space-y-5">
        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-slate-700">Temperature unit</legend>
          <div className="grid grid-cols-2 gap-3">
            <form action={updatePreferenceAction}>
              <input type="hidden" name="location_id" value={selectedLocationId ?? ""} />
              <input type="hidden" name="temperature_unit" value="c" />
              <button
                type="submit"
                aria-pressed={temperatureUnit === "c"}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99] ${
                  temperatureUnit === "c"
                    ? "border-[var(--accent)] bg-emerald-50 text-slate-900 shadow-[0_10px_30px_rgba(15,118,110,0.12)]"
                    : "border-slate-300 bg-white text-slate-700 hover:border-[var(--accent)] hover:bg-emerald-50/40"
                }`}
              >
                <span className="text-sm font-semibold">Celsius</span>
              </button>
            </form>
            <form action={updatePreferenceAction}>
              <input type="hidden" name="location_id" value={selectedLocationId ?? ""} />
              <input type="hidden" name="temperature_unit" value="f" />
              <button
                type="submit"
                aria-pressed={temperatureUnit === "f"}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99] ${
                  temperatureUnit === "f"
                    ? "border-[var(--accent)] bg-emerald-50 text-slate-900 shadow-[0_10px_30px_rgba(15,118,110,0.12)]"
                    : "border-slate-300 bg-white text-slate-700 hover:border-[var(--accent)] hover:bg-emerald-50/40"
                }`}
              >
                <span className="text-sm font-semibold">Fahrenheit</span>
              </button>
            </form>
          </div>
        </fieldset>
      </div>
    </section>
  );
};
