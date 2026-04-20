export default function RiskReport({ location, weather, prediction }) {
  if (!prediction || !weather) return null;

  const report = prediction.report;
  const riskClass = (level) => level.toLowerCase();

  return (
    <div className="risk-report" id="risk-report">
      {/* Section 1: Location */}
      <div className="report-section">
        <div className="report-section-header">
          <span className="report-section-icon"></span>
          <h3>Location</h3>
        </div>
        <div className="report-section-body">
          <div className="report-location-name">{location.name}</div>
          <div className="report-coords">
            Coordinates: {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
          </div>
        </div>
      </div>

      {/* Section 2: Weather Data */}
      <div className="report-section">
        <div className="report-section-header">
          <span className="report-section-icon">️</span>
          <h3>Current Weather</h3>
        </div>
        <div className="report-section-body">
          <div className="report-weather-overview">
            <img
              src={`https://openweathermap.org/img/wn/${report.weatherSummary.icon}@2x.png`}
              alt={report.weatherSummary.condition}
              className="report-weather-img"
            />
            <div>
              <div className="report-weather-temp">{report.weatherSummary.temperature.toFixed(1)}°C</div>
              <div className="report-weather-desc">{report.weatherSummary.condition}</div>
            </div>
          </div>
          <div className="report-weather-grid">
            <div className="report-stat">
              <span className="stat-icon">️</span>
              <span className="stat-label">Rainfall</span>
              <span className="stat-value">{report.weatherSummary.rainfall} mm/h</span>
            </div>
            <div className="report-stat">
              <span className="stat-icon"></span>
              <span className="stat-label">Humidity</span>
              <span className="stat-value">{report.weatherSummary.humidity}%</span>
            </div>
            <div className="report-stat">
              <span className="stat-icon"></span>
              <span className="stat-label">Pressure</span>
              <span className="stat-value">{report.weatherSummary.pressure} hPa</span>
            </div>
            <div className="report-stat">
              <span className="stat-icon">️</span>
              <span className="stat-label">Wind</span>
              <span className="stat-value">{report.weatherSummary.windSpeed} m/s</span>
            </div>
            <div className="report-stat">
              <span className="stat-icon">️</span>
              <span className="stat-label">Clouds</span>
              <span className="stat-value">{report.weatherSummary.clouds}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Risk Levels */}
      <div className="report-section">
        <div className="report-section-header">
          <span className="report-section-icon">️</span>
          <h3>Risk Levels</h3>
        </div>
        <div className="report-section-body">
          <div className="report-risk-cards">
            <div className={`report-risk-card ${riskClass(prediction.floodRisk)}`}>
              <div className="report-risk-icon"></div>
              <div className="report-risk-type">Flood Risk</div>
              <div className="report-risk-level">{prediction.floodRisk}</div>
              <div className="report-risk-bar">
                <div
                  className={`report-risk-fill ${riskClass(prediction.floodRisk)}`}
                  style={{ width: `${prediction.floodScore}%` }}
                />
              </div>
              <div className="report-risk-score">{prediction.floodScore}/100</div>
            </div>
            <div className={`report-risk-card ${riskClass(prediction.landslideRisk)}`}>
              <div className="report-risk-icon">️</div>
              <div className="report-risk-type">Landslide Risk</div>
              <div className="report-risk-level">{prediction.landslideRisk}</div>
              <div className="report-risk-bar">
                <div
                  className={`report-risk-fill ${riskClass(prediction.landslideRisk)}`}
                  style={{ width: `${prediction.landslideScore}%` }}
                />
              </div>
              <div className="report-risk-score">{prediction.landslideScore}/100</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Risk Timing */}
      <div className="report-section">
        <div className="report-section-header">
          <span className="report-section-icon">⏱️</span>
          <h3>Risk Timing</h3>
        </div>
        <div className="report-section-body">
          <div className="report-timing">{prediction.riskTiming}</div>
        </div>
      </div>

      {/* Section 5: Explanation (WHY) */}
      <div className="report-section">
        <div className="report-section-header">
          <span className="report-section-icon"></span>
          <h3>Why This Prediction?</h3>
        </div>
        <div className="report-section-body">
          {prediction.floodFactors.length > 0 && (
            <div className="report-factor-group">
              <h4 className="factor-group-title"> Flood Risk Factors</h4>
              <div className="report-factors">
                {prediction.floodFactors.map((f, i) => (
                  <div key={i} className={`report-factor impact-${f.impact.toLowerCase().replace(' ', '-')}`}>
                    <div className="factor-header">
                      <span className="factor-icon">{f.icon}</span>
                      <span className="factor-name">{f.factor}</span>
                      <span className={`factor-impact ${f.impact.toLowerCase().replace(' ', '-')}`}>{f.impact}</span>
                    </div>
                    <div className="factor-detail">{f.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {prediction.landslideFactors.length > 0 && (
            <div className="report-factor-group">
              <h4 className="factor-group-title">️ Landslide Risk Factors</h4>
              <div className="report-factors">
                {prediction.landslideFactors.map((f, i) => (
                  <div key={i} className={`report-factor impact-${f.impact.toLowerCase().replace(' ', '-')}`}>
                    <div className="factor-header">
                      <span className="factor-icon">{f.icon}</span>
                      <span className="factor-name">{f.factor}</span>
                      <span className={`factor-impact ${f.impact.toLowerCase().replace(' ', '-')}`}>{f.impact}</span>
                    </div>
                    <div className="factor-detail">{f.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {prediction.floodFactors.length === 0 && prediction.landslideFactors.length === 0 && (
            <p className="no-factors"> No significant risk factors detected. Conditions are favorable.</p>
          )}
        </div>
      </div>

      {/* Section 6: Conclusion */}
      <div className="report-section report-conclusion-section">
        <div className="report-section-header">
          <span className="report-section-icon"></span>
          <h3>Final Conclusion</h3>
        </div>
        <div className="report-section-body">
          <div className="report-conclusion">{report.conclusion}</div>
        </div>
      </div>
    </div>
  );
}
