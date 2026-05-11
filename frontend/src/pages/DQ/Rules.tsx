import { useEffect, useState } from 'react';
import { Table, Tag, Select, Input, Space } from 'antd';
import { get } from '../../api/request';

interface RuleItem {
  rule_name: string;
  check_table: string;
  data_layer: string;
  severity: string;
  latest_status: string;
  last_run: string;
}

const LAYERS = ['ODS', 'DWD', 'DWS', 'ADS', 'MPI'];
const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export default function DQRules() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RuleItem[]>([]);
  const [layer, setLayer] = useState<string | undefined>();
  const [severity, setSeverity] = useState<string | undefined>();
  const [search, setSearch] = useState('');

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (layer) params.set('layer', layer);
    if (severity) params.set('severity', severity);
    get(`/api/dq/rules?${params.toString()}`).then((res) => {
      setData(res as RuleItem[]);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [layer, severity]);

  const filtered = search
    ? data.filter((r) => r.rule_name.toLowerCase().includes(search.toLowerCase()))
    : data;

  const columns = [
    { title: '规则名称', dataIndex: 'rule_name', key: 'rule_name', width: 260 },
    { title: '检查表', dataIndex: 'check_table', key: 'check_table', ellipsis: true },
    {
      title: '数据层',
      dataIndex: 'data_layer',
      key: 'data_layer',
      width: 90,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: '严重级别',
      dataIndex: 'severity',
      key: 'severity',
      width: 110,
      render: (v: string) => <Tag color={v === 'CRITICAL' ? 'red' : v === 'HIGH' ? 'orange' : v === 'MEDIUM' ? 'gold' : 'default'}>{v}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'latest_status',
      key: 'latest_status',
      width: 80,
      render: (v: string) => v === 'PASS' ? <Tag color="green">PASS</Tag> : <Tag color="red">FAIL</Tag>,
    },
    { title: '最后运行', dataIndex: 'last_run', key: 'last_run', width: 180 },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Select placeholder="数据层" allowClear style={{ width: 120 }} value={layer} onChange={setLayer} options={LAYERS.map((l) => ({ label: l, value: l }))} />
        <Select placeholder="严重级别" allowClear style={{ width: 140 }} value={severity} onChange={setSeverity} options={SEVERITIES.map((s) => ({ label: s, value: s }))} />
        <Input.Search placeholder="搜索规则名" allowClear style={{ width: 220 }} onSearch={setSearch} />
      </Space>
      <Table dataSource={filtered} columns={columns} loading={loading} rowKey="rule_name" size="middle" pagination={{ pageSize: 15 }} />
    </>
  );
}
