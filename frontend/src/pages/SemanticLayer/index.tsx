import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Alert, Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import { CodeOutlined, DatabaseOutlined, FieldTimeOutlined, PlayCircleOutlined, ReloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import {
  approveSemanticMetricStatusRequest,
  compileSemanticQuery,
  listSemanticAuditEvents,
  listSemanticDatasets,
  listSemanticDimensions,
  listSemanticMetricStatusRequests,
  listSemanticMetrics,
  rejectSemanticMetricStatusRequest,
  requestSemanticMetricStatus,
  runSemanticQuery,
  updateSemanticMetricStatus,
} from '../../api/semantic';
import type {
  SemanticAuditEvent,
  SemanticCompileResponse,
  SemanticDataset,
  SemanticDimension,
  SemanticMetric,
  MetricStatusRequest,
  SemanticQueryRequest,
  SemanticQueryResponse,
} from '../../api/semantic';

const { Paragraph, Text, Title } = Typography;

function SensitivityTag({ value }: { value: string }) {
  const color = value === 'restricted' ? 'red' : value === 'internal' ? 'orange' : 'green';
  return <Tag color={color}>{value}</Tag>;
}

interface QueryFormValues {
  tenant_id?: string;
  role?: string;
  metrics?: string[];
  dimensions?: string[];
  startDate?: string;
  endDate?: string;
  limit?: number;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    return detail || fallback;
  }
  return fallback;
}

function buildRequest(values: QueryFormValues): SemanticQueryRequest {
  const filters = [];
  if (values.startDate && values.endDate) {
    filters.push({ field: 'stat_date', op: 'between' as const, value: [values.startDate, values.endDate] });
  }
  return {
    tenant_id: values.tenant_id || 'hospital-a',
    role: values.role || 'analyst',
    metrics: values.metrics || [],
    dimensions: values.dimensions || [],
    filters,
    limit: values.limit || 100,
  };
}

