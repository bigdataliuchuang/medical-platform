import { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, message, Space } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { get } from '../../api/request';
import request from '../../api/request';

interface PatientInfo {
  name: string;
  id_card: string;
  birth_date: string;
  phone: string;
  source_system: string;
}

interface DuplicateItem {
  log_id: string;
  patient_a: PatientInfo;
  patient_b: PatientInfo;
  match_score: number;
  match_basis: string;
  created_at: string;
}

export default function MPIDuplicates() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DuplicateItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const size = 20;

  const fetchData = (p: number) => {
    setLoading(true);
    get<{ total: number; list: DuplicateItem[] }>(`/api/mpi/duplicates?page=${p}&size=${size}`)
      .then((res) => { setData(res.list); setTotal(res.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(1); }, []);

  const handleAction = (logId: string, action: 'merge' | 'reject') => {
    const doAction = () => {
      request.patch(`/api/mpi/duplicates/${logId}?action=${action}`).then(() => {
        message.success(action === 'merge' ? '已确认合并' : '已标记不同');
        setData((prev) => prev.filter((d) => d.log_id !== logId));
        setTotal((prev) => prev - 1);
      });
    };

    if (action === 'merge') {
      Modal.confirm({
        title: '确认合并',
        content: '合并后将保留主记录，确认操作？',
        onOk: doAction,
      });
    } else {
      doAction();
    }
  };

  const fields: { key: keyof PatientInfo; label: string }[] = [
    { key: 'name', label: '姓名' },
    { key: 'id_card', label: '身份证' },
    { key: 'birth_date', label: '出生日期' },
    { key: 'phone', label: '电话' },
    { key: 'source_system', label: '来源系统' },
  ];

  const columns = [
    { title: '匹配度', dataIndex: 'match_score', key: 'match_score', width: 100, render: (v: number) => <Tag color={v >= 0.9 ? 'red' : 'orange'}>{(v * 100).toFixed(0)}%</Tag> },
    { title: '匹配依据', dataIndex: 'match_basis', key: 'match_basis', width: 160 },
    { title: '患者A', key: 'pa', render: (_: unknown, r: DuplicateItem) => r.patient_a.name || '-' },
    { title: '患者B', key: 'pb', render: (_: unknown, r: DuplicateItem) => r.patient_b.name || '-' },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, r: DuplicateItem) => (
        <Space>
          <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleAction(r.log_id, 'merge')}>确认合并</Button>
          <Button size="small" icon={<CloseOutlined />} onClick={() => handleAction(r.log_id, 'reject')}>标记不同</Button>
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record: DuplicateItem) => {
    const a = record.patient_a;
    const b = record.patient_b;
    return (
      <div style={{ display: 'flex', gap: 32, padding: '8px 0' }}>
        {[{ label: '患者A', p: a }, { label: '患者B', p: b }].map(({ label, p }) => (
          <div key={label} style={{ flex: 1 }}>
            <strong>{label}</strong>
            <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse' }}>
              <tbody>
                {fields.map((f) => {
                  const aVal = a[f.key];
                  const bVal = b[f.key];
                  const diff = aVal !== bVal;
                  return (
                    <tr key={f.key}>
                      <td style={{ padding: '4px 8px', color: '#999', width: 90 }}>{f.label}</td>
                      <td style={{ padding: '4px 8px', background: diff ? '#fffbe6' : undefined }}>{p[f.key] || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Table
      dataSource={data}
      columns={columns}
      loading={loading}
      rowKey="log_id"
      expandable={{ expandedRowRender, rowExpandable: () => true }}
      pagination={{ current: page, pageSize: size, total, onChange: (p) => { setPage(p); fetchData(p); } }}
    />
  );
}
