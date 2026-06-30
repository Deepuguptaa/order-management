export default function StatusBadge({ status, colorMap }) {
  const colors = colorMap[status] || { fg: '#8b92a3', bg: '#2a2f3a' };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.03em',
        fontFamily: 'var(--font-mono)',
        color: colors.fg,
        background: colors.bg,
        whiteSpace: 'nowrap',
      }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
