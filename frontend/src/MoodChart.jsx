import { useEffect, useState } from 'react';
import { theme } from '../theme';
import { getOrCreateUserId } from '../utils/userId';

const SENTIMENT_COLORS = {
  calm: 'var(--accent-purple)',
  hopeful: 'var(--accent-teal)',
  anxious: '#8b7aa8',
  sad: '#6b5b8a',
  angry: 'var(--accent-rose)'
};

const SENTIMENT_Y = { angry: 0, sad: 1, anxious: 2, calm: 3, hopeful: 4 };

function MoodChart({ apiBase = 'http://localhost:5000' }) {
  const [moodLog, setMoodLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiBase}/api/mood-history`, { headers: { 'X-User-Id': getOrCreateUserId() } })
      .then((res) => res.json())
      .then((data) => {
        setMoodLog(data.moodLog || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apiBase]);

  const containerStyle = {
    background: theme.panel,
    backdropFilter: 'blur(6px)',
    border: `1px solid ${theme.border}`,
    borderRadius: '16px',
    padding: '18px',
    color: theme.cream,
    minHeight: '200px',
    boxSizing: 'border-box'
  };

  if (loading) return <div style={containerStyle} />;

  if (moodLog.length < 3) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: theme.mutedDim, fontSize: '13px', margin: 0 }}>
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
      <div style={{ fontSize: '13px', marginBottom: '10px', color: theme.muted }}>Mood over recent conversations</div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
        <path d={linePath} fill="none" stroke={theme.purple} strokeWidth="2" opacity="0.6" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill={SENTIMENT_COLORS[p.sentiment] || theme.muted} />
        ))}
      </svg>
      <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap', fontSize: '11px' }}>
        {Object.entries(SENTIMENT_COLORS).map(([sentiment, color]) => (
          <div key={sentiment} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
            <span style={{ color: theme.muted, textTransform: 'capitalize' }}>{sentiment}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MoodChart;