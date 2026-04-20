import { useState, useEffect } from 'react';
import { fetchLocalNews } from '../services/newsService';

export default function NewsSection({ prediction, locationName }) {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    
    fetchLocalNews(locationName, prediction)
      .then(fetchedNews => {
        if (active) {
          setNews(fetchedNews);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [prediction, locationName]);

  return (
    <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
      <div className="card-header">
        <div className="card-title"> Local News Alerts: {locationName?.split(',')[0] || 'Select Location'}</div>
      </div>
      <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
        {isLoading && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}> Fetching latest regional news...</div>}
        
        {!isLoading && news.map((item, index) => (
          <div key={index} style={{ padding: 'var(--space-md)', background: 'var(--surface-color)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <h4 style={{ color: item.title.includes('URGENT') || item.title.includes('ALERT') ? 'var(--error-color)' : 'var(--text-primary)', marginBottom: '4px' }}>
                {item.title}
              </h4>
            </a>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {item.source} • {item.time}
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.desc}</p>
          </div>
        ))}

        {!isLoading && news.length === 0 && (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No current news affecting this region.</p>
        )}
      </div>
    </div>
  );
}
