import { useEffect, useState, useCallback } from 'react';
import { Tabs, Table, Tag, Space, Select, Card, Row, Col, Statistic, Tooltip, Badge, message } from 'antd';
import ReactECharts from 'echarts-for-react';
import { BranchesOutlined, TableOutlined, ApartmentOutlined } from '@ant-design/icons';
import {
  getLineageGraph, getTableLineages,
  type LineageGraph, type TableLineage,
} from '../../api/lineage';

const LAYER_LABEL: Record<string, string> = {
  source: '源系统', ods: 'ODS 层', dws: 'DWS 层', ads: 'ADS 层',
};
const LAYER_COLOR: Record<string, string> = {
  source: '#6366f1', ods: '#0891b2', dws: '#059669', ads: '#2563eb',
};
const LAYER_X: Record<string, number> = {
  source: 120, ods: 340, dws: 560, ads: 800,
};

function buildGraphOption(graph: LineageGraph, focusId: string | null) {
  const byLayer: Record<string, typeof graph.nodes> = {
    source: [], ods: [], dws: [], ads: [],
  };
  graph.nodes.forEach(n => byLayer[n.layer].push(n));

  const CANVAS_H = 560;
  const posMap: Record<string, { x: number; y: number }> = {};
  Object.entries(byLayer).forEach(([layer, nodes]) => {
    const step = CANVAS_H / (nodes.length + 1);
    nodes.forEach((n, i) => {
      posMap[n.id] = { x: LAYER_X[layer], y: step * (i + 1) };
    });
  });

  const focusSet = new Set<string>();
  if (focusId) {
    focusSet.add(focusId);
    graph.edges.forEach(e => {
      if (e.source === focusId) focusSet.add(e.target);
      if (e.target === focusId) focusSet.add(e.source);
    });
  }

  const nodes = graph.nodes.map(n => ({
    id: n.id,
    name: n.name,
    x: posMap[n.id].x,
    y: posMap[n.id].y,
    category: ['source', 'ods', 'dws', 'ads'].indexOf(n.layer),
    symbolSize: n.layer === 'ads' ? 42 : n.layer === 'source' ? 36 : 38,
    itemStyle: {
      color: LAYER_COLOR[n.layer],
      opacity: focusId && !focusSet.has(n.id) ? 0.2 : 1,
    },
    label: {
      show: true,
      position: n.layer === 'ads' ? 'right' : n.layer === 'source' ? 'left' : 'bottom',
      fontSize: 11,
      color: '#334155',
      formatter: (p: { name: string }) => {
        const s = p.name;
        return s.length > 16 ? s.slice(0, 14) + '…' : s;
      },
    },
    tooltip: { formatter: `${n.name}<br/>${n.description}` },
  }));

  const links = graph.edges.map(e => ({
    source: e.source,
    target: e.target,
    lineStyle: {
      color: focusId && (!focusSet.has(e.source) || !focusSet.has(e.target)) ? '#e2e8f0' : '#94a3b8',
      width: focusId && focusSet.has(e.source) && focusSet.has(e.target) ? 2 : 1,
      curveness: 0.1,
    },
    tooltip: { formatter: `${e.source} → ${e.target}<br/>调度：${e.schedule || '-'}` },
  }));

  return {
    tooltip: { trigger: 'item' },
    legend: {
      data: ['源系统', 'ODS 层', 'DWS 层', 'ADS 层'],
      top: 8,
      textStyle: { fontSize: 12, color: '#64748b' },
    },
    categories: [
      { name: '源系统', itemStyle: { color: LAYER_COLOR.source } },
      { name: 'ODS 层', itemStyle: { color: LAYER_COLOR.ods } },
      { name: 'DWS 层', itemStyle: { color: LAYER_COLOR.dws } },
      { name: 'ADS 层', itemStyle: { color: LAYER_COLOR.ads } },
    ],
    series: [{
      type: 'graph',
      layout: 'none',
      roam: true,
      draggable: false,
      nodes,
      links,
      edgeSymbol: ['none', 'arrow'],
      edgeSymbolSize: [0, 8],
      emphasis: { focus: 'adjacency' },
      lineStyle: { opacity: 0.6 },
    }],
  };
}

const LAYER_TAG_COLOR: Record<string, string> = {
  ODS: 'cyan', DWS: 'green', ADS: 'blue', SOURCE: 'purple',
};

