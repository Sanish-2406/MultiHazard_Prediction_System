const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

/**
 * Reverse geocode coordinates to a place name using OpenStreetMap Nominatim.
 * Nominatim has far superior localized data.
 * Fallback to OpenWeatherMap if Nominatim fails/rate-limits.
 */
export async function reverseGeocode(lat, lng) {
  try {
    // Primary: OpenStreetMap Nominatim
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const nomResponse = await fetch(nomUrl, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'MultiHazardAI-App/1.0'
      }
    });

    if (nomResponse.ok) {
      const data = await nomResponse.json();
      if (data && data.address) {
        const { city, town, village, county, state, country } = data.address;
        const placeName = city || town || village || county || 'Unknown Area';
        const parts = [placeName, state, country].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
      }
    }

    // Fallback: OpenWeatherMap Geo API
    const owUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lng}&limit=1&appid=${API_KEY}`;
    const owResponse = await fetch(owUrl);
    if (owResponse.ok) {
      const data = await owResponse.json();
      if (data.length > 0) {
        const place = data[0];
        const parts = [place.name, place.state, place.country].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
      }
    }

    // Last Resort: Coordinates
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

