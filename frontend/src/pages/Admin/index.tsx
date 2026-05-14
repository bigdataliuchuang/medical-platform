import { useEffect, useState } from 'react';
import {
  Badge, Button, Card, Col, Form, Input, Modal, Popconfirm,
  Row, Select, Space, Statistic, Switch, Table, Tag, Typography, message,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined,
} from '@ant-design/icons';
import {
  listUsers, listRoles, createUser, updateUser, deleteUser,
  type UserRecord, type RoleDef,
} from '../../api/users';

const { Title, Paragraph } = Typography;

const ROLE_COLOR: Record<string, string> = {
  admin: 'red', analyst: 'blue', clinician: 'green', auditor: 'orange',
};

const MODULE_LABELS: Record<string, string> = {
  '/': '首页', '/dq': '数据质量', '/mpi': '患者主数据', '/drug': '药物监测',
  '/expense': '费用分析', '/inpatient': '住院质量', '/dev-assistant': 'AI 指标开发',
  '/semantic-layer': '语义层', '/lineage': '数据血缘', '/admin': '用户管理',
};

export default function Admin() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [pwdUser, setPwdUser] = useState<UserRecord | null>(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [pwdForm] = Form.useForm();

  const refresh = () => {
    setLoading(true);
    Promise.all([listUsers(), listRoles()])
      .then(([u, r]) => { setUsers(u); setRoles(r); })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const handleAdd = async () => {
    const values = await addForm.validateFields();
    try {
      await createUser(values.username, values.password, values.role);
      message.success('用户已创建');
      setAddOpen(false);
      addForm.resetFields();
      refresh();
    } catch { /* interceptor shows error */ }
  };

  const handleEdit = async () => {
    if (!editUser) return;
    const values = await editForm.validateFields();
    try {
      await updateUser(editUser.id, { role: values.role, is_active: values.is_active });
      message.success('已更新');
      setEditUser(null);
      refresh();
    } catch { /* interceptor shows error */ }
  };

  const handleResetPwd = async () => {
    if (!pwdUser) return;
    const values = await pwdForm.validateFields();
    try {
      await updateUser(pwdUser.id, { password: values.password });
      message.success('密码已重置');
      setPwdUser(null);
      pwdForm.resetFields();
    } catch { /* interceptor shows error */ }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      message.success('已删除');
      refresh();
    } catch { /* interceptor shows error */ }
  };

  const handleToggleActive = async (user: UserRecord, checked: boolean) => {
    try {
      await updateUser(user.id, { is_active: checked });
      message.success(checked ? '已启用' : '已停用');
      refresh();
    } catch { /* interceptor shows error */ }
  };

  const roleOptions = roles.map(r => ({ value: r.value, label: r.label }));
  const selectedRole = roles.find(r => r.value === editForm.getFieldValue('role'));

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '用户名', dataIndex: 'username',
      render: (v: string) => <strong>{v}</strong>,
    },
    {
      title: '角色', dataIndex: 'role',
      render: (v: string) => {
        const r = roles.find(x => x.value === v);
        return <Tag color={ROLE_COLOR[v] ?? 'default'}>{r?.label ?? v}</Tag>;
      },
    },
    {
      title: '状态', dataIndex: 'is_active',
      width: 90,
      render: (v: number, row: UserRecord) => (
        <Switch
          size="small"
          checked={!!v}
          onChange={(checked) => handleToggleActive(row, checked)}
        />
      ),
    },
    {
      title: '创建时间', dataIndex: 'created_at',
      render: (v: string) => v.slice(0, 10),
      width: 110,
    },
    {
      title: '操作', width: 160,
      render: (_: unknown, row: UserRecord) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />}
            onClick={() => { setEditUser(row); editForm.setFieldsValue({ role: row.role, is_active: !!row.is_active }); }}>
            编辑
          </Button>
          <Button size="small" icon={<KeyOutlined />}
            onClick={() => setPwdUser(row)}>
            改密
          </Button>
          <Popconfirm title="确定删除该用户？" onConfirm={() => handleDelete(row.id)} okText="删除" cancelText="取消">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>用户管理</Title>
      <Paragraph type="secondary">管理平台用户账号及角色权限，基于 RBAC 模型控制各模块访问范围。</Paragraph>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card size="small" style={{ borderRadius: 8 }}><Statistic title="总用户" value={users.length} /></Card></Col>
        <Col span={6}><Card size="small" style={{ borderRadius: 8 }}><Statistic title="活跃用户" value={users.filter(u => u.is_active).length} valueStyle={{ color: '#059669' }} /></Card></Col>
        <Col span={6}><Card size="small" style={{ borderRadius: 8 }}><Statistic title="管理员" value={users.filter(u => u.role === 'admin').length} valueStyle={{ color: '#dc2626' }} /></Card></Col>
        <Col span={6}><Card size="small" style={{ borderRadius: 8 }}><Statistic title="角色种类" value={roles.length} /></Card></Col>
      </Row>

      {/* 角色权限矩阵 */}
      <Card title="角色权限矩阵" size="small" style={{ borderRadius: 8, marginBottom: 20 }}>
        <Row gutter={12}>
          {roles.map(r => (
            <Col key={r.value} span={6}>
              <Card size="small" style={{ borderRadius: 6, borderColor: ROLE_COLOR[r.value] + '40' }}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color={ROLE_COLOR[r.value]}>{r.label}</Tag>
                  <Badge count={r.permissions.length} style={{ backgroundColor: '#e2e8f0', color: '#64748b', fontSize: 11 }} />
                </div>
                {r.permissions.map(p => (
                  <Tag key={p} style={{ fontSize: 11, margin: '2px 2px' }}>{MODULE_LABELS[p] ?? p}</Tag>
                ))}
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 用户列表 */}
      <Card
        title="用户列表"
        size="small"
        style={{ borderRadius: 8 }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
            新建用户
          </Button>
        }
      >
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      </Card>

      {/* 新建用户 Modal */}
      <Modal title="新建用户" open={addOpen} onOk={handleAdd}
        onCancel={() => { setAddOpen(false); addForm.resetFields(); }} okText="创建">
        <Form form={addForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6, message: '至少6位' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]} initialValue="analyst">
            <Select options={roleOptions} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑用户 Modal */}
      <Modal title={`编辑用户：${editUser?.username}`} open={!!editUser}
        onOk={handleEdit} onCancel={() => setEditUser(null)} okText="保存">
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select options={roleOptions} onChange={() => editForm.setFieldsValue({})} />
          </Form.Item>
          {selectedRole && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>可访问模块：</div>
              {selectedRole.permissions.map(p => (
                <Tag key={p} style={{ fontSize: 11, margin: '2px' }}>{MODULE_LABELS[p] ?? p}</Tag>
              ))}
            </div>
          )}
          <Form.Item name="is_active" label="账号状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 重置密码 Modal */}
      <Modal title={`重置密码：${pwdUser?.username}`} open={!!pwdUser}
        onOk={handleResetPwd} onCancel={() => { setPwdUser(null); pwdForm.resetFields(); }} okText="确认重置">
        <Form form={pwdForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="password" label="新密码" rules={[{ required: true, min: 6, message: '至少6位' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="confirm" label="确认密码"
            rules={[{ required: true }, ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve();
                return Promise.reject('两次密码不一致');
              },
            })]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
