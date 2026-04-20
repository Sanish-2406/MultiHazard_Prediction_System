import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PredictionCard from '../components/PredictionCard';
import { getUserPredictions, deletePrediction } from '../services/predictionService';

export default function HistoryPage() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUserPredictions();
      setPredictions(data || []);
    } catch (err) {
      setError('Failed to load history: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deletePrediction(id);
      setPredictions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError('Failed to delete: ' + (err.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="history-page">
        <div className="loading-screen" style={{ minHeight: '50vh' }}>
          <div className="spinner" />
          <div className="loading-text">Loading your predictions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page" id="history-page">
      <div className="history-header">
        <h1> My Predictions</h1>
        <span className="history-count">{predictions.length} prediction{predictions.length !== 1 ? 's' : ''}</span>
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: 'var(--space-lg)' }}>
          ️ {error}
        </div>
      )}

      {predictions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <h2>No predictions yet</h2>
          <p>Start by analyzing a location on the dashboard to create your first prediction.</p>
          <Link to="/dashboard" className="btn-primary" id="btn-go-dashboard" style={{ display: 'inline-block', marginTop: '1rem' }}>
            ️ Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="history-grid">
          {predictions.map((prediction) => (
            <PredictionCard
              key={prediction.id}
              prediction={prediction}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
