import { useState } from 'react';
import { countries } from '../data/regions';

export default function RegionSelector({ onRegionChange, onLocateMe, loadingLocate }) {
  const [countryId, setCountryId] = useState('');
  const [stateId, setStateId] = useState('');

  const handleCountryChange = (e) => {
    const val = e.target.value;
    setCountryId(val);
    setStateId(''); // reset state
    
    if (val) {
      const country = countries.find(c => c.id === val);
      if (country) {
        onRegionChange(country.center, country.zoom);
      }
    } else {
      // Default reset if clear
      onRegionChange([20.5937, 78.9629], 5);
    }
  };

  const handleStateChange = (e) => {
    const val = e.target.value;
    setStateId(val);
    
    if (val && countryId) {
      const country = countries.find(c => c.id === countryId);
      const stateObj = country?.states.find(s => s.id === val);
      if (stateObj) {
        onRegionChange(stateObj.center, stateObj.zoom);
      }
    } else if (countryId) {
      // Revert to country zoom
      const country = countries.find(c => c.id === countryId);
      if (country) {
        onRegionChange(country.center, country.zoom);
      }
    }
  };

  const selectedCountryObj = countries.find(c => c.id === countryId);

  return (
    <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
      <div className="card-header">
        <div className="card-title"> Global Region Selection</div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
        
        <select 
          className="form-input" 
          style={{ width: 'auto', flex: 1, minWidth: '150px' }}
          value={countryId}
          onChange={handleCountryChange}
        >
          <option value="">-- Select Country --</option>
          {countries.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select 
          className="form-input" 
          style={{ width: 'auto', flex: 1, minWidth: '150px' }}
          value={stateId}
          onChange={handleStateChange}
          disabled={!selectedCountryObj || selectedCountryObj.states.length === 0}
        >
          <option value="">-- Select State/Region --</option>
          {selectedCountryObj?.states.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <button 
          className="btn-success" 
          onClick={onLocateMe}
          disabled={loadingLocate}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span></span> {loadingLocate ? 'Locating...' : 'Use My Location'}
        </button>
      </div>
    </div>
  );
}
