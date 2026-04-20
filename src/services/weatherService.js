const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Fetches current weather data for a given lat/lng.
 * Returns normalized weather object.
 */
export async function fetchWeatherData(lat, lng) {
  const url = `${BASE_URL}?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    temperature: data.main?.temp ?? 0,
    feelsLike: data.main?.feels_like ?? 0,
    humidity: data.main?.humidity ?? 0,
    pressure: data.main?.pressure ?? 1013,
    windSpeed: data.wind?.speed ?? 0,
    windGust: data.wind?.gust ?? 0,
    rainfall: data.rain?.['1h'] ?? data.rain?.['3h'] ?? 0,
    clouds: data.clouds?.all ?? 0,
    visibility: data.visibility ?? 10000,
    weatherMain: data.weather?.[0]?.main ?? 'Clear',
    weatherDescription: data.weather?.[0]?.description ?? 'clear sky',
    weatherIcon: data.weather?.[0]?.icon ?? '01d',
  };
}
