import { useEffect, useState } from 'react';
import { Row, Col, Card, Spin, Table } from 'antd';
import ReactECharts from 'echarts-for-react';
import KpiCard from '../../components/KpiCard';
import { get } from '../../api/request';

interface ExpenseSummary {
  total_expense: number;
  total_patient: number;
  avg_expense: number;
  drug_ratio: number;
}

interface TumorExpense {
  tumor_type: string;
  patient_cnt: number;
  avg_expense: number;
  drug_expense: number;
  exam_expense: number;
  surgery_expense: number;
  other_expense: number;
  drug_ratio: number;
}

function fmtWan(v: number) {
  return v >= 10000 ? `${(v / 10000).toFixed(1)}万` : v.toLocaleString();
}

export default function Expense() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ExpenseSummary>({ total_expense: 0, total_patient: 0, avg_expense: 0, drug_ratio: 0 });
  const [tumors, setTumors] = useState<TumorExpense[]>([]);

  useEffect(() => {
    Promise.all([
      get<ExpenseSummary>('/api/expense/summary'),
      get<TumorExpense[]>('/api/expense/by-tumor-type'),
    ]).then(([s, t]) => { setSummary(s); setTumors(t); }).finally(() => setLoading(false));
  }, []);

  const barOption = {
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: tumors.map((t) => t.tumor_type).reverse() },
    series: [
      {
        type: 'bar',
        data: tumors.map((t) => t.avg_expense).reverse(),
        label: {
          show: true,
          position: 'right' as const,
          formatter: (p: { value: number }) => `${(p.value / 10000).toFixed(1)}万`,
        },
      },
    ],
    grid: { left: 80, right: 60, top: 10, bottom: 10 },
    tooltip: { formatter: (p: { name: string; value: number }) => `${p.name}: ¥${p.value.toLocaleString()}` },
  };

  const firstTumor = tumors[0];
  const pieOption = firstTumor
    ? {
        tooltip: { trigger: 'item' as const, formatter: '{b}: ¥{c} ({d}%)' },
        legend: { bottom: 0 },
        series: [
          {
            type: 'pie' as const,
            radius: ['40%', '65%'],
            data: [
              { value: firstTumor.drug_expense, name: '药品费' },
              { value: firstTumor.exam_expense, name: '检查费' },
              { value: firstTumor.surgery_expense, name: '手术费' },
              { value: firstTumor.other_expense, name: '其他' },
            ],
          },
        ],
      }
    : {};

  const columns = [
    { title: '肿瘤类型', dataIndex: 'tumor_type', key: 'tumor_type', width: 120 },
    { title: '患者数', dataIndex: 'patient_cnt', key: 'patient_cnt', width: 80 },
    { title: '人均费用', dataIndex: 'avg_expense', key: 'avg_expense', width: 120, render: (v: number) => `¥${fmtWan(v)}` },
    { title: '药品费', dataIndex: 'drug_expense', key: 'drug_expense', width: 120, render: (v: number) => `¥${fmtWan(v)}` },
    { title: '检查费', dataIndex: 'exam_expense', key: 'exam_expense', width: 120, render: (v: number) => `¥${fmtWan(v)}` },
    { title: '手术费', dataIndex: 'surgery_expense', key: 'surgery_expense', width: 120, render: (v: number) => `¥${fmtWan(v)}` },
    { title: '药占比', dataIndex: 'drug_ratio', key: 'drug_ratio', width: 80, render: (v: number) => `${v}%` },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />;

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <KpiCard title="医疗总费用" value={fmtWan(summary.total_expense)} unit="元" />
        </Col>
        <Col span={6}>
          <KpiCard title="就诊患者数" value={summary.total_patient} />
        </Col>
        <Col span={6}>
          <KpiCard title="人均费用" value={fmtWan(summary.avg_expense)} unit="元" />
        </Col>
        <Col span={6}>
          <KpiCard title="药占比" value={summary.drug_ratio} precision={1} unit="%" status={summary.drug_ratio > 60 ? 'warning' : 'normal'} />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={14}>
          <Card title="各肿瘤类型人均费用">
            <ReactECharts option={barOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={10}>
          <Card title={firstTumor ? `${firstTumor.tumor_type} 费用构成` : '费用构成'}>
            {firstTumor ? <ReactECharts option={pieOption} style={{ height: 300 }} /> : <div style={{ height: 300, textAlign: 'center', lineHeight: '300px', color: '#999' }}>暂无数据</div>}
          </Card>
        </Col>
      </Row>

      <Card title="各肿瘤类型费用明细">
        <Table dataSource={tumors} columns={columns} rowKey="tumor_type" size="middle" pagination={false} />
      </Card>
    </>
  );
}
