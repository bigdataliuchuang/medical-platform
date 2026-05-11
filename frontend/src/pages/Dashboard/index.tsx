import { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Spin } from 'antd';
import ReactECharts from 'echarts-for-react';
import KpiCard from '../../components/KpiCard';
import { get } from '../../api/request';

interface Overview {
  dq_score: number;
  critical_fail: number;
  mpi_patient: number;
}

interface TrendItem {
  date: string;
  score: number;
}

interface PipelineItem {
  layer: string;
  last_update: string;
  status: string;
}

interface AlertItem {
  check_time: string;
  rule_name: string;
  table_name: string;
  severity: string;
  issue_count: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview>({ dq_score: 0, critical_fail: 0, mpi_patient: 0 });
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    Promise.all([
      get('/api/dashboard/overview'),
      get('/api/dq/trend?days=30'),
      get('/api/dashboard/pipeline-status'),
      get('/api/dashboard/alerts?limit=10'),
    ]).then(([ov, tr, pl, al]) => {
      setOverview(ov as Overview);
      setTrend(tr as TrendItem[]);
      setPipeline(pl as PipelineItem[]);
      setAlerts(al as AlertItem[]);
    }).finally(() => setLoading(false));
  }, []);

  const trendOption = {
    xAxis: { type: 'category', data: trend.map((t) => t.date) },
    yAxis: { type: 'value', min: 0, max: 100 },
    series: [
      {
        data: trend.map((t) => t.score),
        type: 'line',
        smooth: true,
        areaStyle: { color: 'rgba(24,144,255,0.1)' },
        markArea: {
          data: [[{ yAxis: 0 }, { yAxis: 75, itemStyle: { color: 'rgba(255,77,79,0.1)' } }]],
        },
      },
    ],
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
  };

  const pipelineColumns = [
    { title: '数据层', dataIndex: 'layer', key: 'layer' },
    { title: '最后更新', dataIndex: 'last_update', key: 'last_update' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => s === 'ok' ? <Tag color="green">✓</Tag> : <Tag color="red">✗</Tag>,
    },
  ];

  const alertColumns = [
    { title: '时间', dataIndex: 'check_time', key: 'check_time' },
    { title: '规则', dataIndex: 'rule_name', key: 'rule_name' },
    { title: '表', dataIndex: 'table_name', key: 'table_name' },
    {
      title: '级别',
      dataIndex: 'severity',
      key: 'severity',
      render: (s: string) => <Tag color={s === 'CRITICAL' ? 'red' : 'orange'}>{s}</Tag>,
    },
    { title: '问题数', dataIndex: 'issue_count', key: 'issue_count' },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />;

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <KpiCard title="DQ综合评分" value={overview.dq_score} precision={1} status={overview.dq_score < 75 ? 'error' : 'normal'} />
        </Col>
        <Col span={6}>
          <KpiCard title="CRITICAL失败数" value={overview.critical_fail} status={overview.critical_fail > 0 ? 'error' : 'normal'} />
        </Col>
        <Col span={6}>
          <KpiCard title="MPI去重患者数" value={overview.mpi_patient} />
        </Col>
        <Col span={6}>
          <KpiCard title="数据管道" value={pipeline.filter((p) => p.status === 'error').length} unit="个异常" status={pipeline.some((p) => p.status === 'error') ? 'warning' : 'normal'} />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={14}>
          <Card title="近30日DQ评分趋势">
            {trend.length > 0 ? <ReactECharts option={trendOption} style={{ height: 280 }} /> : <div style={{ height: 280, textAlign: 'center', lineHeight: '280px', color: '#999' }}>暂无数据</div>}
          </Card>
        </Col>
        <Col span={10}>
          <Card title="数据管道状态">
            <Table dataSource={pipeline} columns={pipelineColumns} pagination={false} size="small" rowKey="layer" />
          </Card>
        </Col>
      </Row>

      <Card title="最近告警">
        <Table dataSource={alerts} columns={alertColumns} pagination={false} size="small" rowKey={(_, i) => String(i)} />
      </Card>
    </>
  );
}
