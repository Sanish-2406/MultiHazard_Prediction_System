import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { runTrainingPipeline } from '../services/trainingService';

export default function TrainingPage({ onTrainingComplete }) {
  const [status, setStatus] = useState('idle'); // idle | training | complete | error
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleTrain = async () => {
    setStatus('training');
    setError('');
    setProgress(null);

    try {
      const results = await runTrainingPipeline((prog) => {
        setProgress(prog);
      });

      setStatus('complete');
      onTrainingComplete(results);
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Training failed.');
    }
  };

  return (
    <div className="training-page" id="training-page">
      <div className="training-hero">
        <div className="training-hero-icon"></div>
        <h1>Model Training Module</h1>
        <p>Train machine learning models using NASA multi-hazard dataset with 12 meteorological and terrain features</p>
      </div>

      <div className="training-content">
        {/* Pipeline Info */}
        <div className="card training-info-card">
          <div className="card-header">
            <div className="card-title"> Training Pipeline</div>
          </div>
          <div className="pipeline-steps">
            {[
              { icon: '', label: 'Dataset Generation', desc: '2,000 samples from NASA multi-hazard data' },
              { icon: '', label: 'Preprocessing', desc: 'Normalization, encoding, feature scaling' },
              { icon: '️', label: 'Feature Engineering', desc: '12 features: rainfall, slope, soil moisture, etc.' },
              { icon: '', label: 'Random Forest', desc: 'Ensemble model with 100 decision trees' },
              { icon: '🚀', label: 'XGBoost', desc: 'Extreme Gradient Boosting model for high-accuracy detection' },
              { icon: '', label: 'Evaluation', desc: 'Accuracy, precision, recall, F1, confusion matrix' },
            ].map((step, i) => (
              <div key={i} className={`pipeline-step ${progress && progress.step > i ? 'complete' : ''} ${progress && progress.step === i + 1 ? 'active' : ''}`}>
                <div className="pipeline-step-icon">{step.icon}</div>
                <div className="pipeline-step-info">
                  <div className="pipeline-step-label">{step.label}</div>
                  <div className="pipeline-step-desc">{step.desc}</div>
                </div>
                {progress && progress.step > i && <div className="pipeline-step-check"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Models being trained */}
        <div className="training-models-grid">
          <div className="card model-card">
            <div className="model-card-icon"></div>
            <h3>Random Forest</h3>
            <p>Ensemble of 100 decision trees with bagging for robust multi-class classification</p>
            <div className="model-card-specs">
              <span>100 Trees</span>
              <span>Max Depth: 15</span>
              <span>Min Samples: 5</span>
            </div>
          </div>
          <div className="card model-card">
            <div className="model-card-icon"></div>
            <h3>XGBoost</h3>
            <p>Advanced ensemble model using gradient boosting frameworks for maximal predictive accuracy</p>
            <div className="model-card-specs">
              <span>Learning Rate: 0.05</span>
              <span>Max Depth: 8</span>
              <span>Subsample: 0.8</span>
            </div>
          </div>
        </div>

        {/* Training Status */}
        {status === 'training' && progress && (
          <div className="card training-progress-card">
            <div className="card-header">
              <div className="card-title"><span className="icon">⏳</span> Training in Progress...</div>
              <span className="progress-percent">{progress.percent}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progress.percent}%` }} />
            </div>
            <div className="progress-label">{progress.label}</div>
            <div className="progress-step">Step {progress.step} of {progress.totalSteps}</div>
          </div>
        )}

        {status === 'complete' && (
          <div className="card training-complete-card">
            <div className="training-complete-icon"></div>
            <h2>Training Complete!</h2>
            <p>Both models have been trained and evaluated successfully.</p>
            <button
              className="btn-primary btn-lg"
              onClick={() => navigate('/results')}
              id="btn-view-results"
            >
               View Training Results
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="form-error" style={{ marginTop: 'var(--space-lg)' }}>
            ️ {error}
          </div>
        )}

        {/* Train Button */}
        {status === 'idle' && (
          <div className="training-action">
            <button
              className="btn-primary btn-lg train-button"
              onClick={handleTrain}
              id="btn-train-model"
            >
              <span className="train-icon"></span>
              Train Model
            </button>
            <p className="training-note">
              This will generate a synthetic NASA dataset and train two ML models for comparison.
              <br />Estimated time: ~7 seconds.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
