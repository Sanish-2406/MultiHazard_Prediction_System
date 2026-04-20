import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import MapSelector from '../components/MapSelector';
import LocationList from '../components/LocationList';
import WeatherPanel from '../components/WeatherPanel';
import RiskGauge from '../components/RiskGauge';
import RiskReport from '../components/RiskReport';
import AlertBanner from '../components/AlertBanner';
import RegionSelector from '../components/RegionSelector';
import WarningModal from '../components/WarningModal';
import SimulationPanel from '../components/SimulationPanel';
import NewsSection from '../components/NewsSection';
import LiveStreamSection from '../components/LiveStreamSection';
import { fetchWeatherData } from '../services/weatherService';
import { reverseGeocode } from '../services/geocodingService';
import { predictRisks } from '../services/predictionEngine';
import { savePrediction } from '../services/predictionService';

let nextId = 1;

export default function DashboardPage() {
  const { user } = useAuth();

  const [locations, setLocations] = useState([]);
  const [activeLocationId, setActiveLocationId] = useState(null);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(new Set());
  const [error, setError] = useState('');

  // Mode states
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  // Map state hooks passed to MapSelector
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(null);

  // Manual GPS Input states
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // User location modal states
  const [loadingLocate, setLoadingLocate] = useState(false);
  const [currentLocationPrediction, setCurrentLocationPrediction] = useState(null);
  const [currentLocationName, setCurrentLocationName] = useState('');

  const activeLocation = locations.find((l) => l.id === activeLocationId);

  /* ─── Analyze a single location (Real-time) ─── */
  const analyzeLocation = useCallback(async (loc) => {
    setLocations((prev) => prev.map((l) => (l.id === loc.id ? { ...l, loading: true, weather: null, prediction: null } : l)));
    try {
      const [name, weatherData] = await Promise.all([
        reverseGeocode(loc.lat, loc.lng),
        fetchWeatherData(loc.lat, loc.lng),
      ]);
      const prediction = predictRisks(weatherData, loc.lat, loc.lng);
      setLocations((prev) => prev.map((l) => l.id === loc.id ? { ...l, name: l.name.startsWith('') ? l.name : name, weather: weatherData, prediction, loading: false } : l));
    } catch (err) {
      setLocations((prev) => prev.map((l) => (l.id === loc.id ? { ...l, loading: false } : l)));
      setError(`Failed to analyze location: ${err.message}`);
    }
  }, []);

  /* ─── Handle map click → add new location ─── */
  const handleLocationSelect = useCallback(async (lat, lng) => {
    setError('');
    const id = `loc-${nextId++}`;
    const newLoc = { id, lat, lng, name: 'Loading...', weather: null, prediction: null, loading: true };
    setLocations((prev) => [newLoc, ...prev]);
    setActiveLocationId(id);

    try {
      const name = await reverseGeocode(lat, lng);
      // In simulation mode, set empty initially and let user simulate. In real-time, fetch immediately.
      if (document.getElementById('sim-mode-toggle')?.checked) {
        setLocations((prev) => prev.map((l) => l.id === id ? { ...l, name, loading: false } : l));
      } else {
        const weatherData = await fetchWeatherData(lat, lng);
        const prediction = predictRisks(weatherData, lat, lng);
        setLocations((prev) => prev.map((l) => l.id === id ? { ...l, name, weather: weatherData, prediction, loading: false } : l));
      }
    } catch (err) {
      setLocations((prev) => prev.map((l) => l.id === id ? { ...l, name: `${lat.toFixed(3)}, ${lng.toFixed(3)}`, loading: false } : l));
      setError(err.message || 'Failed to fetch data.');
    }
  }, []);

  /* ─── Manual GPS Submit ─── */
  const handleManualLocationSubmit = (e) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      handleLocationSelect(lat, lng);
      setMapCenter([lat, lng]);
      setMapZoom(10);
    } else {
      setError('Invalid coordinates. Lat between -90 and 90, Lng between -180 and 180.');
    }
  };

  /* ─── Simulation Trigger ─── */
  const handleSimulate = (simWeather) => {
    if (!activeLocation) {
      setError("Please select a location first to run simulation on.");
      return;
    }
    const prediction = predictRisks(simWeather, activeLocation.lat, activeLocation.lng);
    setLocations((prev) => prev.map((l) => l.id === activeLocation.id ? { ...l, weather: simWeather, prediction, loading: false } : l));
    if (activeLocation.id === 'loc-user') {
       setCurrentLocationPrediction(prediction);
    }
  };

  /* ─── Remove location ─── */
  const handleRemoveLocation = useCallback((id) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
    if (activeLocationId === id) setActiveLocationId(null);
  }, [activeLocationId]);

  /* ─── Re-analyze all ─── */
  const handleAnalyzeAll = useCallback(async () => {
    if (isSimulationMode) return;
    setAnalyzingAll(true);
    setError('');
    try { await Promise.all(locations.map((loc) => analyzeLocation(loc))); } 
    catch {} finally { setAnalyzingAll(false); }
  }, [locations, analyzeLocation, isSimulationMode]);

  /* ─── Clear All Locations ─── */
  const handleClearAll = useCallback(() => {
    setLocations([]);
    setActiveLocationId(null);
  }, []);

  /* ─── Region Selection ─── */
  const handleRegionChange = (center, zoom) => {
    setMapCenter(center);
    setMapZoom(zoom);
  };

  /* ─── "Use My Location" Logic ─── */
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.'); return;
    }
    setLoadingLocate(true); setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        setMapZoom(12);

        const id = `loc-user`;
        const newLoc = { id, lat: latitude, lng: longitude, name: ' Computing...', weather: null, prediction: null, loading: true };
        setLocations((prev) => [newLoc, ...prev.filter(l => l.id !== id)]);
        setActiveLocationId(id);
        
        try {
          const [name, weatherData] = await Promise.all([
            reverseGeocode(latitude, longitude), fetchWeatherData(latitude, longitude)
          ]);
          const prediction = predictRisks(weatherData, latitude, longitude);
          const finalName = ` Your Location (${name})`;
          
          setLocations((prev) => prev.map((l) => l.id === id ? { ...l, name: finalName, weather: weatherData, prediction, loading: false } : l));
          setCurrentLocationPrediction(prediction);
          setCurrentLocationName(finalName);
        } catch (err) {
          setError('Failed to analyze your location: ' + err.message);
          setLocations((prev) => prev.map((l) => l.id === id ? { ...l, name: ` User Location`, loading: false } : l));
        } finally {
          setLoadingLocate(false);
        }
      },
      (err) => { setError('Failed to get location: ' + err.message); setLoadingLocate(false); },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  /* ─── Save prediction to Supabase ─── */
  const handleSave = async () => {
    if (!activeLocation?.weather || !activeLocation?.prediction) return;
    setSaving(true); setError('');
    try {
      await savePrediction({
        user_id: user.id, location: activeLocation.name,
        latitude: activeLocation.lat, longitude: activeLocation.lng,
        rainfall: activeLocation.weather.rainfall, temperature: activeLocation.weather.temperature,
        humidity: activeLocation.weather.humidity, flood_risk: activeLocation.prediction.floodRisk,
        landslide_risk: activeLocation.prediction.landslideRisk, risk_timing: activeLocation.prediction.riskTiming,
        explanation: activeLocation.prediction.explanation,
      });
      setSaved((prev) => new Set([...prev, activeLocation.id]));
    } catch (err) { setError('Failed to save: ' + (err.message || 'Unknown error')); } 
    finally { setSaving(false); }
  };
  const isSaved = activeLocation ? saved.has(activeLocation.id) : false;

  return (
    <div className="dashboard" id="dashboard-page">
      <WarningModal prediction={currentLocationPrediction} locationName={currentLocationName} onClose={() => setCurrentLocationPrediction(null)} />
      <AlertBanner locations={locations} />

      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1>️ Multi-Hazard Monitoring Dashboard</h1>
          <p>Click locations on the map or input precise coordinates to monitor real-time or simulated flood/landslide risk.</p>
        </div>
        
        {/* Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', padding: '6px', borderRadius: '40px', border: '1px solid var(--border-color)' }}>
          <button 
            className={`btn ${!isSimulationMode ? 'btn-primary' : ''}`} 
            style={{ borderRadius: '30px', background: !isSimulationMode ? 'var(--primary-color)' : 'transparent', border: 'none', padding: '8px 16px', color: !isSimulationMode ? 'white' : 'var(--text-secondary)' }}
            onClick={() => setIsSimulationMode(false)}
          >
            Real-Time Mode
          </button>
          <button 
            className={`btn ${isSimulationMode ? 'btn-primary' : ''}`} 
            style={{ borderRadius: '30px', background: isSimulationMode ? 'var(--accent-color)' : 'transparent', border: 'none', padding: '8px 16px', color: isSimulationMode ? '#000' : 'var(--text-secondary)' }}
            onClick={() => setIsSimulationMode(true)}
            id="sim-mode-toggle"
          >
            Simulation Mode
          </button>
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 'var(--space-lg)' }}>️ {error}</div>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'stretch' }}>
        <div style={{ flex: 2, minWidth: '300px' }}>
          <RegionSelector onRegionChange={handleRegionChange} onLocateMe={handleLocateMe} loadingLocate={loadingLocate} />
        </div>
        
        {/* Pinpoint Location (Lat/Lng) Input Box */}
        <div className="card" style={{ flex: 1, minWidth: '300px', marginBottom: 'var(--space-md)' }}>
           <div className="card-header"><div className="card-title"> Pinpoint Coordinates</div></div>
           <form onSubmit={handleManualLocationSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
             <input type="number" step="any" placeholder="Latitude" value={manualLat} onChange={e=>setManualLat(e.target.value)} required className="form-input" style={{ width: '40%' }} />
             <input type="number" step="any" placeholder="Longitude" value={manualLng} onChange={e=>setManualLng(e.target.value)} required className="form-input" style={{ width: '40%' }} />
             <button type="submit" className="btn-primary" style={{ width: '20%' }}>Go</button>
           </form>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-sidebar">
          <LocationList
            locations={locations} activeLocationId={activeLocationId}
            onSelectLocation={setActiveLocationId} onRemoveLocation={handleRemoveLocation}
            onAnalyzeAll={handleAnalyzeAll} analyzing={analyzingAll}
            onClearAll={handleClearAll}
          />
          {activeLocation && activeLocation.prediction && (
            <NewsSection prediction={activeLocation.prediction} locationName={activeLocation.name} />
          )}
        </div>

        <div className="dashboard-main">
          {/* Simulation Controls rendered conditionally */}
          {isSimulationMode && (
             <SimulationPanel onSimulate={handleSimulate} />
          )}

          <div className="card">
            <div className="card-header">
              <div className="card-title"><span className="icon">️</span> Risk Map</div>
            </div>
            <MapSelector
              locations={locations} activeLocationId={activeLocationId}
              onLocationSelect={handleLocationSelect} mapCenter={mapCenter} mapZoom={mapZoom}
            />
          </div>

          {activeLocation && (
            <>
              {activeLocation.weather && activeLocation.prediction ? (
                <>
                  <div className="dashboard-details-grid">
                    <WeatherPanel weather={activeLocation.weather} loading={activeLocation.loading} />
                    <RiskGauge prediction={activeLocation.prediction} />
                  </div>
                  <div className="card">
                    <div className="card-header"><div className="card-title"> Detailed Risk Report</div></div>
                    <RiskReport location={activeLocation} weather={activeLocation.weather} prediction={activeLocation.prediction} />
                    <div className="save-bar">
                      {isSaved ? <div className="save-check"> Prediction saved</div> : <div className="save-info"> Save this prediction</div>}
                      <button className="btn-success" onClick={handleSave} disabled={saving || isSaved}>
                        {saving ? 'Saving...' : isSaved ? 'Saved ' : ' Save Prediction'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="card">
                  <div className="placeholder-state">
                    <div className="placeholder-icon">{isSimulationMode ? '️' : '⏳'}</div>
                    <p>{isSimulationMode ? "Use the Simulation Controls above to generate a risk profile." : "Loading real-time data..."}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {!activeLocation && locations.length > 0 && (
            <div className="card"><div className="placeholder-state"><div className="placeholder-icon">ℹ️</div><p>Select a location from the sidebar</p></div></div>
          )}

          {locations.length === 0 && (
            <div className="card"><div className="placeholder-state" style={{ padding: 'var(--space-3xl)' }}><div className="placeholder-icon">️</div><h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-secondary)' }}>Start Monitoring</h3><p>Select a region, input precise coordinates, use your current location, or click anywhere on the map.</p></div></div>
          )}

          <LiveStreamSection locationName={activeLocation?.name} />
        </div>
      </div>
    </div>
  );
}
