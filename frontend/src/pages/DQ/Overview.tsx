import { useEffect, useState } from 'react';
import { Row, Col, Card, Spin } from 'antd';
import ReactECharts from 'echarts-for-react';
import KpiCard from '../../components/KpiCard';
import { get } from '../../api/request';

interface LayerItem {
  layer: string;
  score: number;
  critical: number;
  high: number;
}

interface SummaryData {
  overall_score: number;
  layers: LayerItem[];
}

export default function DQOverview() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SummaryData>({ overall_score: 0, layers: [] });

  useEffect(() => {
    get('/api/dq/summary').then((res) => {
      setData(res as SummaryData);
    }).finally(() => setLoading(false));
  }, []);

  const gaugeOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        detail: { formatter: '{value}%', fontSize: 24, offsetCenter: [0, '60%'] },
        data: [{ value: data.overall_score, name: '综合评分' }],
        axisLine: {
          lineStyle: {
            width: 20,
            color: [
              [0.75, '#cf1322'],
              [0.9, '#d48806'],
              [1, '#3f8600'],
            ],
          },
        },
        pointer: { itemStyle: { color: 'auto' } },
      },
    ],
  };

  const barOption = {
    xAxis: { type: 'value', max: 100 },
    yAxis: { type: 'category', data: data.layers.map((l) => l.layer) },
    series: [
      {
        type: 'bar',
        data: data.layers.map((l) => ({
          value: l.score,
          itemStyle: { color: l.score >= 90 ? '#3f8600' : l.score >= 75 ? '#d48806' : '#cf1322' },
        })),
        label: { show: true, position: 'right', formatter: '{c}分' },
      },
    ],
    grid: { left: 60, right: 60, top: 10, bottom: 10 },
    tooltip: {},
  };

  const totalCritical = data.layers.reduce((s, l) => s + l.critical, 0);
  const totalHigh = data.layers.reduce((s, l) => s + l.high, 0);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />;

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <KpiCard title="综合评分" value={data.overall_score} precision={1} status={data.overall_score < 75 ? 'error' : data.overall_score < 90 ? 'warning' : 'normal'} />
        </Col>
        <Col span={6}>
          <KpiCard title="CRITICAL" value={totalCritical} status={totalCritical > 0 ? 'error' : 'normal'} />
        </Col>
        <Col span={6}>
          <KpiCard title="HIGH" value={totalHigh} status={totalHigh > 0 ? 'warning' : 'normal'} />
        </Col>
        <Col span={6}>
          <KpiCard title="数据层数" value={data.layers.length} unit="层" />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={10}>
          <Card title="综合评分仪表盘">
            <ReactECharts option={gaugeOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={14}>
          <Card title="各层评分">
            <ReactECharts option={barOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </>
  );
}
