import { useState, useEffect } from 'react';
import { fetchSchedulerLogs } from '../api/client';

const STATUS_STYLE = {
  SUCCESS: { color: '#4fd1a5', bg: '#2d5f4d' },
  PARTIAL_FAILURE: { color: '#e3b341', bg: '#3d3320' },
  FAILURE: { color: '#e8635f', bg: '#3d2524' },
};

export default function SchedulerLogsPanel() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    fetchSchedulerLogs({ limit: 10 })
      .then((res) => setLogs(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
      }}
    >
      <h3 style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Scheduler Runs
      </h3>

      {isLoading && <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading logs...</p>}
      {error && <p style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</p>}
      {!isLoading && !error && logs.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No scheduler runs recorded yet.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {logs.map((log) => {
          const style = STATUS_STYLE[log.status] || STATUS_STYLE.FAILURE;
          return (
            <div
              key={log._id}
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                    color: style.color, background: style.bg, fontFamily: 'var(--font-mono)',
                  }}
                >
                  {log.status}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {log.ordersScanned} scanned / {log.ordersUpdated} updated / {log.durationMs}ms
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1px 6px', fontFamily: 'var(--font-mono)' }}>
                  {log.triggeredBy}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(log.runAt).toLocaleString()}
                </span>
              </div>
              {log.transitions && log.transitions.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {log.transitions.map((t, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--surface)',
                        border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 8px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {t.orderId}: {t.fromStatus} to {t.toStatus}
                    </span>
                  ))}
                </div>
              )}
              {log.errorMessage && (
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--danger)' }}>{log.errorMessage}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
