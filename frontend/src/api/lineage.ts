import { get } from './request';

export interface LineageNode {
  id: string;
  name: string;
  layer: 'source' | 'ods' | 'dws' | 'ads';
  description: string;
  row_count?: number;
  last_updated?: string;
}

export interface LineageEdge {
  source: string;
  target: string;
  transform_type: 'etl' | 'sql' | 'stream';
  schedule?: string;
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

export interface TableLineage {
  table_name: string;
  layer: string;
  upstream: string[];
  downstream: string[];
  metrics: string[];
  owner: string;
  last_updated: string;
  row_count: number;
}

const MOCK_GRAPH: LineageGraph = {
  nodes: [
    { id: 'his_orders',    name: 'HIS 医嘱',  layer: 'source', description: '医院信息系统-医嘱数据' },
    { id: 'his_patients',  name: 'HIS 患者',  layer: 'source', description: '医院信息系统-患者信息' },
    { id: 'lis_lab',       name: 'LIS 检验',  layer: 'source', description: '检验信息系统-检验结果' },
    { id: 'emr_records',   name: 'EMR 病历',  layer: 'source', description: '电子病历系统-临床记录' },
    { id: 'ods_drug_orders',      name: 'ods_drug_orders',      layer: 'ods', description: '抗肿瘤药物医嘱原始层' },
    { id: 'ods_patient_info',     name: 'ods_patient_info',     layer: 'ods', description: '患者信息原始层' },
    { id: 'ods_lab_results',      name: 'ods_lab_results',      layer: 'ods', description: '检验结果原始层' },
    { id: 'ods_clinical_records', name: 'ods_clinical_records', layer: 'ods', description: '临床记录原始层' },
    { id: 'dws_drug_daily',     name: 'dws_drug_daily',     layer: 'dws', description: '药物使用日粒度汇总' },
    { id: 'dws_patient_master', name: 'dws_patient_master', layer: 'dws', description: '患者主数据整合层' },
    { id: 'dws_tumor_clinical', name: 'dws_tumor_clinical', layer: 'dws', description: '肿瘤临床数据宽表' },
    { id: 'dws_expense_detail', name: 'dws_expense_detail', layer: 'dws', description: '费用明细汇总层' },
    { id: 'ads_drug_usage_trend',       name: 'ads_drug_usage_trend',       layer: 'ads', description: '药物使用趋势看板' },
    { id: 'ads_patient_mpi_summary',    name: 'ads_patient_mpi_summary',    layer: 'ads', description: '患者主数据汇总' },
    { id: 'ads_dq_result_summary',      name: 'ads_dq_result_summary',      layer: 'ads', description: 'DQ 评分汇总' },
    { id: 'ads_expense_by_tumor_type',  name: 'ads_expense_by_tumor_type',  layer: 'ads', description: '按肿瘤类型费用分析' },
    { id: 'ads_inpatient_quality_board',name: 'ads_inpatient_quality_board',layer: 'ads', description: '住院质量看板' },
    { id: 'ads_tumor_report_monthly',   name: 'ads_tumor_report_monthly',   layer: 'ads', description: '月度肿瘤报告' },
  ],
  edges: [
    { source: 'his_orders',   target: 'ods_drug_orders',      transform_type: 'etl', schedule: '每日 01:00' },
    { source: 'his_patients', target: 'ods_patient_info',     transform_type: 'etl', schedule: '每日 00:30' },
    { source: 'lis_lab',      target: 'ods_lab_results',      transform_type: 'etl', schedule: '每日 02:00' },
    { source: 'emr_records',  target: 'ods_clinical_records', transform_type: 'etl', schedule: '每日 01:30' },
    { source: 'ods_drug_orders',      target: 'dws_drug_daily',     transform_type: 'sql', schedule: '每日 04:00' },
    { source: 'ods_patient_info',     target: 'dws_patient_master', transform_type: 'sql', schedule: '每日 03:00' },
    { source: 'ods_lab_results',      target: 'dws_patient_master', transform_type: 'sql', schedule: '每日 03:30' },
    { source: 'ods_clinical_records', target: 'dws_tumor_clinical', transform_type: 'sql', schedule: '每日 05:00' },
    { source: 'ods_drug_orders',      target: 'dws_expense_detail', transform_type: 'sql', schedule: '每日 04:30' },
    { source: 'ods_clinical_records', target: 'dws_expense_detail', transform_type: 'sql', schedule: '每日 05:30' },
    { source: 'dws_drug_daily',     target: 'ads_drug_usage_trend',        transform_type: 'sql', schedule: '每日 06:00' },
    { source: 'dws_patient_master', target: 'ads_patient_mpi_summary',     transform_type: 'sql', schedule: '每日 06:00' },
    { source: 'dws_drug_daily',     target: 'ads_dq_result_summary',       transform_type: 'sql', schedule: '每日 06:30' },
    { source: 'dws_tumor_clinical', target: 'ads_dq_result_summary',       transform_type: 'sql', schedule: '每日 06:30' },
    { source: 'dws_expense_detail', target: 'ads_expense_by_tumor_type',   transform_type: 'sql', schedule: '每日 07:00' },
    { source: 'dws_tumor_clinical', target: 'ads_inpatient_quality_board', transform_type: 'sql', schedule: '每日 07:00' },
    { source: 'dws_drug_daily',     target: 'ads_tumor_report_monthly',    transform_type: 'sql', schedule: '每月 1日 08:00' },
    { source: 'dws_tumor_clinical', target: 'ads_tumor_report_monthly',    transform_type: 'sql', schedule: '每月 1日 08:00' },
  ],
};

const MOCK_TABLES: TableLineage[] = [
  { table_name: 'ods_drug_orders',       layer: 'ODS', upstream: ['HIS 医嘱系统'],              downstream: ['dws_drug_daily', 'dws_expense_detail'],                                        metrics: ['药物使用量', '用药频次'],     owner: 'data-team',     last_updated: '2026-05-14', row_count: 2840000 },
  { table_name: 'ods_patient_info',      layer: 'ODS', upstream: ['HIS 患者系统'],              downstream: ['dws_patient_master'],                                                          metrics: ['患者总数'],                  owner: 'data-team',     last_updated: '2026-05-14', row_count: 980000  },
  { table_name: 'ods_lab_results',       layer: 'ODS', upstream: ['LIS 检验系统'],              downstream: ['dws_patient_master'],                                                          metrics: ['检验结果数'],                owner: 'data-team',     last_updated: '2026-05-14', row_count: 5600000 },
  { table_name: 'ods_clinical_records',  layer: 'ODS', upstream: ['EMR 电子病历'],              downstream: ['dws_tumor_clinical', 'dws_expense_detail'],                                    metrics: ['病历数'],                    owner: 'data-team',     last_updated: '2026-05-14', row_count: 1200000 },
  { table_name: 'dws_drug_daily',        layer: 'DWS', upstream: ['ods_drug_orders'],           downstream: ['ads_drug_usage_trend', 'ads_dq_result_summary', 'ads_tumor_report_monthly'],  metrics: ['日均用药量', 'ADR发生率'],   owner: 'data-team',     last_updated: '2026-05-14', row_count: 186000  },
  { table_name: 'dws_patient_master',    layer: 'DWS', upstream: ['ods_patient_info', 'ods_lab_results'], downstream: ['ads_patient_mpi_summary'],                                         metrics: ['MPI准确率', '患者总数'],     owner: 'data-team',     last_updated: '2026-05-14', row_count: 98000   },
  { table_name: 'dws_tumor_clinical',    layer: 'DWS', upstream: ['ods_clinical_records'],      downstream: ['ads_dq_result_summary', 'ads_inpatient_quality_board', 'ads_tumor_report_monthly'], metrics: ['肿瘤临床指标'],         owner: 'clinical-team', last_updated: '2026-05-14', row_count: 340000  },
  { table_name: 'dws_expense_detail',    layer: 'DWS', upstream: ['ods_drug_orders', 'ods_clinical_records'], downstream: ['ads_expense_by_tumor_type'],                                   metrics: ['医疗费用'],                  owner: 'data-team',     last_updated: '2026-05-14', row_count: 760000  },
  { table_name: 'ads_drug_usage_trend',       layer: 'ADS', upstream: ['dws_drug_daily'],     downstream: [], metrics: ['药物使用趋势', '异常告警数'],  owner: 'bi-team',       last_updated: '2026-05-14', row_count: 4380 },
  { table_name: 'ads_patient_mpi_summary',    layer: 'ADS', upstream: ['dws_patient_master'], downstream: [], metrics: ['患者主索引汇总'],              owner: 'bi-team',       last_updated: '2026-05-14', row_count: 12   },
  { table_name: 'ads_dq_result_summary',      layer: 'ADS', upstream: ['dws_drug_daily', 'dws_tumor_clinical'], downstream: [], metrics: ['DQ综合评分'], owner: 'bi-team',      last_updated: '2026-05-14', row_count: 365  },
  { table_name: 'ads_expense_by_tumor_type',  layer: 'ADS', upstream: ['dws_expense_detail'], downstream: [], metrics: ['肿瘤类型费用分析'],            owner: 'bi-team',       last_updated: '2026-05-14', row_count: 84   },
  { table_name: 'ads_inpatient_quality_board',layer: 'ADS', upstream: ['dws_tumor_clinical'], downstream: [], metrics: ['住院质量看板'],                owner: 'clinical-team', last_updated: '2026-05-14', row_count: 36   },
  { table_name: 'ads_tumor_report_monthly',   layer: 'ADS', upstream: ['dws_drug_daily', 'dws_tumor_clinical'], downstream: [], metrics: ['月度肿瘤报告'], owner: 'clinical-team',last_updated: '2026-05-14', row_count: 24   },
];

const IS_DEMO = !import.meta.env.VITE_API_BASE_URL;

export async function getLineageGraph(): Promise<LineageGraph> {
  if (IS_DEMO) return MOCK_GRAPH;
  return get<LineageGraph>('/api/lineage/graph');
}

export async function getTableLineages(): Promise<TableLineage[]> {
  if (IS_DEMO) return MOCK_TABLES;
  return get<TableLineage[]>('/api/lineage/tables');
}
