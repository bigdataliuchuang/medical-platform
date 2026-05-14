import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Divider, Alert } from 'antd';
import { UserOutlined, LockOutlined, EyeOutlined } from '@ant-design/icons';
import { post } from '../../api/request';

const { Title } = Typography;

const IS_DEMO = !import.meta.env.VITE_API_BASE_URL;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await post<{ token: string; username: string; role: string; permissions: string[] }>(
        '/api/auth/login',
        values
      );
      localStorage.setItem('token', res.token);
      localStorage.setItem('username', res.username);
      localStorage.setItem('role', res.role ?? 'analyst');
      localStorage.setItem('permissions', JSON.stringify(res.permissions ?? []));
      navigate('/');
    } catch {
      // error already shown by interceptor
    } finally {
      setLoading(false);
    }
  };

  const enterDemo = () => {
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('username', 'demo');
    localStorage.setItem('role', 'admin');
    localStorage.setItem('permissions', '[]');
    navigate('/');
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f0f5ff',
    }}>
      <Card style={{ width: 380, borderRadius: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 4 }}>医疗数据治理平台</Title>
          <span style={{ color: '#999' }}>抗肿瘤药物临床应用监测系统</span>
        </div>
        {IS_DEMO && (
          <Alert
            message="演示环境"
            description="当前为静态演示，数据接口不可用，仅供界面预览。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登 录
            </Button>
          </Form.Item>
        </Form>
        {IS_DEMO && (
          <>
            <Divider plain style={{ color: '#999', fontSize: 12 }}>或</Divider>
            <Button
              block
              size="large"
              icon={<EyeOutlined />}
              onClick={enterDemo}
              style={{ borderColor: '#2563eb', color: '#2563eb' }}
            >
              演示模式（无需登录）
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
