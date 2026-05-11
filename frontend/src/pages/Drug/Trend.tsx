import { useEffect, useState } from 'react';
import { Card, Radio, Spin, Table, Tag } from 'antd';
import ReactECharts from 'echarts-for-react';
import { get } from '../../api/request';

interface TrendData {
  months: string[];
  series: { drug_category: string; data: number[] }[];
}

interface AlertItem {
  detect_time: string;
  rule_name: string;
  table_name: string;
  severity: string;
  issue_cnt: number;
}

export default function DrugTrend() {
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(6);
  const [trend, setTrend] = useState<TrendData>({ months: [], series: [] });
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      get<TrendData>(`/api/drug/trend?months=${months}`),
      get<AlertItem[]>('/api/drug/alerts'),
    ]).then(([t, a]) => { setTrend(t); setAlerts(a); }).finally(() => setLoading(false));
  }, [months]);

  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    xAxis: { type: 'category', data: trend.months },
    yAxis: { type: 'value', name: '患者数' },
    series: trend.series.map((s, i) => ({
      name: s.drug_category,
      type: 'line',
      smooth: true,
      data: s.data,
      itemStyle: { color: colors[i % colors.length] },
    })),
    grid: { left: 60, right: 20, top: 20, bottom: 50 },
  };

  const alertColumns = [
    { title: '时间', dataIndex: 'detect_time', key: 'detect_time', width: 180 },
    { title: '规则', dataIndex: 'rule_name', key: 'rule_name', width: 180 },
    { title: '表', dataIndex: 'table_name', key: 'table_name', ellipsis: true },
    {
      title: '级别',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (s: string) => <Tag color={s === 'CRITICAL' ? 'red' : 'orange'}>{s}</Tag>,
    },
    { title: '问题数', dataIndex: 'issue_cnt', key: 'issue_cnt', width: 80 },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />;

  return (
    <>
      <Card
        title="抗肿瘤药物用量趋势"
        extra={
          <Radio.Group value={months} onChange={(e) => setMonths(e.target.value)}>
            <Radio.Button value={3}>3个月</Radio.Button>
            <Radio.Button value={6}>6个月</Radio.Button>
            <Radio.Button value={12}>12个月</Radio.Button>
          </Radio.Group>
        }
      >
        {trend.months.length > 0 ? (
          <ReactECharts option={trendOption} style={{ height: 320 }} />
        ) : (
          <div style={{ height: 320, textAlign: 'center', lineHeight: '320px', color: '#999' }}>暂无数据</div>
        )}
      </Card>

      <Card title="近7天药物相关告警" style={{ marginTop: 16 }}>
        <Table dataSource={alerts} columns={alertColumns} rowKey={(_, i) => String(i)} size="small" pagination={false} />
      </Card>
    </>
  );
}
