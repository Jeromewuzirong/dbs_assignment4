"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/browser";
import { formatTemperature, formatWeatherCode, type WeatherSnapshotRow, type TemperatureUnit } from "@/lib/types";

type WeatherDashboardProps = {
  initialSnapshot: WeatherSnapshotRow | null;
  locationId: string | null;
  locationName: string | null;
  unit: TemperatureUnit;
};

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

export const WeatherDashboard = ({ initialSnapshot, locationId, locationName, unit }: WeatherDashboardProps) => {
  const [snapshot, setSnapshot] = useState<WeatherSnapshotRow | null>(initialSnapshot);

  useEffect(() => {
    if (!locationId) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`weather-${locationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "weather_snapshots",
          filter: `location_id=eq.${locationId}`
        },
        (payload) => {
          setSnapshot(payload.new as WeatherSnapshotRow);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [locationId]);

  const cards = snapshot
    ? [
        {
          label: "Temperature",
          value: formatTemperature(snapshot.temperature_c, unit)
        },
        {
          label: "Feels like",
          value: formatTemperature(snapshot.apparent_temperature_c, unit)
        },
        {
          label: "Wind",
          value: `${Number(snapshot.wind_speed_kph).toFixed(1)} km/h`
        }
      ]
    : [];

  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_20px_80px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Live Dashboard</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-slate-900">
            {locationName ?? "Choose a city"}
          </h2>
          <p className="mt-2 text-slate-600">
            {snapshot ? `Weather updates stream in as the worker writes new rows.` : "Waiting for the worker to write the first snapshot."}
          </p>
        </div>

        {snapshot ? (
          <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800">
            Last update: {formatTimestamp(snapshot.observed_at)}
          </div>
        ) : null}
      </div>

      {snapshot ? (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <article key={card.label} className="rounded-[1.5rem] bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
                <p className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-slate-950">
                  {card.value}
                </p>
              </article>
            ))}
          </div>

          <article className="mt-4 rounded-[1.5rem] bg-slate-950 p-6 text-slate-50">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">Condition</p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
              {formatWeatherCode(snapshot.weather_code)}
            </p>
            <p className="mt-3 text-sm text-slate-300">
              Realtime source: worker insert into Supabase `weather_snapshots`, subscribed in-browser through Supabase Realtime.
            </p>
          </article>
        </>
      ) : (
        <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 p-6 text-slate-600">
          Start the worker after running the SQL migration. Once a weather row is inserted, this panel will populate and update live.
        </div>
      )}
    </section>
  );
};
