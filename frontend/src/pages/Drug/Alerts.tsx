import { useEffect, useState } from 'react';
import { Table, Tag, Select, Space } from 'antd';
import { get } from '../../api/request';

interface AlertItem {
  detect_time: string;
  rule_name: string;
  table_name: string;
  severity: string;
  issue_cnt: number;
}

export default function DrugAlerts() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AlertItem[]>([]);
  const [severity, setSeverity] = useState<string | undefined>();

  useEffect(() => {
    get<AlertItem[]>('/api/drug/alerts').then(setData).finally(() => setLoading(false));
  }, []);

  const filtered = severity ? data.filter((d) => d.severity === severity) : data;

  const columns = [
    { title: '检测时间', dataIndex: 'detect_time', key: 'detect_time', width: 180 },
    { title: '规则编码', dataIndex: 'rule_name', key: 'rule_name', width: 180 },
    { title: '目标表', dataIndex: 'table_name', key: 'table_name', ellipsis: true },
    {
      title: '严重级别',
      dataIndex: 'severity',
      key: 'severity',
      width: 120,
      filters: [
        { text: 'CRITICAL', value: 'CRITICAL' },
        { text: 'HIGH', value: 'HIGH' },
      ],
      onFilter: (value: unknown, record: AlertItem) => record.severity === value,
      render: (s: string) => <Tag color={s === 'CRITICAL' ? 'red' : 'orange'}>{s}</Tag>,
    },
    { title: '问题数量', dataIndex: 'issue_cnt', key: 'issue_cnt', width: 100 },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Select placeholder="严重级别" allowClear style={{ width: 140 }} value={severity} onChange={setSeverity}
          options={[{ label: 'CRITICAL', value: 'CRITICAL' }, { label: 'HIGH', value: 'HIGH' }]} />
      </Space>
      <Table dataSource={filtered} columns={columns} loading={loading} rowKey={(_, i) => String(i)} size="middle" pagination={{ pageSize: 20 }} />
    </>
  );
}
