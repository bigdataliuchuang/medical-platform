import { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Spin } from 'antd';
import ReactECharts from 'echarts-for-react';
import KpiCard from '../../components/KpiCard';
import {
  SafetyOutlined, WarningOutlined, TeamOutlined, DeploymentUnitOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { get } from '../../api/request';

interface Overview { dq_score: number; critical_fail: number; mpi_patient: number; }
interface TrendItem { date: string; score: number; }
interface PipelineItem { layer: string; last_update: string; status: string; }
interface AlertItem { check_time: string; rule_name: string; table_name: string; severity: string; issue_count: number; }

function SevTag({ sev }: { sev: string }) {
  const cls = sev === 'CRITICAL' ? 'sev-critical' : sev === 'HIGH' ? 'sev-high' : 'sev-medium';
  return <span className={`sev-tag ${cls}`}>● {sev}</span>;
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
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const trendOption = {
    tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>DQ 评分：<b>${p[0].value}</b>` },
    grid: { left: 44, right: 16, top: 16, bottom: 28 },
    xAxis: {
      type: 'category', data: trend.map((t) => t.date), boundaryGap: false,
      axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11, interval: 4 },
    },
    yAxis: {
      type: 'value', min: 70, max: 100,
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    series: [{
      type: 'line', data: trend.map((t) => t.score), smooth: true, symbol: 'none',
      lineStyle: { color: '#2563eb', width: 2 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(37,99,235,.10)' }, { offset: 1, color: 'rgba(37,99,235,0)' }] } },
      markLine: { silent: true, symbol: 'none', lineStyle: { color: '#dc2626', type: 'dashed', width: 1 }, data: [{ yAxis: 75, label: { formatter: '告警线 75', color: '#dc2626', fontSize: 11 } }] },
    }],
  };

  const pipelineColumns = [
    { title: '层级', dataIndex: 'layer', key: 'layer', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '最后更新', dataIndex: 'last_update', key: 'last_update', render: (v: string) => <span style={{ color: 'var(--tx2)', fontSize: 12 }}>{v}</span> },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => s === 'ok'
        ? <span className="sev-tag tag-ok"><CheckCircleOutlined /> 正常</span>
        : <span className="sev-tag tag-err"><CloseCircleOutlined /> 异常</span>,
    },
  ];

  const alertColumns = [
    { title: '时间', dataIndex: 'check_time', key: 'check_time', render: (v: string) => <span style={{ color: 'var(--tx2)', fontSize: 12, whiteSpace: 'nowrap' as const }}>{v}</span> },
    { title: '规则', dataIndex: 'rule_name', key: 'rule_name', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '目标表', dataIndex: 'table_name', key: 'table_name', render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--tx2)' }}>{v}</span> },
    { title: '级别', dataIndex: 'severity', key: 'severity', render: (s: string) => <SevTag sev={s} /> },
    { title: '问题数', dataIndex: 'issue_count', key: 'issue_count', render: (v: number) => <span style={{ fontWeight: 600 }}>{v}</span> },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={16}>
        <Col span={6}><KpiCard title="DQ 综合评分" value={overview.dq_score} precision={1} status={overview.dq_score < 75 ? 'error' : 'normal'} sub="较昨日 +0.4 分" icon={<SafetyOutlined />} /></Col>
        <Col span={6}><KpiCard title="CRITICAL 失败" value={overview.critical_fail} status={overview.critical_fail > 0 ? 'error' : 'normal'} sub="需立即处理" icon={<WarningOutlined />} /></Col>
        <Col span={6}><KpiCard title="MPI 去重患者" value={overview.mpi_patient.toLocaleString()} status="neutral" sub="较上月 +203 人" icon={<TeamOutlined />} /></Col>
        <Col span={6}><KpiCard title="管道异常" value={pipeline.filter((p) => p.status === 'error').length} unit="个" status={pipeline.some((p) => p.status === 'error') ? 'warning' : 'normal'} sub="DWS 汇总层" icon={<DeploymentUnitOutlined />} /></Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card title="近 30 日 DQ 评分趋势">
            {trend.length > 0
              ? <ReactECharts option={trendOption} style={{ height: 260 }} theme="med" />
              : <div style={{ height: 260, textAlign: 'center', lineHeight: '260px', color: '#999' }}>暂无数据</div>}
          </Card>
        </Col>
        <Col span={10}>
          <Card title="数据管道状态">
            <Table dataSource={pipeline} columns={pipelineColumns} pagination={false} size="small" rowKey="layer" />
          </Card>
        </Col>
      </Row>

      <Card title="最近告警" extra={<span style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>查看全部 →</span>}>
        <Table dataSource={alerts} columns={alertColumns} pagination={false} size="small" rowKey={(_, i) => String(i)} />
      </Card>
    </div>
  );
}
