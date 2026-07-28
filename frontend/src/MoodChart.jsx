import { useEffect, useState } from 'react';

const SENTIMENT_COLORS = {
  calm: '#e8c98a',
  hopeful: '#f2b872',
  anxious: '#c98a5a',
  sad: '#8a6a6a',
  angry: '#d9574a'
};

const SENTIMENT_Y = { angry: 0, sad: 1, anxious: 2, calm: 3, hopeful: 4 };

function MoodChart({ apiBase = 'http://localhost:5000' }) {
  const [moodLog, setMoodLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiBase}/api/mood-history`)
      .then((res) => res.json())
      .then((data) => {
        setMoodLog(data.moodLog || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apiBase]);

  const containerStyle = {
    background: 'rgba(36, 26, 20, 0.74)',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(232, 165, 92, 0.16)',
    borderRadius: '16px',
    padding: '18px',
    color: '#f3e6d8',
    minHeight: '200px',
    boxSizing: 'border-box'
  };

  if (loading) return <div style={containerStyle} />;

  if (moodLog.length < 3) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#7d6f62', fontSize: '13px', margin: 0 }}>
          Not enough conversation history yet to show a mood trend.
        </p>
      </div>
    );
  }

  const recent = moodLog.slice(-30);
  const width = 600;
  const height = 160;
  const padding = 24;
  const stepX = (width - padding * 2) / Math.max(recent.length - 1, 1);

  const points = recent.map((entry, i) => {
    const x = padding + i * stepX;
    const y = padding + (4 - (SENTIMENT_Y[entry.sentiment] ?? 3)) * ((height - padding * 2) / 4);
    return { x, y, sentiment: entry.sentiment };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div style={containerStyle}>
      <div style={{ fontSize: '13px', marginBottom: '10px', color: '#b3a08e' }}>Mood over recent conversations</div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
        <path d={linePath} fill="none" stroke="#e8a55c" strokeWidth="2" opacity="0.6" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill={SENTIMENT_COLORS[p.sentiment] || '#b3a08e'} />
        ))}
      </svg>
      <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap', fontSize: '11px' }}>
        {Object.entries(SENTIMENT_COLORS).map(([sentiment, color]) => (
          <div key={sentiment} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
            <span style={{ color: '#b3a08e', textTransform: 'capitalize' }}>{sentiment}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MoodChart;