export default function Lineage() {
  const [graph, setGraph] = useState<LineageGraph | null>(null);
  const [tables, setTables] = useState<TableLineage[]>([]);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [impactTable, setImpactTable] = useState<string | null>(null);

  useEffect(() => {
    getLineageGraph()
      .then(setGraph)
      .catch(() => message.error('血缘图谱加载失败'));
    getTableLineages()
      .then(setTables)
      .catch(() => message.error('表血缘加载失败'));
  }, []);

  const onGraphClick = useCallback((params: { dataType: string; data: { id: string } }) => {
    if (params.dataType === 'node') {
      setFocusId(prev => prev === params.data.id ? null : params.data.id);
    }
  }, []);

  const focusedTable = impactTable ? tables.find(t => t.table_name === impactTable) : null;

  const tableColumns = [
    {
      title: '表名', dataIndex: 'table_name', key: 'table_name',
      render: (v: string) => <code style={{ fontSize: 12 }}>{v}</code>,
    },
    {
      title: '层级', dataIndex: 'layer', key: 'layer',
      width: 80,
      render: (v: string) => <Tag color={LAYER_TAG_COLOR[v] ?? 'default'}>{v}</Tag>,
    },
    {
      title: '上游', dataIndex: 'upstream', key: 'upstream',
      render: (v: string[]) => (
        <Space size={4} wrap>
          {v.map(s => <Tag key={s} style={{ fontSize: 11 }}>{s}</Tag>)}
        </Space>
      ),
    },
    {
      title: '下游', dataIndex: 'downstream', key: 'downstream',
      render: (v: string[]) => (
        <Space size={4} wrap>
          {v.length ? v.map(s => <Tag key={s} color="blue" style={{ fontSize: 11 }}>{s}</Tag>)
            : <span style={{ color: '#94a3b8', fontSize: 12 }}>终端节点</span>}
        </Space>
      ),
    },
    {
      title: '关联指标', dataIndex: 'metrics', key: 'metrics',
      render: (v: string[]) => (
        <Space size={4} wrap>{v.map(s => <Tag key={s} color="geekblue" style={{ fontSize: 11 }}>{s}</Tag>)}</Space>
      ),
    },
    {
      title: '行数', dataIndex: 'row_count', key: 'row_count', width: 100,
      render: (v: number) => v.toLocaleString(),
      sorter: (a: TableLineage, b: TableLineage) => a.row_count - b.row_count,
    },
    {
      title: 'Owner', dataIndex: 'owner', key: 'owner', width: 120,
      render: (v: string) => <Badge status="processing" text={v} />,
    },
  ];

  const statItems = [
    { title: '总表数', value: tables.length },
    { title: 'ODS 表', value: tables.filter(t => t.layer === 'ODS').length },
    { title: 'DWS 表', value: tables.filter(t => t.layer === 'DWS').length },
    { title: 'ADS 表', value: tables.filter(t => t.layer === 'ADS').length },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statItems.map(s => (
          <Col key={s.title} span={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic title={s.title} value={s.value} valueStyle={{ fontSize: 22, color: '#2563eb' }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs
        defaultActiveKey="graph"
        items={[
          {
            key: 'graph',
            label: <><BranchesOutlined /> 血缘图谱</>,
            children: (
              <Card
                size="small"
                style={{ borderRadius: 8 }}
                extra={
                  focusId && (
                    <Space>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        已聚焦：<code>{focusId}</code>
                      </span>
                      <a onClick={() => setFocusId(null)} style={{ fontSize: 12 }}>清除</a>
                    </Space>
                  )
                }
                title={
                  <Space>
                    <span>数据流向图</span>
                    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
                      点击节点高亮上下游链路
                    </span>
                    {Object.entries(LAYER_LABEL).map(([k, v]) => (
                      <Tooltip key={k} title={v}>
                        <Tag color={LAYER_COLOR[k]} style={{ cursor: 'default' }}>{v}</Tag>
                      </Tooltip>
                    ))}
                  </Space>
                }
              >
                {graph && (
                  <ReactECharts
                    option={buildGraphOption(graph, focusId)}
                    style={{ height: 580 }}
                    onEvents={{ click: onGraphClick }}
                  />
                )}
              </Card>
            ),
          },
          {
            key: 'tables',
            label: <><TableOutlined /> 表血缘</>,
            children: (
              <Card size="small" style={{ borderRadius: 8 }}>
                <Table
                  dataSource={tables}
                  columns={tableColumns}
                  rowKey="table_name"
                  size="small"
                  pagination={{ pageSize: 20, showSizeChanger: false }}
                />
              </Card>
            ),
          },
          {
            key: 'impact',
            label: <><ApartmentOutlined /> 影响分析</>,
            children: (
              <Card size="small" style={{ borderRadius: 8 }}>
                <Space style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 13 }}>选择表：</span>
                  <Select
                    showSearch
                    placeholder="输入表名搜索"
                    style={{ width: 320 }}
                    options={tables.map(t => ({ value: t.table_name, label: t.table_name }))}
                    onChange={v => setImpactTable(v)}
                    allowClear
                  />
                </Space>
                {focusedTable ? (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card
                        size="small"
                        title={<span style={{ color: '#0891b2' }}>上游依赖（{focusedTable.upstream.length}）</span>}
                        style={{ borderRadius: 8, borderColor: '#bae6fd' }}
                      >
                        {focusedTable.upstream.length ? (
                          focusedTable.upstream.map(t => (
                            <div key={t} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                              <code>{t}</code>
                            </div>
                          ))
                        ) : (
                          <span style={{ color: '#94a3b8' }}>无上游（源头表）</span>
                        )}
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card
                        size="small"
                        title={<span style={{ color: '#dc2626' }}>下游影响（{focusedTable.downstream.length}）</span>}
                        style={{ borderRadius: 8, borderColor: '#fecaca' }}
                        extra={
                          focusedTable.downstream.length > 0 && (
                            <Tag color="red" style={{ fontSize: 11 }}>
                              变更将影响 {focusedTable.downstream.length} 张下游表
                            </Tag>
                          )
                        }
                      >
                        {focusedTable.downstream.length ? (
                          focusedTable.downstream.map(t => (
                            <div key={t} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                              <code>{t}</code>
                            </div>
                          ))
                        ) : (
                          <span style={{ color: '#94a3b8' }}>无下游（终端表）</span>
                        )}
                      </Card>
                    </Col>
                    <Col span={24} style={{ marginTop: 16 }}>
                      <Card size="small" title="关联指标" style={{ borderRadius: 8 }}>
                        <Space wrap>
                          {focusedTable.metrics.map(m => (
                            <Tag key={m} color="geekblue">{m}</Tag>
                          ))}
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0', fontSize: 14 }}>
                    请选择一张表，查看其上下游依赖和影响范围
                  </div>
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
