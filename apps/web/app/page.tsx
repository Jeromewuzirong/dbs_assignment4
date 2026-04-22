import { redirect } from "next/navigation";

import { AuthButton } from "@/components/auth-button";
import { PreferencesForm } from "@/components/preferences-form";
import { WeatherDashboard } from "@/components/weather-dashboard";
import { getDashboardData } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

type HomePageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { latestSnapshot, locations, selectedLocation, temperatureUnit } = await getDashboardData(user.id);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Week 4 Realtime System</p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Weather Report
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              The worker polls live weather, writes snapshots into Supabase, and this page updates over Realtime
              without a refresh.
            </p>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-[1.5rem] bg-slate-950 p-5 text-slate-50">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-amber-300">Signed in as</p>
              <p className="mt-3 text-lg font-medium">{user.email}</p>
            </div>
            <AuthButton />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <PreferencesForm
          locations={locations}
          message={resolvedSearchParams?.message ?? null}
          selectedLocationId={selectedLocation?.id ?? null}
          temperatureUnit={temperatureUnit}
        />
        <WeatherDashboard
          key={`${selectedLocation?.id ?? "none"}-${temperatureUnit}`}
          initialSnapshot={latestSnapshot}
          locationId={selectedLocation?.id ?? null}
          locationName={selectedLocation?.name ?? null}
          unit={temperatureUnit}
        />
      </section>
    </main>
  );
}
