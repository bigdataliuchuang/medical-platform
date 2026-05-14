interface KpiCardProps {
  title: string;
  value: number | string;
  unit?: string;
  status?: 'normal' | 'warning' | 'error' | 'neutral';
  precision?: number;
  sub?: string;
  icon?: React.ReactNode;
}

export default function KpiCard({ title, value, unit, status = 'neutral', precision, sub, icon }: KpiCardProps) {
  const displayed = precision != null && typeof value === 'number'
    ? value.toFixed(precision)
    : value;

  return (
    <div className={`kpi-card kpi-${status}`}>
      <div className="kpi-label">
        <span>{title}</span>
        {icon && <span style={{ fontSize: 14, opacity: 0.7 }}>{icon}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, margin: '4px 0 0' }}>
        <div className={`kpi-value kpi-value-${status}`}>{displayed}</div>
        {unit && <span style={{ fontSize: 13, color: 'var(--tx2)', fontWeight: 500 }}>{unit}</span>}
      </div>
      {sub && <div className="kpi-footer"><span>{sub}</span></div>}
    </div>
  );
}
