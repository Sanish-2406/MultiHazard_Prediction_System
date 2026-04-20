export default function LocationList({
  locations,
  activeLocationId,
  onSelectLocation,
  onRemoveLocation,
  onAnalyzeAll,
  analyzing,
  onClearAll,
}) {
  const riskClass = (level) => (level || 'low').toLowerCase();

  const getOverallRisk = (prediction) => {
    if (!prediction) return null;
    const maxScore = Math.max(prediction.floodScore, prediction.landslideScore);
    if (maxScore >= 70) return 'critical';
    if (maxScore >= 45) return 'high';
    if (maxScore >= 25) return 'moderate';
    return 'low';
  };

  return (
    <div className="card location-list-card" id="location-list">
      <div className="card-header">
        <div className="card-title"> Monitored Locations</div>
        <span className="location-count">{locations.length}</span>
      </div>

      {locations.length === 0 ? (
        <div className="location-empty">
          <p>️ Click on the map to add locations for monitoring</p>
        </div>
      ) : (
        <>
          <div className="location-items">
            {locations.map((loc) => {
              const overall = getOverallRisk(loc.prediction);
              const isActive = loc.id === activeLocationId;
              return (
                <div
                  key={loc.id}
                  className={`location-item ${isActive ? 'active' : ''} ${overall === 'critical' ? 'location-flash' : ''}`}
                  onClick={() => onSelectLocation(loc.id)}
                >
                  <div className="location-item-status">
                    <div className={`status-dot ${overall || 'pending'}`} />
                  </div>
                  <div className="location-item-info">
                    <div className="location-item-name">{loc.name}</div>
                    <div className="location-item-coords">
                      {loc.lat.toFixed(3)}, {loc.lng.toFixed(3)}
                    </div>
                    {loc.prediction && (
                      <div className="location-item-risks">
                        <span className={`mini-badge ${riskClass(loc.prediction.floodRisk)}`}>
                           {loc.prediction.floodRisk}
                        </span>
                        <span className={`mini-badge ${riskClass(loc.prediction.landslideRisk)}`}>
                          ️ {loc.prediction.landslideRisk}
                        </span>
                      </div>
                    )}
                    {!loc.prediction && loc.loading && (
                      <div className="location-item-loading">
                        <div className="spinner spinner-small" /> Analyzing...
                      </div>
                    )}
                  </div>
                  <button
                    className="location-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveLocation(loc.id);
                    }}
                    title="Remove location"
                  >
                    
                  </button>
                </div>
              );
            })}
          </div>

          <div className="location-actions" style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-primary btn-sm"
              onClick={onAnalyzeAll}
              disabled={analyzing || locations.length === 0}
              style={{ flex: 1 }}
            >
              {analyzing ? 'Analyzing...' : 'Re-Analyze All'}
            </button>
            <button
              className="btn-danger btn-sm"
              onClick={onClearAll}
              disabled={analyzing || locations.length === 0}
              style={{ flex: 1 }}
            >
              Clear All
            </button>
          </div>
        </>
      )}
    </div>
  );
}
