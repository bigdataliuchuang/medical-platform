import { Tabs } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const tabs = [
  { key: '/drug', label: '用量趋势' },
  { key: '/drug/alerts', label: '异常预警' },
  { key: '/drug/report', label: '月度上报' },
];

export default function Drug() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeKey = tabs.find((t) => location.pathname === t.key)?.key || '/drug';

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
