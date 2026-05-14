import { get } from './request';

export interface LineageSummary {
  table_edge_count: number;
  column_edge_count: number;
  table_count: number;
  layers: string[];
  engines: string[];
  subjects: string[];
}

export interface LineageTable {
  table_name: string;
  layer: string;
  engine: string;
  sql_file: string;
  business_subject: string;
}

export interface TableLineageEdge {
  source_table: string;
  target_table: string;
  source_layer: string;
  target_layer: string;
  engine: string;
  sql_file: string;
}

export interface ColumnLineageEdge {
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
  source_layer: string;
  target_layer: string;
  engine: string;
  expression: string;
  sql_file: string;
}

// ── Demo / GitHub Pages fallback ──────────────────────────────────────────────

const IS_DEMO = !import.meta.env.VITE_API_BASE_URL;

const DEMO_SUMMARY: LineageSummary = {
  table_edge_count: 18, column_edge_count: 64, table_count: 14,
  layers: ['ods', 'dws', 'ads'], engines: ['doris'], subjects: ['药物监测', '患者主数据', '费用分析', '住院质量', '数据质量'],
};

const DEMO_TABLES: LineageTable[] = [
  { table_name: 'ods.ods_drug_orders',       layer: 'ods', engine: 'doris', sql_file: 'ods/drug_orders.sql',      business_subject: '药物监测' },
  { table_name: 'ods.ods_patient_info',      layer: 'ods', engine: 'doris', sql_file: 'ods/patient_info.sql',     business_subject: '患者主数据' },
  { table_name: 'ods.ods_lab_results',       layer: 'ods', engine: 'doris', sql_file: 'ods/lab_results.sql',      business_subject: '患者主数据' },
  { table_name: 'ods.ods_clinical_records',  layer: 'ods', engine: 'doris', sql_file: 'ods/clinical_records.sql', business_subject: '住院质量' },
  { table_name: 'dws.dws_drug_daily',        layer: 'dws', engine: 'doris', sql_file: 'dws/drug_daily.sql',       business_subject: '药物监测' },
  { table_name: 'dws.dws_patient_master',    layer: 'dws', engine: 'doris', sql_file: 'dws/patient_master.sql',   business_subject: '患者主数据' },
  { table_name: 'dws.dws_tumor_clinical',    layer: 'dws', engine: 'doris', sql_file: 'dws/tumor_clinical.sql',   business_subject: '住院质量' },
  { table_name: 'dws.dws_expense_detail',    layer: 'dws', engine: 'doris', sql_file: 'dws/expense_detail.sql',   business_subject: '费用分析' },
  { table_name: 'ads.ads_drug_usage_trend',        layer: 'ads', engine: 'doris', sql_file: 'ads/drug_usage_trend.sql',        business_subject: '药物监测' },
  { table_name: 'ads.ads_patient_mpi_summary',     layer: 'ads', engine: 'doris', sql_file: 'ads/patient_mpi_summary.sql',     business_subject: '患者主数据' },
  { table_name: 'ads.ads_dq_result_summary',       layer: 'ads', engine: 'doris', sql_file: 'ads/dq_result_summary.sql',       business_subject: '数据质量' },
  { table_name: 'ads.ads_expense_by_tumor_type',   layer: 'ads', engine: 'doris', sql_file: 'ads/expense_by_tumor_type.sql',   business_subject: '费用分析' },
  { table_name: 'ads.ads_inpatient_quality_board', layer: 'ads', engine: 'doris', sql_file: 'ads/inpatient_quality_board.sql', business_subject: '住院质量' },
  { table_name: 'ads.ads_tumor_report_monthly',    layer: 'ads', engine: 'doris', sql_file: 'ads/tumor_report_monthly.sql',    business_subject: '药物监测' },
];

const DEMO_TABLE_EDGES: TableLineageEdge[] = [
  { source_table: 'ods.ods_drug_orders',      target_table: 'dws.dws_drug_daily',     source_layer: 'ods', target_layer: 'dws', engine: 'doris', sql_file: 'dws/drug_daily.sql' },
  { source_table: 'ods.ods_patient_info',     target_table: 'dws.dws_patient_master', source_layer: 'ods', target_layer: 'dws', engine: 'doris', sql_file: 'dws/patient_master.sql' },
  { source_table: 'ods.ods_lab_results',      target_table: 'dws.dws_patient_master', source_layer: 'ods', target_layer: 'dws', engine: 'doris', sql_file: 'dws/patient_master.sql' },
  { source_table: 'ods.ods_clinical_records', target_table: 'dws.dws_tumor_clinical', source_layer: 'ods', target_layer: 'dws', engine: 'doris', sql_file: 'dws/tumor_clinical.sql' },
  { source_table: 'ods.ods_drug_orders',      target_table: 'dws.dws_expense_detail', source_layer: 'ods', target_layer: 'dws', engine: 'doris', sql_file: 'dws/expense_detail.sql' },
  { source_table: 'ods.ods_clinical_records', target_table: 'dws.dws_expense_detail', source_layer: 'ods', target_layer: 'dws', engine: 'doris', sql_file: 'dws/expense_detail.sql' },
  { source_table: 'dws.dws_drug_daily',     target_table: 'ads.ads_drug_usage_trend',        source_layer: 'dws', target_layer: 'ads', engine: 'doris', sql_file: 'ads/drug_usage_trend.sql' },
  { source_table: 'dws.dws_patient_master', target_table: 'ads.ads_patient_mpi_summary',     source_layer: 'dws', target_layer: 'ads', engine: 'doris', sql_file: 'ads/patient_mpi_summary.sql' },
  { source_table: 'dws.dws_drug_daily',     target_table: 'ads.ads_dq_result_summary',       source_layer: 'dws', target_layer: 'ads', engine: 'doris', sql_file: 'ads/dq_result_summary.sql' },
  { source_table: 'dws.dws_tumor_clinical', target_table: 'ads.ads_dq_result_summary',       source_layer: 'dws', target_layer: 'ads', engine: 'doris', sql_file: 'ads/dq_result_summary.sql' },
  { source_table: 'dws.dws_expense_detail', target_table: 'ads.ads_expense_by_tumor_type',   source_layer: 'dws', target_layer: 'ads', engine: 'doris', sql_file: 'ads/expense_by_tumor_type.sql' },
  { source_table: 'dws.dws_tumor_clinical', target_table: 'ads.ads_inpatient_quality_board', source_layer: 'dws', target_layer: 'ads', engine: 'doris', sql_file: 'ads/inpatient_quality_board.sql' },
  { source_table: 'dws.dws_drug_daily',     target_table: 'ads.ads_tumor_report_monthly',    source_layer: 'dws', target_layer: 'ads', engine: 'doris', sql_file: 'ads/tumor_report_monthly.sql' },
  { source_table: 'dws.dws_tumor_clinical', target_table: 'ads.ads_tumor_report_monthly',    source_layer: 'dws', target_layer: 'ads', engine: 'doris', sql_file: 'ads/tumor_report_monthly.sql' },
];

