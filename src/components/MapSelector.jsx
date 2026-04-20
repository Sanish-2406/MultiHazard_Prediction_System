import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/* ──────── Custom colored marker SVG ──────── */
function createRiskIcon(riskLevel) {
  const colors = {
    low: '#22c55e',
    moderate: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
    pending: '#6366f1',
  };
  const color = colors[riskLevel] || colors.pending;

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
      <defs>
        <filter id="shadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M15 0C6.716 0 0 6.716 0 15c0 12 15 27 15 27s15-15 15-27C30 6.716 23.284 0 15 0z"
            fill="${color}" filter="url(#shadow)" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
      <circle cx="15" cy="14" r="6" fill="white" opacity="0.9"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-risk-marker',
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
  });
}

function getRiskLevel(prediction) {
  if (!prediction) return 'pending';
  const maxScore = Math.max(prediction.floodScore, prediction.landslideScore);
  if (maxScore >= 70) return 'critical';
  if (maxScore >= 45) return 'high';
  if (maxScore >= 25) return 'moderate';
  return 'low';
}

function getRiskCircleColor(riskLevel) {
  const colors = {
    low: '#22c55e',
    moderate: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
    pending: '#6366f1',
  };
  return colors[riskLevel] || colors.pending;
}

/* ──────── Risk score → heatmap intensity (0–1) ──────── */
function riskToIntensity(prediction) {
  if (!prediction) return 0.1;
  const maxScore = Math.max(prediction.floodScore, prediction.landslideScore);
  if (maxScore >= 70) return 1.0;
  if (maxScore >= 45) return 0.75;
  if (maxScore >= 25) return 0.5;
  return 0.3;
}

/* ──────── Click handler (works in both views) ──────── */
function ClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/* ──────── Heatmap layer (imperatively managed) ──────── */
function HeatmapLayer({ locations }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    // Remove existing layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // Build heat data: [lat, lng, intensity]
    const heatData = locations
      .filter((loc) => loc.prediction)
      .map((loc) => [loc.lat, loc.lng, riskToIntensity(loc.prediction)]);

    if (heatData.length === 0) return;

    heatLayerRef.current = L.heatLayer(heatData, {
      radius: 50,
      blur: 35,
      maxZoom: 12,
      max: 1.0,
      minOpacity: 0.35,
      gradient: {
        0.0: '#1a1a2e',
        0.25: '#22c55e',
        0.5: '#f59e0b',
        0.75: '#f97316',
        1.0: '#ef4444',
      },
    }).addTo(map);

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, locations]);

  return null;
}

/* ──────── Map Updater for dynamic center/zoom ──────── */
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && zoom) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

