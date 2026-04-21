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

export type SnapshotInsert = {
  apparent_temperature_c: number;
  location_id: string;
  observed_at: string;
  source_payload: OpenMeteoResponse;
  temperature_c: number;
  weather_code: number;
  wind_speed_kph: number;
};

const buildUrl = (location: TrackedLocation) => {
  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    current: "temperature_2m,apparent_temperature,wind_speed_10m,weather_code",
    timezone: location.timezone,
    wind_speed_unit: "kmh"
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
};

export const fetchSnapshot = async (location: TrackedLocation): Promise<SnapshotInsert> => {
  const response = await fetch(buildUrl(location), {
    headers: {
      "User-Agent": "dbs-assignment4-weather-worker"
    }
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
