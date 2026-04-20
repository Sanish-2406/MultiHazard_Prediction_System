import { useState } from 'react';

export default function PredictionCard({ prediction, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const riskClass = (level) => level.toLowerCase();

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async () => {
    if (!confirm('Delete this prediction?')) return;
    setDeleting(true);
    try {
      await onDelete(prediction.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="prediction-card" id={`prediction-${prediction.id}`}>
      <div className="prediction-card-header">
        <div className="prediction-card-location">
           {prediction.location}
        </div>
        <div className="prediction-card-date">
          {formatDate(prediction.created_at)}
        </div>
      </div>

      <div className="prediction-card-body">
        <div className="prediction-card-risks">
          <div className={`prediction-risk-badge ${riskClass(prediction.flood_risk)}`}>
            <span className="badge-label"> Flood</span>
            {prediction.flood_risk}
          </div>
          <div className={`prediction-risk-badge ${riskClass(prediction.landslide_risk)}`}>
            <span className="badge-label">️ Landslide</span>
            {prediction.landslide_risk}
          </div>
        </div>

        <div className="prediction-card-details">
          <div className="detail-item">️ {prediction.temperature?.toFixed(1) ?? '—'}°C</div>
          <div className="detail-item"> {prediction.rainfall ?? '—'} mm/h</div>
          <div className="detail-item"> {prediction.humidity ?? '—'}%</div>
          <div className="detail-item"> {prediction.latitude?.toFixed(2)}, {prediction.longitude?.toFixed(2)}</div>
        </div>
      </div>

      {expanded && prediction.explanation && (
        <div className="prediction-card-expand">
          <div className="explanation-text">{prediction.explanation}</div>
          {prediction.risk_timing && (
            <div className="risk-timing">
              <div className="timing-label">⏱️ Timing</div>
              {prediction.risk_timing}
            </div>
          )}
        </div>
      )}

      <div className="prediction-card-actions">
        <button
          className="btn-secondary"
          onClick={() => setExpanded(!expanded)}
          id={`btn-expand-${prediction.id}`}
        >
          {expanded ? '▲ Collapse' : '▼ View Full Report'}
        </button>
        <button
          className="btn-danger"
          onClick={handleDelete}
          disabled={deleting}
          id={`btn-delete-${prediction.id}`}
        >
          {deleting ? 'Deleting…' : '️ Delete'}
        </button>
      </div>
    </div>
  );
}
