import { useEffect, useState } from 'react';
import { Row, Col, Card, Spin, Table } from 'antd';
import ReactECharts from 'echarts-for-react';
import KpiCard from '../../components/KpiCard';
import { get } from '../../api/request';

interface Overview {
  avg_inpatient_days: number;
  long_stay_rate: number;
  readmission_30d_rate: number;
  surgery_cnt: number;
  complication_rate: number;
  mortality_rate: number;
  critical_timely_rate: number;
  tumor_patient_cnt: number;
  tumor_avg_inpatient_days: number;
}

interface DeptItem {
  dept_name: string;
  avg_inpatient_days: number;
  surgery_cnt: number;
  complication_rate: number;
  readmission_30d_rate: number;
  mortality_rate: number;
}

interface TrendItem {
  date: string;
  avg_inpatient_days: number;
  surgery_cnt: number;
  complication_rate: number;
}

interface QualityData {
  overview: Overview;
  departments: DeptItem[];
  trend: TrendItem[];
}

export default function Inpatient() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<QualityData>({ overview: {} as Overview, departments: [], trend: [] });

  useEffect(() => {
    get<QualityData>('/api/inpatient/quality').then(setData).finally(() => setLoading(false));
  }, []);

  const { overview: ov, departments, trend } = data;

  const barOption = {
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: departments.map((d) => d.dept_name).reverse() },
    series: [
      {
        type: 'bar',
        data: departments.map((d) => d.avg_inpatient_days).reverse(),
        label: { show: true, position: 'right' as const, formatter: '{c}天' },
      },
    ],
    grid: { left: 100, right: 60, top: 10, bottom: 10 },
    tooltip: {},
  };

  const surgeryBarOption = {
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: departments.map((d) => d.dept_name).reverse() },
    series: [
      {
        type: 'bar',
        data: departments.map((d) => d.surgery_cnt).reverse(),
        label: { show: true, position: 'right' as const },
      },
    ],
    grid: { left: 100, right: 60, top: 10, bottom: 10 },
    tooltip: {},
  };

  const trendOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { bottom: 0 },
    xAxis: { type: 'category' as const, data: trend.map((t) => t.date) },
    yAxis: [
      { type: 'value' as const, name: '住院天数', position: 'left' },
      { type: 'value' as const, name: '手术量', position: 'right' },
    ],
    series: [
      {
        name: '平均住院天数',
        type: 'line' as const,
        data: trend.map((t) => t.avg_inpatient_days),
        smooth: true,
        itemStyle: { color: '#1890ff' },
      },
      {
        name: '手术量',
        type: 'bar' as const,
        yAxisIndex: 1,
        data: trend.map((t) => t.surgery_cnt),
        itemStyle: { color: '#52c41a' },
      },
    ],
    grid: { left: 60, right: 60, top: 20, bottom: 50 },
  };

  const deptColumns = [
    { title: '科室', dataIndex: 'dept_name', key: 'dept_name', width: 120 },
    { title: '平均住院天数', dataIndex: 'avg_inpatient_days', key: 'avg_inpatient_days', width: 120, render: (v: number) => `${v}天` },
    { title: '手术量', dataIndex: 'surgery_cnt', key: 'surgery_cnt', width: 80 },
    { title: '并发症率', dataIndex: 'complication_rate', key: 'complication_rate', width: 100, render: (v: number) => `${v}%` },
    { title: '再入院率', dataIndex: 'readmission_30d_rate', key: 'readmission_30d_rate', width: 100, render: (v: number) => `${v}%` },
    { title: '死亡率', dataIndex: 'mortality_rate', key: 'mortality_rate', width: 80, render: (v: number) => `${v}‰` },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />;

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <KpiCard title="平均住院天数" value={ov.avg_inpatient_days} precision={1} unit="天" status={ov.avg_inpatient_days > 14 ? 'warning' : 'normal'} />
        </Col>
        <Col span={6}>
          <KpiCard title="手术量" value={ov.surgery_cnt} unit="台" />
        </Col>
        <Col span={6}>
          <KpiCard title="并发症率" value={ov.complication_rate} precision={1} unit="%" status={ov.complication_rate > 5 ? 'error' : 'normal'} />
        </Col>
        <Col span={6}>
          <KpiCard title="危急值处置及时率" value={ov.critical_timely_rate} precision={1} unit="%" status={ov.critical_timely_rate < 90 ? 'error' : 'normal'} />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <KpiCard title="30天再入院率" value={ov.readmission_30d_rate} precision={1} unit="%" status={ov.readmission_30d_rate > 8 ? 'warning' : 'normal'} />
        </Col>
        <Col span={6}>
          <KpiCard title="长期住院率" value={ov.long_stay_rate} precision={1} unit="%" status={ov.long_stay_rate > 10 ? 'warning' : 'normal'} />
        </Col>
        <Col span={6}>
          <KpiCard title="肿瘤住院患者" value={ov.tumor_patient_cnt} unit="人" />
        </Col>
        <Col span={6}>
          <KpiCard title="肿瘤平均住院天数" value={ov.tumor_avg_inpatient_days} precision={1} unit="天" />
        </Col>
      </Row>

      {trend.length > 0 && (
        <Card title="近30天趋势" style={{ marginBottom: 24 }}>
          <ReactECharts option={trendOption} style={{ height: 280 }} />
        </Card>
      )}

      <Row gutter={16}>
        <Col span={12}>
          <Card title="科室住院天数对比">
            <ReactECharts option={barOption} style={{ height: Math.max(300, departments.length * 30) }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="科室手术量对比">
            <ReactECharts option={surgeryBarOption} style={{ height: Math.max(300, departments.length * 30) }} />
          </Card>
        </Col>
      </Row>

      <Card title="科室质量明细" style={{ marginTop: 16 }}>
        <Table dataSource={departments} columns={deptColumns} rowKey="dept_name" size="middle" pagination={false} />
      </Card>
    </>
  );
}