const DEMO_COLUMN_EDGES: ColumnLineageEdge[] = [
  { source_table: 'ods.ods_drug_orders', source_column: 'drug_code',    target_table: 'dws.dws_drug_daily', target_column: 'drug_code',    source_layer: 'ods', target_layer: 'dws', engine: 'doris', expression: 'drug_code', sql_file: 'dws/drug_daily.sql' },
  { source_table: 'ods.ods_drug_orders', source_column: 'order_date',   target_table: 'dws.dws_drug_daily', target_column: 'stat_date',    source_layer: 'ods', target_layer: 'dws', engine: 'doris', expression: 'DATE(order_date)', sql_file: 'dws/drug_daily.sql' },
  { source_table: 'ods.ods_drug_orders', source_column: 'dosage',       target_table: 'dws.dws_drug_daily', target_column: 'total_dosage', source_layer: 'ods', target_layer: 'dws', engine: 'doris', expression: 'SUM(dosage)', sql_file: 'dws/drug_daily.sql' },
  { source_table: 'ods.ods_drug_orders', source_column: 'patient_id',   target_table: 'dws.dws_drug_daily', target_column: 'patient_cnt',  source_layer: 'ods', target_layer: 'dws', engine: 'doris', expression: 'COUNT(DISTINCT patient_id)', sql_file: 'dws/drug_daily.sql' },
  { source_table: 'ods.ods_patient_info', source_column: 'patient_id',  target_table: 'dws.dws_patient_master', target_column: 'patient_id',  source_layer: 'ods', target_layer: 'dws', engine: 'doris', expression: 'patient_id', sql_file: 'dws/patient_master.sql' },
  { source_table: 'ods.ods_patient_info', source_column: 'patient_name',target_table: 'dws.dws_patient_master', target_column: 'patient_name',source_layer: 'ods', target_layer: 'dws', engine: 'doris', expression: 'patient_name', sql_file: 'dws/patient_master.sql' },
  { source_table: 'ods.ods_lab_results',  source_column: 'patient_id',  target_table: 'dws.dws_patient_master', target_column: 'lab_count',   source_layer: 'ods', target_layer: 'dws', engine: 'doris', expression: 'COUNT(*)', sql_file: 'dws/patient_master.sql' },
  { source_table: 'dws.dws_drug_daily', source_column: 'total_dosage',  target_table: 'ads.ads_drug_usage_trend', target_column: 'avg_daily_dosage', source_layer: 'dws', target_layer: 'ads', engine: 'doris', expression: 'AVG(total_dosage)', sql_file: 'ads/drug_usage_trend.sql' },
  { source_table: 'dws.dws_drug_daily', source_column: 'stat_date',     target_table: 'ads.ads_drug_usage_trend', target_column: 'stat_date',        source_layer: 'dws', target_layer: 'ads', engine: 'doris', expression: 'stat_date', sql_file: 'ads/drug_usage_trend.sql' },
];

// ── Public API ────────────────────────────────────────────────────────────────

export function getLineageSummary(): Promise<LineageSummary> {
  if (IS_DEMO) return Promise.resolve(DEMO_SUMMARY);
  return get<LineageSummary>('/api/lineage/summary');
}

export function listLineageTables(params?: { layer?: string; engine?: string; subject?: string }): Promise<LineageTable[]> {
  if (IS_DEMO) return Promise.resolve(DEMO_TABLES);
  return get<LineageTable[]>('/api/lineage/tables', params);
}

export function listTableLineageEdges(params?: { target_table?: string; source_table?: string }): Promise<TableLineageEdge[]> {
  if (IS_DEMO) {
    let rows = DEMO_TABLE_EDGES;
    if (params?.target_table) rows = rows.filter(r => r.target_table === params.target_table);
    if (params?.source_table) rows = rows.filter(r => r.source_table === params.source_table);
    return Promise.resolve(rows);
  }
  return get<TableLineageEdge[]>('/api/lineage/table-edges', params);
}

export function listColumnLineageEdges(params?: { target_table?: string; target_column?: string }): Promise<ColumnLineageEdge[]> {
  if (IS_DEMO) {
    let rows = DEMO_COLUMN_EDGES;
    if (params?.target_table) rows = rows.filter(r => r.target_table === params.target_table);
    if (params?.target_column) rows = rows.filter(r => r.target_column === params.target_column);
    return Promise.resolve(rows);
  }
  return get<ColumnLineageEdge[]>('/api/lineage/column-edges', params);
}
