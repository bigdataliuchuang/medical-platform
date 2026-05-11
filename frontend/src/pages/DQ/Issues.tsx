import { useEffect, useState } from 'react';
import { Table, Tag, Select, DatePicker, Space, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { get } from '../../api/request';

interface IssueItem {
  check_time: string;
  rule_code: string;
  table_name: string;
  severity: string;
  issue_desc: string;
  data_layer: string;
}

const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const LAYERS = ['ODS', 'DWD', 'DWS', 'ADS', 'MPI'];

export default function DQIssues() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IssueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [severity, setSeverity] = useState<string | undefined>();
  const [layer, setLayer] = useState<string | undefined>();
  const [dates, setDates] = useState<[string, string] | null>(null);

  const fetchData = (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), size: String(size) });
    if (severity) params.set('severity', severity);
    if (layer) params.set('layer', layer);
    if (dates) { params.set('start', dates[0]); params.set('end', dates[1]); }
    get(`/api/dq/issues?${params.toString()}`).then((res) => {
      const r = res as { total: number; list: IssueItem[] };
      setData(r.list);
      setTotal(r.total);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); fetchData(1); }, [severity, layer, dates]);

  const columns = [
    { title: '检查时间', dataIndex: 'check_time', key: 'check_time', width: 180 },
    { title: '规则编码', dataIndex: 'rule_code', key: 'rule_code', width: 200 },
    { title: '目标表', dataIndex: 'table_name', key: 'table_name', ellipsis: true },
    {
      title: '级别',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (v: string) => <Tag color={v === 'CRITICAL' ? 'red' : v === 'HIGH' ? 'orange' : 'default'}>{v}</Tag>,
    },
    { title: '数据层', dataIndex: 'data_layer', key: 'data_layer', width: 80, render: (v: string) => <Tag>{v}</Tag> },
    { title: '问题描述', dataIndex: 'issue_desc', key: 'issue_desc', ellipsis: true },
  ];

  const handleExport = () => {
    const params = new URLSearchParams();
    if (severity) params.set('severity', severity);
    if (layer) params.set('layer', layer);
    if (dates) { params.set('start', dates[0]); params.set('end', dates[1]); }
    window.open(`http://localhost:8000/api/dq/issues/export?${params.toString()}`, '_blank');
  };

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <DatePicker.RangePicker onChange={(_, strs) => setDates(strs[0] && strs[1] ? [strs[0], strs[1]] : null)} />
        <Select placeholder="严重级别" allowClear style={{ width: 140 }} value={severity} onChange={setSeverity} options={SEVERITIES.map((s) => ({ label: s, value: s }))} />
        <Select placeholder="数据层" allowClear style={{ width: 120 }} value={layer} onChange={setLayer} options={LAYERS.map((l) => ({ label: l, value: l }))} />
        <Button icon={<DownloadOutlined />} onClick={handleExport}>导出 CSV</Button>
      </Space>
      <Table
        dataSource={data}
        columns={columns}
        loading={loading}
        rowKey={(_, i) => String(i)}
        size="middle"
        pagination={{ current: page, pageSize: size, total, onChange: (p) => { setPage(p); fetchData(p); } }}
      />
    </>
  );
}
