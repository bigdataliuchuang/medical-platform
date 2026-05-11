import { useEffect, useState } from 'react';
import { Row, Col, Card, Spin } from 'antd';
import ReactECharts from 'echarts-for-react';
import KpiCard from '../../components/KpiCard';
import { get } from '../../api/request';

interface MpiSummary {
  source_count: number;
  mpi_count: number;
  dedup_rate: number;
  exact_match: number;
  fuzzy_match: number;
  unmatched: number;
}

export default function MPISummary() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MpiSummary>({ source_count: 0, mpi_count: 0, dedup_rate: 0, exact_match: 0, fuzzy_match: 0, unmatched: 0 });

  useEffect(() => {
    get<MpiSummary>('/api/mpi/summary').then(setData).finally(() => setLoading(false));
  }, []);

  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        label: { formatter: '{b}\n{d}%' },
        data: [
          { value: data.exact_match, name: '精确匹配', itemStyle: { color: '#3f8600' } },
          { value: data.fuzzy_match, name: '模糊匹配', itemStyle: { color: '#d48806' } },
          { value: data.unmatched, name: '未匹配', itemStyle: { color: '#cf1322' } },
        ],
      },
    ],
  };

  const gaugeOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        detail: { formatter: '{value}%', fontSize: 24, offsetCenter: [0, '60%'] },
        data: [{ value: data.dedup_rate, name: '去重率' }],
        axisLine: {
          lineStyle: {
            width: 20,
            color: [[0.5, '#cf1322'], [0.8, '#d48806'], [1, '#3f8600']],
          },
        },
        pointer: { itemStyle: { color: 'auto' } },
      },
    ],
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />;

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <KpiCard title="来源患者数" value={data.source_count} />
        </Col>
        <Col span={8}>
          <KpiCard title="MPI去重患者数" value={data.mpi_count} />
        </Col>
        <Col span={8}>
          <KpiCard title="去重率" value={data.dedup_rate} precision={1} unit="%" status={data.dedup_rate > 10 ? 'warning' : 'normal'} />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="匹配方式分布">
            <ReactECharts option={pieOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="去重率仪表盘">
            <ReactECharts option={gaugeOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </>
  );
}
