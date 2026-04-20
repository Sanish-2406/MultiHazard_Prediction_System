export default function WeatherPanel({ weather, loading }) {
  if (loading) {
    return (
      <div className="card weather-section">
        <div className="card-header">
          <div className="card-title"><span className="icon">️</span> Weather Data</div>
        </div>
        <div className="placeholder-state">
          <div className="spinner spinner-small" />
          <p>Fetching weather data...</p>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="card weather-section">
        <div className="card-header">
          <div className="card-title"><span className="icon">️</span> Weather Data</div>
        </div>
        <div className="placeholder-state">
          <div className="placeholder-icon">ℹ️</div>
          <p>Select a location on the map to fetch weather data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card weather-section" id="weather-panel">
      <div className="card-header">
        <div className="card-title"><span className="icon">️</span> Real-Time Weather</div>
      </div>

      <div className="weather-icon-large">
        <img
          src={`https://openweathermap.org/img/wn/${weather.weatherIcon}@2x.png`}
          alt={weather.weatherDescription}
        />
        <div>
          <div className="temp">{weather.temperature.toFixed(1)}°C</div>
          <div className="desc">{weather.weatherDescription}</div>
        </div>
      </div>

      <div className="weather-grid">
        <div className="weather-item">
          <span className="label"> Rainfall</span>
          <span className="value">{weather.rainfall}<span className="unit"> mm/h</span></span>
        </div>
        <div className="weather-item">
          <span className="label"> Humidity</span>
          <span className="value">{weather.humidity}<span className="unit"> %</span></span>
        </div>
        <div className="weather-item">
          <span className="label">️ Wind Speed</span>
          <span className="value">{weather.windSpeed}<span className="unit"> m/s</span></span>
        </div>
        <div className="weather-item">
          <span className="label"> Pressure</span>
          <span className="value">{weather.pressure}<span className="unit"> hPa</span></span>
        </div>
        <div className="weather-item">
          <span className="label">️ Clouds</span>
          <span className="value">{weather.clouds}<span className="unit"> %</span></span>
        </div>
        <div className="weather-item">
          <span className="label">️ Visibility</span>
          <span className="value">{(weather.visibility / 1000).toFixed(1)}<span className="unit"> km</span></span>
        </div>
      </div>
    </div>
  );
}
