import { useState } from 'react';

export default function SimulationPanel({ onSimulate }) {
  const [rainfall, setRainfall] = useState(0);
  const [humidity, setHumidity] = useState(60);
  const [windSpeed, setWindSpeed] = useState(5);

  const handleSimulate = () => {
    onSimulate({
      temperature: 25,
      feelsLike: 25,
      humidity: Number(humidity),
      pressure: 1000, // storm pressure
      windSpeed: Number(windSpeed),
      windGust: Number(windSpeed) * 1.5,
      rainfall: Number(rainfall),
      clouds: 90,
      visibility: 5000,
      weatherMain: rainfall >= 25 ? 'Thunderstorm' : rainfall > 0 ? 'Rain' : 'Clear',
      weatherDescription: 'Simulated weather condition',
      weatherIcon: '09d'
    });
  };

  return (
    <div className="card" style={{ marginBottom: 'var(--space-md)', border: '2px solid var(--accent-color)' }}>
      <div className="card-header">
        <div className="card-title" style={{ color: 'var(--accent-color)' }}><span className="icon">️</span> Simulation Controls</div>
      </div>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
        Manually adjust weather parameters to see how the prediction engine reacts in real-time.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
        <div>
          <label className="form-label">Rainfall Intensity (mm/h): {rainfall}</label>
          <input 
            type="range" min="0" max="150" step="1" 
            value={rainfall} 
            onChange={(e) => setRainfall(e.target.value)} 
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label className="form-label">Humidity (%): {humidity}</label>
          <input 
            type="range" min="0" max="100" step="1" 
            value={humidity} 
            onChange={(e) => setHumidity(e.target.value)} 
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label className="form-label">Wind Speed (m/s): {windSpeed}</label>
          <input 
            type="range" min="0" max="50" step="1" 
            value={windSpeed} 
            onChange={(e) => setWindSpeed(e.target.value)} 
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <button className="btn-primary" onClick={handleSimulate} style={{ width: '100%' }}>
         Run Simulation on Active Location
      </button>
    </div>
  );
}
