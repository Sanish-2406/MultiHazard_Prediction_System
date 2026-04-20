import { useState, useEffect } from 'react';

export default function AlertBanner({ locations }) {
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());

  // Find all high/critical risk locations
  const alerts = (locations || []).filter((loc) => {
    if (dismissed.has(loc.id)) return false;
    if (!loc.prediction) return false;
    return loc.prediction.floodScore >= 45 || loc.prediction.landslideScore >= 45;
  });

  if (alerts.length === 0) return null;

  const dismiss = (id) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  const dismissAll = () => {
    setDismissed(new Set(alerts.map((a) => a.id)));
  };

  return (
    <div className="alert-banner-container" id="alert-banners">
      {alerts.map((loc) => {
        const isCritical = loc.prediction.floodScore >= 70 || loc.prediction.landslideScore >= 70;
        const floodHigh = loc.prediction.floodScore >= 45;
        const landslideHigh = loc.prediction.landslideScore >= 45;

        return (
          <div
            key={loc.id}
            className={`alert-banner ${isCritical ? 'alert-critical' : 'alert-high'}`}
          >
            <div className="alert-icon">
              {isCritical ? '' : '️'}
            </div>
            <div className="alert-content">
              <div className="alert-title">
                {isCritical ? 'CRITICAL RISK DETECTED' : 'HIGH RISK DETECTED'}
                <span className="alert-location"> — {loc.name}</span>
              </div>
              <div className="alert-details">
                {floodHigh && (
                  <span className="alert-badge flood">
                     Flood: {loc.prediction.floodRisk}
                  </span>
                )}
                {landslideHigh && (
                  <span className="alert-badge landslide">
                    ️ Landslide: {loc.prediction.landslideRisk}
                  </span>
                )}
              </div>
            </div>
            <button
              className="alert-dismiss"
              onClick={() => dismiss(loc.id)}
              title="Dismiss"
            >
              
            </button>
          </div>
        );
      })}
      {alerts.length > 1 && (
        <button className="alert-dismiss-all" onClick={dismissAll}>
          Dismiss all alerts
        </button>
      )}
    </div>
  );
}
