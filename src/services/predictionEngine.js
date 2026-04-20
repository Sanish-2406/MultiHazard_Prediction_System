/**
 * Rule-based Multi-Hazard Risk Prediction Engine v3
 * Fixed: Uses humidity, pressure, clouds, wind, and geography as proxies
 * when real-time rainfall data is unavailable (most of the time).
 *
 * Explainable AI — every contributing factor is tracked.
 */

const RISK_LEVELS = {
  LOW: 'Low',
  MODERATE: 'Moderate',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

/* ───── Geographic Risk Zones ───── */
function getGeographicRisk(lat, lng) {
  // Known flood/landslide-prone belts
  const zones = [
    // India: Western Ghats, NE India, Indo-Gangetic Plain
    { minLat: 8, maxLat: 20, minLng: 73, maxLng: 78, flood: 0.3, landslide: 0.5, name: 'Western Ghats' },
    { minLat: 22, maxLat: 30, minLng: 85, maxLng: 97, flood: 0.4, landslide: 0.5, name: 'NE India' },
    { minLat: 24, maxLat: 30, minLng: 75, maxLng: 88, flood: 0.5, landslide: 0.1, name: 'Indo-Gangetic Plains' },
    { minLat: 28, maxLat: 35, minLng: 72, maxLng: 80, flood: 0.2, landslide: 0.6, name: 'Himalayan foothills' },
    // Coastal India
    { minLat: 8, maxLat: 23, minLng: 68, maxLng: 74, flood: 0.4, landslide: 0.1, name: 'West Coast' },
    { minLat: 8, maxLat: 20, minLng: 79, maxLng: 85, flood: 0.4, landslide: 0.1, name: 'East Coast' },
    // Southeast Asia
    { minLat: -10, maxLat: 20, minLng: 95, maxLng: 140, flood: 0.4, landslide: 0.3, name: 'SE Asia' },
    // Global tropical belt
    { minLat: -23.5, maxLat: 23.5, minLng: -180, maxLng: 180, flood: 0.2, landslide: 0.15, name: 'Tropical Zone' },
  ];

  for (const zone of zones) {
    if (lat >= zone.minLat && lat <= zone.maxLat && lng >= zone.minLng && lng <= zone.maxLng) {
      return zone;
    }
  }
  return { flood: 0.1, landslide: 0.1, name: 'Standard Zone' };
}

/* ───── Terrain Estimation (improved) ───── */
function estimateTerrainFactors(lat, lng, elevation) {
  // Estimate slope from latitude (mountainous regions)
  let estimatedSlope = 12; // default moderate
  const absLat = Math.abs(lat);

  // Himalayan / mountain regions
  if (lat >= 28 && lat <= 36 && lng >= 72 && lng <= 95) estimatedSlope = 30; // Himalayas
  else if (lat >= 0 && lat <= 20 && lng >= 73 && lng <= 78) estimatedSlope = 25; // Western Ghats
  else if (lat >= 25 && lat <= 35 && lng >= 85 && lng <= 97) estimatedSlope = 28; // NE hills
  else if (absLat >= 30 && absLat <= 50) estimatedSlope = 18; // mid latitudes
  else if (elevation && elevation > 500) estimatedSlope = Math.min(elevation / 25, 40);

  // Estimate soil moisture from humidity (proxy)
  // This is the KEY fix — uses humidity as soil moisture proxy
  return { slope: estimatedSlope, soilMoisture: null }; // soilMoisture calculated from weather
}

/* ───── Estimate soil moisture from weather (proxy) ───── */
function estimateSoilMoisture(weather) {
  let moisture = 0.3; // base
  // Humidity is one of the best proxies for soil moisture
  if (weather.humidity >= 90) moisture = 0.85;
  else if (weather.humidity >= 80) moisture = 0.72;
  else if (weather.humidity >= 70) moisture = 0.58;
  else if (weather.humidity >= 60) moisture = 0.45;
  else if (weather.humidity >= 50) moisture = 0.35;

  // Rain adds to it
  if (weather.rainfall > 0) moisture = Math.min(0.95, moisture + weather.rainfall * 0.01);
  // Low pressure = wetter
  if (weather.pressure < 1005) moisture = Math.min(0.95, moisture + 0.08);
  // High clouds = likely wetter
  if (weather.clouds >= 80) moisture = Math.min(0.95, moisture + 0.05);

  return moisture;
}

/* ───── Flood Scoring with Factor Tracking ───── */
function computeFloodScore(weather, geoRisk) {
  let score = 0;
  const factors = [];

  // 1. RAINFALL (direct indicator — strongest signal when available)
  if (weather.rainfall >= 50) {
    score += 40;
    factors.push({ factor: 'Extreme rainfall', impact: 'Critical', icon: '️', detail: `${weather.rainfall.toFixed(1)} mm/h — flash flood conditions. Immediate danger.` });
  } else if (weather.rainfall >= 25) {
    score += 32;
    factors.push({ factor: 'Heavy rainfall', impact: 'Very High', icon: '️', detail: `${weather.rainfall.toFixed(1)} mm/h — water levels rising rapidly in drains and rivers.` });
  } else if (weather.rainfall >= 10) {
    score += 22;
    factors.push({ factor: 'Moderate rainfall', impact: 'High', icon: '️', detail: `${weather.rainfall.toFixed(1)} mm/h — sustained rain causes waterlogging.` });
  } else if (weather.rainfall >= 2) {
    score += 14;
    factors.push({ factor: 'Light rainfall', impact: 'Moderate', icon: '️', detail: `${weather.rainfall.toFixed(1)} mm/h — contributes to accumulated water.` });
  } else if (weather.rainfall > 0) {
    score += 8;
    factors.push({ factor: 'Trace rainfall', impact: 'Low', icon: '️', detail: `${weather.rainfall.toFixed(1)} mm/h detected.` });
  }

  // 2. HUMIDITY (strong proxy — indicates atmospheric moisture saturation)
  if (weather.humidity >= 90) {
    score += 18;
    factors.push({ factor: 'Near-saturated atmosphere', impact: 'High', icon: '', detail: `${weather.humidity}% humidity — air is saturated. Ground cannot absorb water; flooding likely.` });
  } else if (weather.humidity >= 80) {
    score += 14;
    factors.push({ factor: 'Very high humidity', impact: 'Moderate', icon: '', detail: `${weather.humidity}% humidity — heavy moisture load. Evaporation minimal.` });
  } else if (weather.humidity >= 70) {
    score += 9;
    factors.push({ factor: 'High humidity', impact: 'Moderate', icon: '', detail: `${weather.humidity}% humidity — elevated moisture reduces drainage capacity.` });
  } else if (weather.humidity >= 60) {
    score += 5;
    factors.push({ factor: 'Moderate humidity', impact: 'Low', icon: '', detail: `${weather.humidity}% humidity — normal moisture levels.` });
  }

  // 3. PRESSURE (low pressure = storm system = rain)
  if (weather.pressure < 998) {
    score += 16;
    factors.push({ factor: 'Severe low pressure', impact: 'High', icon: '', detail: `${weather.pressure} hPa — deep depression or cyclonic system. Heavy rain expected.` });
  } else if (weather.pressure < 1005) {
    score += 12;
    factors.push({ factor: 'Low pressure system', impact: 'Moderate', icon: '', detail: `${weather.pressure} hPa — active low pressure brings prolonged rainfall.` });
  } else if (weather.pressure < 1010) {
    score += 7;
    factors.push({ factor: 'Below-normal pressure', impact: 'Low', icon: '', detail: `${weather.pressure} hPa — slightly unsettled weather pattern.` });
  }

  // 4. CLOUD COVER (overcast = rain potential)
  if (weather.clouds >= 90) {
    score += 10;
    factors.push({ factor: 'Complete overcast', impact: 'Moderate', icon: '️', detail: `${weather.clouds}% cloud cover — heavy precipitation likely.` });
  } else if (weather.clouds >= 75) {
    score += 7;
    factors.push({ factor: 'Dense clouds', impact: 'Low', icon: '', detail: `${weather.clouds}% cloud cover — rain-bearing cloud system present.` });
  } else if (weather.clouds >= 50) {
    score += 3;
    factors.push({ factor: 'Partial clouds', impact: 'Minimal', icon: '️', detail: `${weather.clouds}% cloud cover — some weather activity.` });
  }

  // 5. WIND (drives storm systems, pushes water)
  if (weather.windSpeed >= 20) {
    score += 12;
    factors.push({ factor: 'Storm-force winds', impact: 'High', icon: '️', detail: `${weather.windSpeed.toFixed(1)} m/s — strong winds indicate active storm system.` });
  } else if (weather.windSpeed >= 12) {
    score += 8;
    factors.push({ factor: 'Strong winds', impact: 'Moderate', icon: '️', detail: `${weather.windSpeed.toFixed(1)} m/s — winds pushing weather systems through.` });
  } else if (weather.windSpeed >= 7) {
    score += 4;
    factors.push({ factor: 'Moderate winds', impact: 'Low', icon: '️', detail: `${weather.windSpeed.toFixed(1)} m/s — breezy conditions.` });
  }

  // 6. ACTIVE WEATHER CONDITION
  if (weather.weatherMain === 'Thunderstorm') {
    score += 15;
    factors.push({ factor: 'Active thunderstorm', impact: 'Very High', icon: '️', detail: `Thunderstorm in progress — intense, sudden rainfall causing flash floods.` });
  } else if (weather.weatherMain === 'Rain' || weather.weatherMain === 'Drizzle') {
    score += 10;
    factors.push({ factor: 'Active precipitation', impact: 'Moderate', icon: '️', detail: `${weather.weatherDescription} — ongoing rain contributes to water accumulation.` });
  } else if (weather.weatherMain === 'Mist' || weather.weatherMain === 'Fog') {
    score += 4;
    factors.push({ factor: 'Misty conditions', impact: 'Low', icon: '️', detail: `${weather.weatherDescription} — high moisture in air indicates wet conditions.` });
  }

  // 7. GEOGRAPHIC RISK
  if (geoRisk.flood >= 0.3) {
    const geoScore = Math.round(geoRisk.flood * 20);
    score += geoScore;
    factors.push({ factor: `Flood-prone region (${geoRisk.name})`, impact: geoRisk.flood >= 0.4 ? 'High' : 'Moderate', icon: '️', detail: `This area (${geoRisk.name}) is historically prone to flooding — regional risk factor applied.` });
  }

  return { score: Math.min(score, 100), factors };
}

/* ───── Landslide Scoring with Factor Tracking ───── */
function computeLandslideScore(weather, terrain, soilMoisture, geoRisk) {
  let score = 0;
  const factors = [];

  // 1. RAINFALL on slopes
  if (weather.rainfall >= 30) {
    score += 30;
    factors.push({ factor: 'Heavy rain on slopes', impact: 'Critical', icon: '️', detail: `${weather.rainfall.toFixed(1)} mm/h — saturating soil on steep terrain. Slide imminent.` });
  } else if (weather.rainfall >= 10) {
    score += 20;
    factors.push({ factor: 'Sustained rainfall', impact: 'High', icon: '️', detail: `${weather.rainfall.toFixed(1)} mm/h — weakens soil cohesion on hillsides.` });
  } else if (weather.rainfall >= 2) {
    score += 12;
    factors.push({ factor: 'Light rainfall', impact: 'Moderate', icon: '️', detail: `${weather.rainfall.toFixed(1)} mm/h — contributes to gradual soil saturation.` });
  }

  // 2. SLOPE STEEPNESS (major factor)
  if (terrain.slope >= 35) {
    score += 22;
    factors.push({ factor: 'Extremely steep terrain', impact: 'Critical', icon: '️', detail: `~${terrain.slope.toFixed(0)}° slope — extreme gravitational stress. Very slide-prone.` });
  } else if (terrain.slope >= 25) {
    score += 18;
    factors.push({ factor: 'Steep terrain', impact: 'High', icon: '️', detail: `~${terrain.slope.toFixed(0)}° slope — significant landslide risk when soil is wet.` });
  } else if (terrain.slope >= 15) {
    score += 12;
    factors.push({ factor: 'Moderate slope', impact: 'Moderate', icon: '️', detail: `~${terrain.slope.toFixed(0)}° slope — slides possible under saturated conditions.` });
  } else if (terrain.slope >= 8) {
    score += 5;
    factors.push({ factor: 'Gentle slope', impact: 'Low', icon: '️', detail: `~${terrain.slope.toFixed(0)}° slope — low gradient.` });
  }

  // 3. SOIL MOISTURE (estimated from humidity + rain)
  if (soilMoisture >= 0.82) {
    score += 18;
    factors.push({ factor: 'Saturated soil', impact: 'Very High', icon: '🟤', detail: `Estimated soil moisture ~${(soilMoisture * 100).toFixed(0)}% — ground is waterlogged, slope failure likely.` });
  } else if (soilMoisture >= 0.65) {
    score += 13;
    factors.push({ factor: 'Very wet soil', impact: 'High', icon: '🟤', detail: `Estimated soil moisture ~${(soilMoisture * 100).toFixed(0)}% — cohesion weakened significantly.` });
  } else if (soilMoisture >= 0.50) {
    score += 8;
    factors.push({ factor: 'Moist soil', impact: 'Moderate', icon: '🟫', detail: `Estimated soil moisture ~${(soilMoisture * 100).toFixed(0)}% — moderate saturation.` });
  } else if (soilMoisture >= 0.35) {
    score += 4;
    factors.push({ factor: 'Damp soil', impact: 'Low', icon: '🟫', detail: `Estimated soil moisture ~${(soilMoisture * 100).toFixed(0)}% — manageable conditions.` });
  }

  // 4. HUMIDITY (keeps soil wet, prevents drying)
  if (weather.humidity >= 88) {
    score += 10;
    factors.push({ factor: 'Saturated atmosphere', impact: 'Moderate', icon: '', detail: `${weather.humidity}% humidity — prevents soil from drying, prolonging instability.` });
  } else if (weather.humidity >= 75) {
    score += 6;
    factors.push({ factor: 'High moisture', impact: 'Low', icon: '', detail: `${weather.humidity}% humidity — maintains soil wetness.` });
  }

  // 5. ACTIVE WEATHER
  if (weather.weatherMain === 'Thunderstorm') {
    score += 12;
    factors.push({ factor: 'Thunderstorm activity', impact: 'High', icon: '️', detail: `Thunderstorms trigger sudden, intense water infiltration into slopes.` });
  } else if (weather.weatherMain === 'Rain') {
    score += 8;
    factors.push({ factor: 'Continuous rain', impact: 'Moderate', icon: '️', detail: `Ongoing rain steadily saturates hill slopes.` });
  }

  // 6. GEOGRAPHIC RISK
  if (geoRisk.landslide >= 0.3) {
    const geoScore = Math.round(geoRisk.landslide * 18);
    score += geoScore;
    factors.push({ factor: `Slide-prone region (${geoRisk.name})`, impact: geoRisk.landslide >= 0.4 ? 'High' : 'Moderate', icon: '️', detail: `${geoRisk.name} is historically prone to landslides — terrain and geology increase risk.` });
  }

  return { score: Math.min(score, 100), factors };
}

/* ───── Score → Risk Level ───── */
function scoreToRisk(score) {
  if (score >= 65) return RISK_LEVELS.CRITICAL;
  if (score >= 40) return RISK_LEVELS.HIGH;
  if (score >= 20) return RISK_LEVELS.MODERATE;
  return RISK_LEVELS.LOW;
}

/* ───── Risk Timing ───── */
function estimateRiskTiming(weather, floodScore, landslideScore) {
  const maxScore = Math.max(floodScore, landslideScore);
  if (maxScore < 20) return 'No immediate risk — conditions are stable.';
  if (weather.rainfall >= 25 || weather.weatherMain === 'Thunderstorm') return 'Immediate risk — active severe weather. Stay alert for the next 1–3 hours.';
  if (weather.rainfall >= 5) return 'Risk within 3–6 hours if rainfall continues at current intensity.';
  if (maxScore >= 65) return 'High risk within 6–12 hours. Conditions strongly favor hazardous events.';
  if (maxScore >= 40) return 'Elevated risk within 12–24 hours. Weather patterns indicate developing threat.';
  if (weather.humidity >= 80 && weather.clouds >= 70) return 'Moderate risk within 12–24 hours — conditions favor precipitation.';
  return 'Low-to-moderate near-term risk. Monitor conditions for changes.';
}

/* ───── Structured Report ───── */
function generateReport(weather, terrain, floodRisk, landslideRisk, floodScore, landslideScore, floodFactors, landslideFactors, riskTiming) {
  return {
    weatherSummary: {
      condition: weather.weatherDescription,
      temperature: weather.temperature,
      rainfall: weather.rainfall,
      humidity: weather.humidity,
      pressure: weather.pressure,
      windSpeed: weather.windSpeed,
      clouds: weather.clouds,
      icon: weather.weatherIcon,
    },
    flood: { risk: floodRisk, score: floodScore, factors: floodFactors },
    landslide: { risk: landslideRisk, score: landslideScore, factors: landslideFactors },
    timing: riskTiming,
    conclusion: generateConclusion(floodRisk, landslideRisk, floodScore, landslideScore),
  };
}

function generateConclusion(floodRisk, landslideRisk, floodScore, landslideScore) {
  const maxRisk = Math.max(floodScore, landslideScore);
  if (maxRisk >= 65) return ' CRITICAL ALERT: Immediate protective action required. Evacuate risk zones, avoid low-lying areas and steep slopes.';
  if (maxRisk >= 40) return '️ HIGH ALERT: Significant risk detected. Avoid unnecessary travel near rivers and hillsides.';
  if (maxRisk >= 20) return ' MODERATE ADVISORY: Elevated conditions detected. Exercise caution near waterways and slopes.';
  return ' ALL CLEAR: Conditions are currently safe. No immediate hazard detected.';
}

/* ───── Legacy text explanation (for DB storage) ───── */
function generateExplanation(weather, terrain, floodRisk, landslideRisk, floodScore, landslideScore) {
  const lines = [];
  lines.push(` Risk Assessment Summary`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push('');
  lines.push(`️ Current Conditions: ${weather.weatherDescription} at ${weather.temperature.toFixed(1)}°C`);
  lines.push(` Rainfall: ${weather.rainfall} mm/h |  Humidity: ${weather.humidity}%`);
  lines.push(`️ Wind: ${weather.windSpeed} m/s | ️ Cloud Cover: ${weather.clouds}%`);
  lines.push(` Pressure: ${weather.pressure} hPa`);
  lines.push('');
  lines.push(` FLOOD RISK: ${floodRisk} (Score: ${floodScore}/100)`);
  lines.push(`️ LANDSLIDE RISK: ${landslideRisk} (Score: ${landslideScore}/100)`);
  return lines.join('\n');
}

/* ───── Main Prediction Function ───── */
export function predictRisks(weather, lat, lng, elevation = null) {
  const terrain = estimateTerrainFactors(lat, lng, elevation);
  const soilMoisture = estimateSoilMoisture(weather);
  const geoRisk = getGeographicRisk(lat, lng);

  const { score: floodScore, factors: floodFactors } = computeFloodScore(weather, geoRisk);
  const { score: landslideScore, factors: landslideFactors } = computeLandslideScore(weather, terrain, soilMoisture, geoRisk);

  const floodRisk = scoreToRisk(floodScore);
  const landslideRisk = scoreToRisk(landslideScore);
  const riskTiming = estimateRiskTiming(weather, floodScore, landslideScore);
  const explanation = generateExplanation(weather, terrain, floodRisk, landslideRisk, floodScore, landslideScore);
  const report = generateReport(weather, terrain, floodRisk, landslideRisk, floodScore, landslideScore, floodFactors, landslideFactors, riskTiming);

  return {
    floodRisk,
    landslideRisk,
    floodScore,
    landslideScore,
    riskTiming,
    explanation,
    report,
    terrain,
    floodFactors,
    landslideFactors,
  };
}
