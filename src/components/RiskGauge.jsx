export default function RiskGauge({ prediction }) {
  if (!prediction) {
    return (
      <div className="card risk-section">
        <div className="card-header">
          <div className="card-title"><span className="icon">️</span> Risk Assessment</div>
        </div>
        <div className="placeholder-state">
          <div className="placeholder-icon">️</div>
          <p>Risk assessment will appear after weather data is fetched</p>
        </div>
      </div>
    );
  }

  const riskClass = (level) => level.toLowerCase();

  return (
    <div className="card risk-section" id="risk-panel">
      <div className="card-header">
        <div className="card-title"><span className="icon">️</span> Risk Assessment</div>
      </div>

      <div className="risk-gauges">
        <div className={`risk-gauge ${riskClass(prediction.floodRisk)}`}>
          <div className="risk-icon"></div>
          <div className="risk-label">Flood Risk</div>
          <div className="risk-level">{prediction.floodRisk}</div>
          <div className="risk-score">{prediction.floodScore}/100</div>
        </div>

        <div className={`risk-gauge ${riskClass(prediction.landslideRisk)}`}>
          <div className="risk-icon">️</div>
          <div className="risk-label">Landslide Risk</div>
          <div className="risk-level">{prediction.landslideRisk}</div>
          <div className="risk-score">{prediction.landslideScore}/100</div>
        </div>
      </div>

      <div className="risk-timing">
        <div className="timing-label">⏱️ Risk Timing</div>
        <div>{prediction.riskTiming}</div>
      </div>
    </div>
  );
}
