export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TemperatureUnit = "c" | "f";

export type Database = {
  public: {
    Tables: {
      tracked_locations: {
        Row: {
          created_at: string;
          id: string;
          latitude: number;
          longitude: number;
          name: string;
          slug: string;
          timezone: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          latitude: number;
          longitude: number;
          name: string;
          slug: string;
          timezone?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          latitude?: number;
          longitude?: number;
          name?: string;
          slug?: string;
          timezone?: string;
        };
        Relationships: [];
      };
      user_tracked_locations: {
        Row: {
          created_at: string;
          location_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          location_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          location_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          location_id: string | null;
          temperature_unit: TemperatureUnit;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          location_id?: string | null;
          temperature_unit?: TemperatureUnit;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          location_id?: string | null;
          temperature_unit?: TemperatureUnit;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      weather_snapshots: {
        Row: {
          apparent_temperature_c: number;
          created_at: string;
          id: string;
          location_id: string;
          observed_at: string;
          source_payload: Json;
          temperature_c: number;
          weather_code: number;
          wind_speed_kph: number;
        };
        Insert: {
          apparent_temperature_c: number;
          created_at?: string;
          id?: string;
          location_id: string;
          observed_at: string;
          source_payload?: Json;
          temperature_c: number;
          weather_code: number;
          wind_speed_kph: number;
        };
        Update: {
          apparent_temperature_c?: number;
          created_at?: string;
          id?: string;
          location_id?: string;
          observed_at?: string;
          source_payload?: Json;
          temperature_c?: number;
          weather_code?: number;
          wind_speed_kph?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type LocationRow = Database["public"]["Tables"]["tracked_locations"]["Row"];
export type UserTrackedLocationRow = Database["public"]["Tables"]["user_tracked_locations"]["Row"];
export type UserPreferenceRow = Database["public"]["Tables"]["user_preferences"]["Row"];
export type WeatherSnapshotRow = Database["public"]["Tables"]["weather_snapshots"]["Row"];

const weatherCodeMap = new Map<number, string>([
  [0, "Clear sky"],
  [1, "Mainly clear"],
  [2, "Partly cloudy"],
  [3, "Overcast"],
  [45, "Fog"],
  [48, "Depositing rime fog"],
  [51, "Light drizzle"],
  [53, "Moderate drizzle"],
  [55, "Dense drizzle"],
  [61, "Slight rain"],
  [63, "Moderate rain"],
  [65, "Heavy rain"],
  [71, "Slight snow"],
  [73, "Moderate snow"],
  [75, "Heavy snow"],
  [80, "Rain showers"],
  [81, "Heavy rain showers"],
  [82, "Violent rain showers"],
  [95, "Thunderstorm"]
]);

export const formatWeatherCode = (code: number) => weatherCodeMap.get(code) ?? `Code ${code}`;

export const formatTemperature = (celsius: number, unit: TemperatureUnit) => {
  if (unit === "f") {
    return `${((celsius * 9) / 5 + 32).toFixed(1)} deg F`;
  }

  return `${celsius.toFixed(1)} deg C`;
};
