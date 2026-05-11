import { Tabs } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const tabs = [
  { key: '/dq', label: 'DQ 总览' },
  { key: '/dq/rules', label: '规则列表' },
  { key: '/dq/issues', label: '问题明细' },
];

export default function DQ() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeKey = tabs.find((t) => location.pathname === t.key)?.key || '/dq';

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
