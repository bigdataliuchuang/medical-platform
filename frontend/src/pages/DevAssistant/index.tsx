import { useState } from 'react';
import { Alert, Button, Card, Col, Divider, Input, List, Row, Space, Tag, Typography, message } from 'antd';
import { BulbOutlined, CodeOutlined, DatabaseOutlined, SaveOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { generateMetricPlan, saveMetricAsset } from '../../api/dev';
import type { MetricPlan } from '../../api/dev';

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

const examples = [
  '我要做抗肿瘤药物使用强度指标',
  '我要分析待审核重复患者队列',
];

function TagList({ items, color }: { items: string[]; color?: string }) {
  if (!items?.length) return <Text type="secondary">暂无</Text>;
  return (
    <Space wrap>
      {items.map((item) => (
        <Tag color={color} key={item}>{item}</Tag>
      ))}
    </Space>
  );
}

function DesignCard({ title, icon, design }: {
  title: string;
  icon: React.ReactNode;
  design: MetricPlan['dws_design'] | MetricPlan['ads_design'];
}) {
  return (
    <Card title={<Space>{icon}{title}</Space>} size="small">
      <Paragraph strong copyable>{design.table_name}</Paragraph>
      <Text type="secondary">{design.description}</Text>
      <Divider />
      <Text strong>统计粒度</Text>
      <div style={{ marginTop: 8, marginBottom: 12 }}><TagList items={design.grain} color="blue" /></div>
      <Text strong>核心指标</Text>
      <div style={{ marginTop: 8 }}><TagList items={design.measures} color="green" /></div>
    </Card>
  );
}

export default function DevAssistant() {
  const [requirement, setRequirement] = useState(examples[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<MetricPlan | null>(null);
  const [assetPaths, setAssetPaths] = useState<{ yaml_path: string; markdown_path: string } | null>(null);

  const handleGenerate = async (value = requirement) => {
    const text = value.trim();
    if (!text) {
      message.warning('请输入指标开发需求');
      return;
    }
    setRequirement(text);
    setLoading(true);
    try {
      const nextPlan = await generateMetricPlan(text);
      setPlan(nextPlan);
      setAssetPaths(null);
    } catch {
      message.error('指标开发助手暂时不可用，请检查 AI Agent 服务');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!plan || saving) return;
    setSaving(true);
    try {
      const result = await saveMetricAsset(plan);
      setAssetPaths({ yaml_path: result.yaml_path, markdown_path: result.markdown_path });
      message.success('指标资产已保存');
    } catch {
      message.error('保存失败，请检查 AI Agent 服务和资产目录权限');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>AI 指标开发</Title>
      <Paragraph type="secondary">
        输入业务指标需求，生成 DWS/ADS 建模草案、SQL 草稿、DQ 规则和安全下钻策略。当前版本只做开发辅助，不直接执行明细层 SQL。
      </Paragraph>

      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={9}>
            <TextArea
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              rows={8}
              placeholder="例如：我要做抗肿瘤药物使用强度指标"
            />
            <Space wrap style={{ marginTop: 12 }}>
              {examples.map((item) => (
                <Button key={item} onClick={() => handleGenerate(item)}>{item}</Button>
              ))}
            </Space>
            <div style={{ marginTop: 16 }}>
              <Button type="primary" icon={<BulbOutlined />} loading={loading} onClick={() => handleGenerate()} block>
                生成指标开发方案
              </Button>
            </div>
          </Col>

          <Col xs={24} lg={15}>
            {!plan ? (
              <Alert
                type="info"
                showIcon
                message="等待生成"
                description="这里会展示推荐源表、DWS/ADS 设计、SQL 草稿、DQ 规则、血缘和下钻安全策略。"
              />
            ) : (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {plan.warnings.map((item) => (
                  <Alert key={item} type="warning" showIcon message={item} />
                ))}

                <Card size="small" title="指标识别">
                  <Space direction="vertical">
                    <Text><Text strong>指标编码：</Text>{plan.metric_code}</Text>
                    <Text><Text strong>指标名称：</Text>{plan.metric_name}</Text>
                    <Text><Text strong>业务域：</Text>{plan.business_domain}</Text>
                    <div>
                      <Text strong>推荐源表：</Text>
                      <div style={{ marginTop: 8 }}><TagList items={plan.source_tables} color="purple" /></div>
                    </div>
                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                      保存为指标资产
                    </Button>
                    {assetPaths && (
                      <Alert
                        type="success"
                        showIcon
                        message="资产已保存"
                        description={
                          <Space direction="vertical">
                            <Text>YAML：{assetPaths.yaml_path}</Text>
                            <Text>Markdown：{assetPaths.markdown_path}</Text>
                          </Space>
                        }
                      />
                    )}
                  </Space>
                </Card>

                <Row gutter={[16, 16]}>
                  <Col xs={24} xl={12}>
                    <DesignCard title="DWS 汇总层设计" icon={<DatabaseOutlined />} design={plan.dws_design} />
                  </Col>
                  <Col xs={24} xl={12}>
                    <DesignCard title="ADS 服务层设计" icon={<DatabaseOutlined />} design={plan.ads_design} />
                  </Col>
                </Row>

                <Card title={<Space><CodeOutlined />SQL 草稿</Space>} size="small">
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{plan.sql_draft}</pre>
                </Card>

                <Card title={<Space><SafetyCertificateOutlined />DQ 规则草案</Space>} size="small">
                  <List
                    dataSource={plan.dq_rules}
                    renderItem={(rule) => (
                      <List.Item>
                        <List.Item.Meta
                          title={<Space><Tag color={rule.severity === 'CRITICAL' ? 'red' : 'orange'}>{rule.severity}</Tag>{rule.rule_code} {rule.rule_name}</Space>}
                          description={<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{rule.check_sql}</pre>}
                        />
                      </List.Item>
                    )}
                  />
                </Card>

                <Row gutter={[16, 16]}>
                  <Col xs={24} xl={12}>
                    <Card title="血缘路径" size="small">
                      <Paragraph><Text strong>上游：</Text>{plan.lineage.upstream.join(' -> ')}</Paragraph>
                      <Paragraph><Text strong>DWS：</Text>{plan.lineage.dws}</Paragraph>
                      <Paragraph><Text strong>ADS：</Text>{plan.lineage.ads}</Paragraph>
                    </Card>
                  </Col>
                  <Col xs={24} xl={12}>
                    <Card title="安全下钻策略" size="small">
                      <Paragraph><Text strong>默认查询层：</Text>{plan.drilldown_policy.default_layer}</Paragraph>
                      <Paragraph><Text strong>明细层：</Text>{plan.drilldown_policy.detail_layer}</Paragraph>
                      <Text strong>禁止项</Text>
                      <div style={{ marginTop: 8, marginBottom: 12 }}><TagList items={plan.drilldown_policy.forbidden} color="red" /></div>
                      <Text strong>强制保护</Text>
                      <div style={{ marginTop: 8 }}><TagList items={plan.drilldown_policy.required_guards} color="cyan" /></div>
                    </Card>
                  </Col>
                </Row>
              </Space>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
}
