import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Dropdown } from 'antd';
import {
  HomeOutlined,
  SafetyOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  BarChartOutlined,
  AuditOutlined,
  ExperimentOutlined,
  DatabaseOutlined,
  LogoutOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import AiChat from './components/AiChat';

const { Sider, Header, Content } = Layout;

const NAV_GROUPS = [
  {
    label: '数据监控',
    items: [
      { key: '/', icon: <HomeOutlined />, label: '首页' },
      { key: '/dq', icon: <SafetyOutlined />, label: '数据质量' },
      { key: '/mpi', icon: <TeamOutlined />, label: '患者主数据' },
    ],
  },
  {
    label: '临床分析',
    items: [
      { key: '/drug', icon: <MedicineBoxOutlined />, label: '药物监测' },
      { key: '/expense', icon: <BarChartOutlined />, label: '费用分析' },
      { key: '/inpatient', icon: <AuditOutlined />, label: '住院质量' },
    ],
  },
  {
    label: '数据管理',
    items: [
      { key: '/dev-assistant', icon: <ExperimentOutlined />, label: 'AI 指标开发' },
      { key: '/semantic-layer', icon: <DatabaseOutlined />, label: '语义层' },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/': '首页',
  '/dq': '数据质量',
  '/mpi': '患者主数据',
  '/drug': '药物监测',
  '/expense': '费用分析',
  '/inpatient': '住院质量',
  '/dev-assistant': 'AI 指标开发',
  '/semantic-layer': '语义层',
};

function LogoMark() {
  return (
    <div className="sider-logo-mark">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1.5L2 4.5v5c0 4 3 7.5 7 8.5 4-1 7-4.5 7-8.5v-5L9 1.5z"
          fill="rgba(255,255,255,.15)" stroke="rgba(255,255,255,.5)" strokeWidth="1" />
        <polyline points="3.5,9 5.5,9 6.5,6.5 8.5,11.5 10.5,6.5 12,9 13,8 14.5,8"
          fill="none" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const username = localStorage.getItem('username') || '管理员';

  const currentPath = '/' + location.pathname.split('/')[1];
  const pageTitle = PAGE_TITLES[currentPath] || '首页';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const userMenu = {
    items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }],
  };

  return (
    <Layout className="app-layout">
      <Sider
        className="app-sider"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={228}
        collapsedWidth={64}
        theme="dark"
      >
        <div className="sider-logo">
          <LogoMark />
          {!collapsed && (
            <div>
              <div className="sider-logo-text">医疗数据治理</div>
              <div className="sider-logo-sub">Clinical Data Platform</div>
            </div>
          )}
        </div>

        <div className="sider-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && <div className="nav-group-label">{group.label}</div>}
              {group.items.map((item) => {
                const isActive = item.key === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.key);
                return (
                  <div
                    key={item.key}
                    className={`nav-item${isActive ? ' active' : ''}`}
                    onClick={() => navigate(item.key)}
                    title={collapsed ? item.label : ''}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {!collapsed && (
          <Dropdown menu={userMenu} placement="topLeft">
            <div className="sider-user">
              <div className="sider-avatar">{username.charAt(0)}</div>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', fontWeight: 500 }}>{username}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>Administrator</div>
              </div>
            </div>
          </Dropdown>
        )}
      </Sider>

      <Layout style={{ background: 'var(--bg)' }}>
        <Header className="app-topbar">
          <div className="topbar-breadcrumb">
            <span className="topbar-breadcrumb-root">医疗数据治理</span>
            <RightOutlined className="topbar-breadcrumb-sep" />
            <span className="topbar-breadcrumb-title">{pageTitle}</span>
          </div>

          <div className="live-stat">
            <span className="live-dot" style={{ background: 'var(--ok)' }} />
            <span className="live-label">DQ</span>
            <span className="live-val" style={{ color: 'var(--ok)' }}>87.3</span>
          </div>
          <div className="live-stat">
            <span className="live-dot" style={{ background: 'var(--err)' }} />
            <span className="live-label">告警</span>
            <span className="live-val" style={{ color: 'var(--err)' }}>2</span>
          </div>

          <div className="topbar-actions">
            <div className="topbar-icon-btn">
              <BellOutlined />
              <span className="topbar-badge">2</span>
            </div>
            <QuestionCircleOutlined className="topbar-icon-btn" />
            <div className="topbar-divider" />
            <Dropdown menu={userMenu} placement="bottomRight">
              <div className="topbar-user">
                <div className="sider-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                  {username.charAt(0)}
                </div>
                <div>
                  <div className="topbar-user-name">{username}</div>
                  <div className="topbar-user-role">admin</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>

      <AiChat />
    </Layout>
  );
}