/* ──────── Main MapSelector ──────── */
export default function MapSelector({ locations, activeLocationId, onLocationSelect, mapCenter, mapZoom }) {
  const [viewMode, setViewMode] = useState('normal'); // 'normal' | 'heatmap'

  const defaultCenter = [20.5937, 78.9629];
  const activeLocation = locations.find((l) => l.id === activeLocationId);
  const center = mapCenter || (activeLocation
    ? [activeLocation.lat, activeLocation.lng]
    : locations.length > 0
      ? [locations[0].lat, locations[0].lng]
      : defaultCenter);
  const zoom = mapZoom || (activeLocation ? 10 : locations.length > 0 ? 6 : 5);

  const isHeatmap = viewMode === 'heatmap';
  const analyzedCount = locations.filter((l) => l.prediction).length;

  return (
    <div>
      {/* Toggle Switch */}
      <div className="map-toggle-bar">
        <div className="map-toggle" id="map-view-toggle">
          <button
            className={`toggle-btn ${!isHeatmap ? 'active' : ''}`}
            onClick={() => setViewMode('normal')}
            id="btn-normal-view"
          >
            <span className="toggle-icon"></span> Normal Map
          </button>
          <button
            className={`toggle-btn ${isHeatmap ? 'active' : ''}`}
            onClick={() => setViewMode('heatmap')}
            id="btn-heatmap-view"
          >
            <span className="toggle-icon"></span> Heatmap View
          </button>
        </div>

        {/* Legend */}
        <div className="map-legend">
          <span className="legend-item"><span className="legend-dot low" /> Low</span>
          <span className="legend-item"><span className="legend-dot moderate" /> Moderate</span>
          <span className="legend-item"><span className="legend-dot high" /> High</span>
          <span className="legend-item"><span className="legend-dot critical" /> Critical</span>
        </div>
      </div>

      {/* Map */}
      <div className={`map-container ${isHeatmap ? 'heatmap-active' : ''}`} id="map-container">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <MapUpdater center={center} zoom={zoom} />
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url={isHeatmap
              ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            }
          />
          <ClickHandler onLocationSelect={onLocationSelect} />

          {/* Heatmap Layer */}
          {isHeatmap && <HeatmapLayer locations={locations} />}

          {/* Normal view: markers + risk circles */}
          {!isHeatmap && locations.map((loc) => {
            const risk = getRiskLevel(loc.prediction);
            const isActive = loc.id === activeLocationId;
            const circleColor = getRiskCircleColor(risk);

            return (
              <span key={loc.id}>
                <Circle
                  center={[loc.lat, loc.lng]}
                  radius={risk === 'critical' ? 15000 : risk === 'high' ? 12000 : 8000}
                  pathOptions={{
                    color: circleColor,
                    fillColor: circleColor,
                    fillOpacity: isActive ? 0.2 : 0.1,
                    weight: isActive ? 2 : 1,
                    dashArray: isActive ? null : '4 4',
                  }}
                />
                <Marker position={[loc.lat, loc.lng]} icon={createRiskIcon(risk)}>
                  <Popup>
                    <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '180px' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{loc.name}</strong>
                      <br />
                      <span style={{ fontSize: '0.8rem', color: '#666' }}>
                        {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                      </span>
                      {loc.prediction ? (
                        <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                            background: risk === 'critical' || risk === 'high' ? '#fff3e0' : '#e8f5e9',
                            color: risk === 'critical' ? '#c62828' : risk === 'high' ? '#e65100' : '#2e7d32',
                          }}>
                             Flood: {loc.prediction.floodRisk}
                          </span>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                            background: risk === 'critical' ? '#fde8e8' : '#e8f5e9',
                            color: risk === 'critical' ? '#c62828' : '#2e7d32',
                          }}>
                            ️ Landslide: {loc.prediction.landslideRisk}
                          </span>
                        </div>
                      ) : (
                        <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#999' }}>
                          ⏳ Pending analysis...
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </span>
            );
          })}

          {/* Heatmap view: small transparent markers for click targets */}
          {isHeatmap && locations.map((loc) => (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={L.divIcon({
                html: `<div class="heatmap-marker-dot"></div>`,
                className: 'heatmap-marker-wrapper',
                iconSize: [14, 14],
                iconAnchor: [7, 7],
              })}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '160px' }}>
                  <strong>{loc.name}</strong>
                  {loc.prediction && (
                    <div style={{ marginTop: '6px', fontSize: '0.8rem' }}>
                      <div> Flood: <b>{loc.prediction.floodRisk}</b> ({loc.prediction.floodScore}/100)</div>
                      <div>️ Landslide: <b>{loc.prediction.landslideRisk}</b> ({loc.prediction.landslideScore}/100)</div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Info bar */}
      <div className="location-info">
        <span className="pin">{isHeatmap ? '' : ''}</span>
        {locations.length > 0
          ? isHeatmap
            ? `Heatmap showing ${analyzedCount} analyzed location${analyzedCount !== 1 ? 's' : ''} — Click map to add more`
            : `${locations.length} location${locations.length > 1 ? 's' : ''} monitored — Click map to add more`
          : 'Click on the map to start monitoring a location'
        }
      </div>
    </div>
  );
}
