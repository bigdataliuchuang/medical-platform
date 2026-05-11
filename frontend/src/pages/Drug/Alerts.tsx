import { useEffect, useState } from 'react';
import { Table, Tag } from 'antd';
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

  useEffect(() => {
    get<AlertItem[]>('/api/drug/alerts').then(setData).finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: '检测时间', dataIndex: 'detect_time', key: 'detect_time', width: 180 },
    { title: '规则编码', dataIndex: 'rule_name', key: 'rule_name', width: 180 },
    { title: '目标表', dataIndex: 'table_name', key: 'table_name', ellipsis: true },
    {
      title: '严重级别',
      dataIndex: 'severity',
      key: 'severity',
      width: 120,
      render: (s: string) => <Tag color={s === 'CRITICAL' ? 'red' : 'orange'}>{s}</Tag>,
    },
    { title: '问题数量', dataIndex: 'issue_cnt', key: 'issue_cnt', width: 100 },
  ];

  return <Table dataSource={data} columns={columns} loading={loading} rowKey={(_, i) => String(i)} size="middle" pagination={{ pageSize: 20 }} />;
}
