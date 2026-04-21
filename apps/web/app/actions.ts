"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const isTemperatureUnit = (value: string): value is "c" | "f" => value === "c" || value === "f";

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
};

export const updatePreferenceAction = async (formData: FormData) => {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const locationId = formData.get("location_id");
  const temperatureUnit = formData.get("temperature_unit");

  if (typeof temperatureUnit !== "string" || !isTemperatureUnit(temperatureUnit)) {
    throw new Error("Invalid temperature unit");
  }

  const { error } = await supabase.from("user_preferences").upsert({
    user_id: user.id,
    location_id: typeof locationId === "string" && locationId.length > 0 ? locationId : null,
    temperature_unit: temperatureUnit
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
};
