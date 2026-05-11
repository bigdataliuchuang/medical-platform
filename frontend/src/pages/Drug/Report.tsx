import { useEffect, useState } from 'react';
import { Table, Button, Space, Card, DatePicker } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { get } from '../../api/request';

interface ReportItem {
  report_month: string;
  chemo_regimen: string;
  tumor_type: string;
  patient_cnt: number;
  treatment_course_cnt: number;
  drug_name: string;
  total_dose_mg: number;
  drug_expense_total: number;
  completion_rate: number;
  adr_rate: number;
  severe_adr_cnt: number;
}

export default function DrugReport() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportItem[]>([]);
  const [month, setMonth] = useState('');

  const fetchData = (m: string) => {
    setLoading(true);
    get<{ month: string; list: ReportItem[] }>(`/api/drug/report?month=${m}`)
      .then((res) => { setMonth(res.month); setData(res.list); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(''); }, []);

  const columns = [
    { title: '化疗方案', dataIndex: 'chemo_regimen', key: 'chemo_regimen', width: 150 },
    { title: '肿瘤类型', dataIndex: 'tumor_type', key: 'tumor_type', width: 120 },
    { title: '患者数', dataIndex: 'patient_cnt', key: 'patient_cnt', width: 80 },
    { title: '疗程数', dataIndex: 'treatment_course_cnt', key: 'treatment_course_cnt', width: 80 },
    { title: '药品', dataIndex: 'drug_name', key: 'drug_name', width: 140 },
    { title: '总用量(mg)', dataIndex: 'total_dose_mg', key: 'total_dose_mg', width: 110, render: (v: number) => v ? Number(v).toLocaleString() : '-' },
    { title: '药品费用(元)', dataIndex: 'drug_expense_total', key: 'drug_expense_total', width: 120, render: (v: number) => v ? Number(v).toLocaleString() : '-' },
    { title: '完成率', dataIndex: 'completion_rate', key: 'completion_rate', width: 80, render: (v: number) => v ? `${v}%` : '-' },
    { title: 'ADR率', dataIndex: 'adr_rate', key: 'adr_rate', width: 80, render: (v: number) => v ? `${v}%` : '-' },
    { title: '严重ADR', dataIndex: 'severe_adr_cnt', key: 'severe_adr_cnt', width: 80 },
  ];

  const handleExport = () => {
    window.open(`http://localhost:8000/api/drug/report/export?month=${month}`, '_blank');
  };

  const handleMonthChange = (_: unknown, ds: string | null) => {
    if (ds) fetchData(ds);
  };

  return (
    <Card
      title={`月度上报数据 ${month ? `(${month})` : ''}`}
      extra={
        <Space>
          <DatePicker.MonthPicker placeholder="选择月份" onChange={handleMonthChange} />
          <Button icon={<DownloadOutlined />} onClick={handleExport}>导出 CSV</Button>
        </Space>
      }
    >
      <Table dataSource={data} columns={columns} loading={loading} rowKey={(_, i) => String(i)} size="middle" scroll={{ x: 1200 }} pagination={{ pageSize: 15 }} />
    </Card>
  );
}
