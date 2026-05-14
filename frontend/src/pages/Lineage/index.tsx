import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Row, Select, Space, Spin, Table, Tag, Typography } from 'antd';
import ReactECharts from 'echarts-for-react';
import KpiCard from '../../components/KpiCard';
import {
  getLineageSummary,
  listColumnLineageEdges,
  listLineageTables,
  listTableLineageEdges,
} from '../../api/lineage';
import type { ColumnLineageEdge, LineageSummary, LineageTable, TableLineageEdge } from '../../api/lineage';

const { Paragraph, Text, Title } = Typography;

function layerColor(layer: string) {
  const colors: Record<string, string> = {
    ods: 'blue', dim: 'cyan', dwd: 'geekblue', dws: 'purple',
    ads: 'magenta', dq: 'red', mpi: 'green', mdm: 'lime',
  };
  return colors[layer?.toLowerCase()] || 'default';
}

export default function Lineage() {
  const [summary, setSummary] = useState<LineageSummary | null>(null);
  const [tables, setTables] = useState<LineageTable[]>([]);
  const [tableEdges, setTableEdges] = useState<TableLineageEdge[]>([]);
  const [columnEdges, setColumnEdges] = useState<ColumnLineageEdge[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLineageSummary(),
      listLineageTables(),
      listTableLineageEdges(),
    ])
      .then(([nextSummary, nextTables, nextEdges]) => {
        setSummary(nextSummary);
        setTables(nextTables);
        setTableEdges(nextEdges);
        const firstAds = nextTables.find((item) => item.layer === 'ads')?.table_name;
        setSelectedTable(firstAds || nextTables[0]?.table_name);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTable) return;
    listColumnLineageEdges({ target_table: selectedTable })
      .then(setColumnEdges)
      .catch(() => setColumnEdges([]));
  }, [selectedTable]);

  const tableOptions = useMemo(
    () => tables.map((item) => ({ label: `${item.table_name} (${item.layer})`, value: item.table_name })),
    [tables],
  );

  const relatedEdges = useMemo(() => {
    if (!selectedTable) return tableEdges.slice(0, 80);
    return tableEdges.filter((edge) => edge.target_table === selectedTable || edge.source_table === selectedTable);
  }, [selectedTable, tableEdges]);

  const graphOption = useMemo(() => {
    const nodeNames = Array.from(new Set(relatedEdges.flatMap((edge) => [edge.source_table, edge.target_table])));
    return {
      tooltip: {},
      series: [{
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        force: { repulsion: 180, edgeLength: 110 },
        label: { show: true, fontSize: 11 },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 8],
        data: nodeNames.map((name) => ({
          name,
          symbolSize: name === selectedTable ? 58 : 42,
          itemStyle: {
            color: name.includes('ads.') ? '#c41d7f'
              : name.includes('dws.') ? '#722ed1'
              : name.includes('dwd.') ? '#1d39c4'
              : '#1677ff',
          },
        })),
        edges: relatedEdges.map((edge) => ({ source: edge.source_table, target: edge.target_table })),
      }],
    };
  }, [relatedEdges, selectedTable]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />;

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>血缘分析</Title>
      <Paragraph type="secondary">
        基于数仓 SQL 静态解析生成表级和字段级血缘，用于影响分析、DQ 问题定位和 AI 问数上下文增强。
      </Paragraph>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><KpiCard title="表级血缘" value={summary?.table_edge_count ?? 0} unit="条" /></Col>
        <Col span={6}><KpiCard title="字段级血缘" value={summary?.column_edge_count ?? 0} unit="条" /></Col>
        <Col span={6}><KpiCard title="表目录" value={summary?.table_count ?? 0} unit="张" /></Col>
        <Col span={6}><KpiCard title="主题域" value={summary?.subjects.length ?? 0} unit="个" /></Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Text strong>目标表</Text>
        <Select
          showSearch
          style={{ width: 420 }}
          options={tableOptions}
          value={selectedTable}
          onChange={setSelectedTable}
          optionFilterProp="label"
        />
      </Space>

      <Row gutter={16}>
        <Col span={14}>
          <Card title="表级影响关系">
            {relatedEdges.length ? (
              <ReactECharts option={graphOption} style={{ height: 420 }} />
            ) : (
              <Empty description="暂无表级血缘" />
            )}
          </Card>
        </Col>
        <Col span={10}>
          <Card title="表目录">
            <Table
              size="small"
              rowKey={(row) => `${row.engine}:${row.table_name}:${row.sql_file}`}
              dataSource={tables.filter((item) => !selectedTable || item.table_name === selectedTable).slice(0, 20)}
              pagination={false}
              columns={[
                { title: '表名', dataIndex: 'table_name', ellipsis: true },
                { title: '层级', dataIndex: 'layer', width: 72, render: (v) => <Tag color={layerColor(v)}>{v}</Tag> },
                { title: '主题', dataIndex: 'business_subject', width: 92 },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="字段级血缘" style={{ marginTop: 16 }}>
        <Table
          size="small"
          rowKey={(row) => `${row.target_table}.${row.target_column}:${row.source_table}.${row.source_column}:${row.sql_file}`}
          dataSource={columnEdges}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: '目标字段', render: (_, row: ColumnLineageEdge) => `${row.target_table}.${row.target_column}`, ellipsis: true },
            { title: '来源字段', render: (_, row: ColumnLineageEdge) => `${row.source_table}.${row.source_column}`, ellipsis: true },
            { title: '表达式', dataIndex: 'expression', ellipsis: true },
            { title: 'SQL 文件', dataIndex: 'sql_file', ellipsis: true },
          ]}
        />
      </Card>
    </div>
  );
}