export default function SemanticLayer() {
  const [form] = Form.useForm();
  const [metrics, setMetrics] = useState<SemanticMetric[]>([]);
  const [dimensions, setDimensions] = useState<SemanticDimension[]>([]);
  const [datasets, setDatasets] = useState<SemanticDataset[]>([]);
  const [auditEvents, setAuditEvents] = useState<SemanticAuditEvent[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<MetricStatusRequest[]>([]);
  const [compiled, setCompiled] = useState<SemanticCompileResponse | null>(null);
  const [queryResult, setQueryResult] = useState<SemanticQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const metricOptions = metrics.map((item) => ({ label: `${item.display_name} (${item.name})`, value: item.name }));
  const dimensionOptions = dimensions.map((item) => ({ label: `${item.display_name} (${item.name})`, value: item.name }));

  const resultColumns = useMemo(() => {
    if (!queryResult?.columns?.length) return [];
    return queryResult.columns.map((column) => ({ title: column, dataIndex: column, key: column }));
  }, [queryResult]);


  const refreshCatalogs = async () => {
    const [nextMetrics, nextDimensions, nextDatasets, nextAudit, nextRequests] = await Promise.all([
      listSemanticMetrics(),
      listSemanticDimensions(),
      listSemanticDatasets(),
      listSemanticAuditEvents(),
      listSemanticMetricStatusRequests(),
    ]);
    setMetrics(nextMetrics);
    setDimensions(nextDimensions);
    setDatasets(nextDatasets);
    setAuditEvents(nextAudit);
    setApprovalRequests(nextRequests);
    return { nextMetrics, nextDimensions };
  };

  const handleMetricStatusChange = (metric: SemanticMetric, status: 'published' | 'deprecated') => {
    Modal.confirm({
      title: status === 'published' ? '发布指标' : '下线指标',
      content: `确认将 ${metric.display_name} 设置为 ${status}？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        await updateSemanticMetricStatus(metric.name, {
          status,
          actor: localStorage.getItem('username') || 'admin',
          reason: status === 'published' ? '前端治理台发布' : '前端治理台下线',
        });
        await refreshCatalogs();
        message.success('指标状态已更新');
      },
    });
  };


  const handleRequestMetricStatus = (metric: SemanticMetric, requestedStatus: 'published' | 'deprecated') => {
    Modal.confirm({
      title: requestedStatus === 'published' ? '申请发布指标' : '申请下线指标',
      content: `提交 ${metric.display_name} 的状态变更审批申请？`,
      okText: '提交申请',
      cancelText: '取消',
      onOk: async () => {
        await requestSemanticMetricStatus({
          metric_name: metric.name,
          requested_status: requestedStatus,
          requester: localStorage.getItem('username') || 'admin',
          reason: requestedStatus === 'published' ? '申请发布新口径' : '申请下线旧口径',
        });
        await refreshCatalogs();
        message.success('审批申请已提交');
      },
    });
  };

  const handleReviewMetricStatus = (request: MetricStatusRequest, decision: 'approve' | 'reject') => {
    Modal.confirm({
      title: decision === 'approve' ? '审批通过' : '驳回申请',
      content: `确认${decision === 'approve' ? '通过' : '驳回'} ${request.metric_name} 的状态变更申请？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const payload = { reviewer: localStorage.getItem('username') || 'admin', comment: decision === 'approve' ? '审批通过' : '审批驳回' };
        if (decision === 'approve') {
          await approveSemanticMetricStatusRequest(request.request_id, payload);
        } else {
          await rejectSemanticMetricStatusRequest(request.request_id, payload);
        }
        await refreshCatalogs();
        message.success('审批状态已更新');
      },
    });
  };

  const refreshAudit = async () => {
    try {
      setAuditEvents(await listSemanticAuditEvents());
    } catch {
      setAuditEvents([]);
    }
  };

  useEffect(() => {
    refreshCatalogs()
      .then(({ nextMetrics, nextDimensions }) => {
        form.setFieldsValue({
          tenant_id: 'hospital-a',
          role: 'analyst',
          metrics: nextMetrics[0] ? [nextMetrics[0].name] : [],
          dimensions: nextDimensions.filter((item) => item.sensitivity === 'public').slice(0, 2).map((item) => item.name),
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          limit: 100,
        });
      })
      .catch(() => message.error('语义层服务暂时不可用，请检查 AI Agent 服务'));
  }, [form]);

  const handleCompile = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const response = await compileSemanticQuery(buildRequest(values));
      setCompiled(response);
      setQueryResult(null);
      await refreshAudit();
    } catch (error: unknown) {
      message.error(getErrorMessage(error, 'SQL 编译失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const response = await runSemanticQuery(buildRequest(values));
      setCompiled(response);
      setQueryResult(response);
      await refreshAudit();
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '语义查询失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>语义层</Title>
      <Paragraph type="secondary">
        统一指标、维度和数据集口径，通过受控 DSL 编译 SQL，并在查询前执行租户、角色和敏感字段策略校验。
      </Paragraph>

      <Tabs
        items={[
          {
            key: 'query',
            label: '语义查询',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} xl={9}>
                  <Card title={<Space><DatabaseOutlined />查询 DSL</Space>}>
                    <Form layout="vertical" form={form}>
                      <Form.Item label="租户" name="tenant_id" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                      <Form.Item label="角色" name="role" rules={[{ required: true }]}>
                        <Select options={[{ value: 'analyst' }, { value: 'data_steward' }, { value: 'viewer' }]} />
                      </Form.Item>
                      <Form.Item label="指标" name="metrics" rules={[{ required: true, message: '请选择指标' }]}>
                        <Select mode="multiple" options={metricOptions} />
                      </Form.Item>
                      <Form.Item label="维度" name="dimensions">
                        <Select mode="multiple" options={dimensionOptions} />
                      </Form.Item>
                      <Row gutter={12}>
                        <Col span={12}><Form.Item label="开始日期" name="startDate"><Input placeholder="2026-01-01" /></Form.Item></Col>
                        <Col span={12}><Form.Item label="结束日期" name="endDate"><Input placeholder="2026-01-31" /></Form.Item></Col>
                      </Row>
                      <Form.Item label="行数限制" name="limit">
                        <InputNumber min={1} max={1000} style={{ width: '100%' }} />
                      </Form.Item>
                      <Space wrap>
                        <Button icon={<CodeOutlined />} loading={loading} onClick={handleCompile}>编译 SQL</Button>
                        <Button type="primary" icon={<PlayCircleOutlined />} loading={loading} onClick={handleQuery}>执行查询</Button>
                      </Space>
                    </Form>
                  </Card>
                </Col>
                <Col xs={24} xl={15}>
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Card title={<Space><CodeOutlined />SQL 预览</Space>}>
                      {compiled ? <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{compiled.sql}</pre> : <Alert type="info" showIcon message="等待编译" />}
                    </Card>
                    <Card title="查询结果">
                      {queryResult ? (
                        <Table
                          size="small"
                          rowKey={(_, index) => String(index)}
                          columns={resultColumns}
                          dataSource={queryResult.rows}
                          pagination={{ pageSize: 8 }}
                        />
                      ) : <Text type="secondary">执行查询后展示结果。</Text>}
                    </Card>
                  </Space>
                </Col>
              </Row>
            ),
          },
          {
            key: 'metrics',
            label: '指标目录',
            children: (
              <Table
                rowKey="name"
                dataSource={metrics}
                columns={[
                  { title: '指标', dataIndex: 'display_name', key: 'display_name' },
                  { title: '编码', dataIndex: 'name', key: 'name' },
                  { title: '数据集', dataIndex: 'dataset', key: 'dataset' },
                  { title: '公式', dataIndex: 'formula', key: 'formula' },
                  { title: '状态', dataIndex: 'status', key: 'status', render: (value) => <Tag color="green">{value}</Tag> },
                  { title: 'Owner', dataIndex: 'owner', key: 'owner' },
                  {
                    title: '治理操作',
                    key: 'actions',
                    render: (_, record) => (
                      <Space>
                        <Button size="small" disabled={record.status === 'published'} onClick={() => handleRequestMetricStatus(record, 'published')}>申请发布</Button>
                        <Button size="small" danger disabled={record.status === 'deprecated'} onClick={() => handleRequestMetricStatus(record, 'deprecated')}>申请下线</Button>
                        <Button size="small" onClick={() => handleMetricStatusChange(record, 'published')}>快速发布</Button>
                      </Space>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            key: 'dimensions',
            label: '维度目录',
            children: (
              <Table
                rowKey="name"
                dataSource={dimensions}
                columns={[
                  { title: '维度', dataIndex: 'display_name', key: 'display_name' },
                  { title: '编码', dataIndex: 'name', key: 'name' },
                  { title: '数据集', dataIndex: 'dataset', key: 'dataset' },
                  { title: '字段', dataIndex: 'column', key: 'column' },
                  { title: '类型', dataIndex: 'data_type', key: 'data_type' },
                  { title: '敏感级别', dataIndex: 'sensitivity', key: 'sensitivity', render: (value) => <SensitivityTag value={value} /> },
                ]}
              />
            ),
          },
          {
            key: 'datasets',
            label: '数据集',
            children: (
              <Table
                rowKey="name"
                dataSource={datasets}
                columns={[
                  { title: '数据集', dataIndex: 'display_name', key: 'display_name' },
                  { title: '编码', dataIndex: 'name', key: 'name' },
                  { title: '物理表', dataIndex: 'table', key: 'table' },
                  { title: '时间字段', dataIndex: 'time_field', key: 'time_field', render: (value) => <Space><FieldTimeOutlined />{value}</Space> },
                  { title: '字段数', key: 'fields', render: (_, record) => record.fields.length },
                ]}
              />
            ),
          },
          {
            key: 'approvals',
            label: '审批流',
            children: (
              <Card title="指标状态审批">
                <Table
                  rowKey="request_id"
                  dataSource={approvalRequests}
                  columns={[
                    { title: '指标', dataIndex: 'metric_name', key: 'metric_name' },
                    { title: '目标状态', dataIndex: 'requested_status', key: 'requested_status', render: (value) => <Tag>{value}</Tag> },
                    { title: '申请人', dataIndex: 'requester', key: 'requester' },
                    { title: '原因', dataIndex: 'reason', key: 'reason' },
                    { title: '状态', dataIndex: 'status', key: 'status', render: (value) => <Tag color={value === 'pending' ? 'orange' : value === 'approved' ? 'green' : 'red'}>{value}</Tag> },
                    { title: '审批人', dataIndex: 'reviewer', key: 'reviewer', render: (value) => value || '-' },
                    {
                      title: '操作',
                      key: 'actions',
                      render: (_, record) => record.status === 'pending' ? (
                        <Space>
                          <Button size="small" type="primary" onClick={() => handleReviewMetricStatus(record, 'approve')}>通过</Button>
                          <Button size="small" danger onClick={() => handleReviewMetricStatus(record, 'reject')}>驳回</Button>
                        </Space>
                      ) : <Text type="secondary">已处理</Text>,
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'audit',
            label: '审计事件',
            children: (
              <Card
                title={<Space><SafetyCertificateOutlined />语义层审计</Space>}
                extra={<Button icon={<ReloadOutlined />} onClick={refreshAudit}>刷新</Button>}
              >
                <Table
                  rowKey="event_id"
                  dataSource={auditEvents}
                  columns={[
                    { title: '事件', dataIndex: 'event_type', key: 'event_type' },
                    { title: '租户', dataIndex: 'tenant_id', key: 'tenant_id' },
                    { title: '角色', dataIndex: 'role', key: 'role' },
                    { title: '状态', dataIndex: 'status', key: 'status' },
                    { title: '说明', dataIndex: 'message', key: 'message' },
                    { title: '时间', dataIndex: 'created_at', key: 'created_at', render: (value) => new Date(value * 1000).toLocaleString() },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
