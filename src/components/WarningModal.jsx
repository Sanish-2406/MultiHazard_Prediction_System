import { useEffect, useState } from 'react';

export default function WarningModal({ prediction, locationName, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (prediction) {
      const maxScore = Math.max(prediction.floodScore, prediction.landslideScore);
      if (maxScore >= 40) { // High or Critical
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }
  }, [prediction]);

  if (!isVisible || !prediction) return null;

  const isFloodHigh = prediction.floodScore >= 40;
  const isLandslideHigh = prediction.landslideScore >= 40;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(5px)'
    }}>
      <div 
        className="card" 
        style={{ 
          maxWidth: '500px', 
          backgroundColor: '#3f0f0f', 
          borderColor: '#ef4444', 
          borderWidth: '2px', 
          boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)',
          animation: 'pulseGlow 2s infinite'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
          <span style={{ fontSize: '3rem' }}>️</span>
          <h2 style={{ color: '#fca5a5', marginTop: 'var(--space-sm)' }}>URGENT RISK WARNING</h2>
        </div>
        
        <p style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
          High risk conditions detected at your current location: <strong>{locationName}</strong>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
          {isFloodHigh && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)' }}>
              <strong> HIGH FLOOD RISK DETECTED</strong>
              <div style={{ fontSize: '0.85rem', color: '#fca5a5', marginTop: '4px' }}>
                {prediction.floodFactors.find(f => f.impact.includes('High') || f.impact === 'Critical')?.detail || 'Immediate protective action may be required.'}
              </div>
            </div>
          )}
          {isLandslideHigh && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)' }}>
              <strong>️ LANDSLIDE RISK WARNING</strong>
              <div style={{ fontSize: '0.85rem', color: '#fca5a5', marginTop: '4px' }}>
                {prediction.landslideFactors.find(f => f.impact.includes('High') || f.impact === 'Critical')?.detail || 'Steep slopes may be unstable. Avoid hillside travel.'}
              </div>
            </div>
          )}
        </div>

        <div style={{ fontSize: '0.9rem', marginBottom: 'var(--space-lg)', padding: 'var(--space-sm)', borderLeft: '3px solid #ef4444' }}>
          <strong>Timing:</strong> {prediction.riskTiming}
        </div>

        <button 
          className="btn-primary" 
          style={{ width: '100%', backgroundColor: '#ef4444', color: 'white' }}
          onClick={() => {
            setIsVisible(false);
            if (onClose) onClose();
          }}
        >
          I Understand, Close Alert
        </button>
      </div>

      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.8); }
          100% { box-shadow: 0 0 0 rgba(239, 68, 68, 0.4); }
        }
      `}</style>
    </div>
  );
}
