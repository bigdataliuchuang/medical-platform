import { Card, Statistic } from 'antd';

interface KpiCardProps {
  title: string;
  value: number | string;
  unit?: string;
  status?: 'normal' | 'warning' | 'error';
  precision?: number;
}

export default function KpiCard({ title, value, unit, status = 'normal', precision }: KpiCardProps) {
  const color = status === 'error' ? '#cf1322' : status === 'warning' ? '#d48806' : '#3f8600';

  return (
    <Card>
      <Statistic
        title={title}
        value={value}
        suffix={unit}
        precision={precision}
        valueStyle={{ color, fontWeight: 600 }}
      />
    </Card>
  );
}
