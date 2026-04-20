import { useState, useEffect } from 'react';
import { fetchLiveNewsStreams } from '../services/youtubeService';

export default function LiveStreamSection({ locationName }) {
  const [activeChannel, setActiveChannel] = useState('');
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    
    fetchLiveNewsStreams(locationName).then(fetchedChannels => {
      if (active) {
        setChannels(fetchedChannels);
        if (fetchedChannels.length > 0) {
          setActiveChannel(fetchedChannels[0].id);
        } else {
          setActiveChannel('');
        }
        setLoading(false);
      }
    });

    return () => { active = false; };
  }, [locationName]);

  if (!activeChannel && !loading) return null;

  return (
    <div className="card" style={{ marginTop: 'var(--space-lg)', borderTop: '4px solid var(--accent-blue)' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div className="card-title">
           Live Regional News Streams
           {locationName && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '8px', fontWeight: 'normal' }}>({locationName.split(',')[0].replace(/📍\s*/, '')})</span>}
        </div>
        
        {!loading && channels.length > 0 && (
          <select 
            className="form-input" 
            style={{ width: 'auto', padding: '4px 8px' }}
            value={activeChannel}
            onChange={(e) => setActiveChannel(e.target.value)}
          >
            {channels.map(ch => (
               <option key={ch.id} value={ch.id}>{ch.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
           Fetching local news broadcasts...
        </div>
      ) : (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 'var(--radius-sm)' }}>
          <iframe 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
            src={`https://www.youtube.com/embed/${activeChannel}?autoplay=1&mute=1`} 
            title="Live News Stream" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}
