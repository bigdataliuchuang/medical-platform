import { Tabs } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const tabs = [
  { key: '/mpi', label: 'MPI 总览' },
  { key: '/mpi/duplicates', label: '疑似重复患者' },
  { key: '/mpi/sources', label: '来源映射' },
];

export default function MPI() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeKey = tabs.find((t) => location.pathname === t.key)?.key || '/mpi';

  return (
    <>
      <Tabs
        activeKey={activeKey}
        items={tabs}
        onChange={(key) => navigate(key)}
        style={{ marginBottom: 16 }}
      />
      <Outlet />
    </>
  );
}
