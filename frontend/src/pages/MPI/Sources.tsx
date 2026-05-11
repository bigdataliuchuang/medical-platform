import { useEffect, useState } from 'react';
import { Table, Select, Space } from 'antd';
import { get } from '../../api/request';

interface SourceItem {
  source_system: string;
  source_patient_id: string;
  mpi_id: string;
  created_at: string;
}

export default function MPISources() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SourceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [system, setSystem] = useState<string | undefined>();
  const size = 20;

  const fetchData = (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), size: String(size) });
    if (system) params.set('source_system', system);
    get<{ total: number; list: SourceItem[] }>(`/api/mpi/sources?${params.toString()}`)
      .then((res) => { setData(res.list); setTotal(res.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); fetchData(1); }, [system]);

  const systems = [...new Set(data.map((d) => d.source_system))];

  const columns = [
    { title: '来源系统', dataIndex: 'source_system', key: 'source_system', width: 140 },
    { title: '原始患者ID', dataIndex: 'source_patient_id', key: 'source_patient_id' },
    { title: 'MPI ID', dataIndex: 'mpi_id', key: 'mpi_id' },
    { title: '映射时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Select placeholder="来源系统" allowClear style={{ width: 180 }} value={system} onChange={setSystem} options={systems.map((s) => ({ label: s, value: s }))} />
      </Space>
      <Table
        dataSource={data}
        columns={columns}
        loading={loading}
        rowKey={(_, i) => String(i)}
        pagination={{ current: page, pageSize: size, total, onChange: (p) => { setPage(p); fetchData(p); } }}
      />
    </>
  );
}
