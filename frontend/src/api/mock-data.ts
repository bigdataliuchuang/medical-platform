// Demo mode mock responses — keyed by API path prefix
// Consumed by request.ts get() when IS_DEMO is true.

// ── Dashboard ──────────────────────────────────────────────────────────────

export const MOCK_DASHBOARD_OVERVIEW = {
  dq_score: 87.3,
  critical_fail: 2,
  mpi_patient: 12480,
};

export const MOCK_DASHBOARD_PIPELINE = [
  { layer: 'ODS', last_update: '2026-05-14', status: 'ok' },
  { layer: 'DWD', last_update: '2026-05-14', status: 'ok' },
  { layer: 'DWS', last_update: '2026-05-14', status: 'ok' },
  { layer: 'ADS', last_update: '2026-05-13', status: 'error' },
];

export const MOCK_DASHBOARD_ALERTS = [
  { check_time: '2026-05-14 08:10', rule_name: '处方剂量异常检测', table_name: 'ods_drug_orders', severity: 'CRITICAL', issue_count: 14 },
  { check_time: '2026-05-14 07:50', rule_name: '患者ID唯一性校验', table_name: 'dwd_patient_visit_inc', severity: 'HIGH', issue_count: 3 },
  { check_time: '2026-05-13 22:00', rule_name: '费用金额为负值', table_name: 'ods_expense_detail', severity: 'CRITICAL', issue_count: 7 },
  { check_time: '2026-05-13 20:30', rule_name: '入院日期晚于出院日期', table_name: 'dwd_inpatient_inc', severity: 'HIGH', issue_count: 2 },
];

// ── DQ ────────────────────────────────────────────────────────────────────

export const MOCK_DQ_SUMMARY = {
  overall_score: 87.3,
  layers: [
    { layer: 'ODS', score: 91.2, critical: 1, high: 3 },
    { layer: 'DWD', score: 88.6, critical: 1, high: 2 },
    { layer: 'DWS', score: 85.4, critical: 0, high: 4 },
    { layer: 'ADS', score: 84.1, critical: 0, high: 2 },
  ],
};

export const MOCK_DQ_TREND = Array.from({ length: 30 }, (_, i) => {
  const d = new Date('2026-04-15');
  d.setDate(d.getDate() + i);
  const base = 85 + Math.sin(i / 4) * 4 + Math.random() * 2;
  return { date: d.toISOString().slice(0, 10), score: parseFloat(base.toFixed(1)) };
});

export const MOCK_DQ_RULES = [
  { rule_name: '处方剂量异常检测', check_table: 'ods_drug_orders', data_layer: 'ODS', severity: 'CRITICAL', latest_status: 'FAIL', last_run: '2026-05-14 08:10' },
  { rule_name: '患者ID唯一性校验', check_table: 'dwd_patient_visit_inc', data_layer: 'DWD', severity: 'HIGH', latest_status: 'FAIL', last_run: '2026-05-14 07:50' },
  { rule_name: '费用金额非负校验', check_table: 'ods_expense_detail', data_layer: 'ODS', severity: 'CRITICAL', latest_status: 'FAIL', last_run: '2026-05-13 22:00' },
  { rule_name: '入出院日期顺序校验', check_table: 'dwd_inpatient_inc', data_layer: 'DWD', severity: 'HIGH', latest_status: 'FAIL', last_run: '2026-05-13 20:30' },
  { rule_name: '手术编码合规性校验', check_table: 'dwd_surgery_inc', data_layer: 'DWD', severity: 'HIGH', latest_status: 'PASS', last_run: '2026-05-14 06:00' },
  { rule_name: '药品编码标准化校验', check_table: 'dws_drug_daily', data_layer: 'DWS', severity: 'MEDIUM', latest_status: 'PASS', last_run: '2026-05-14 06:00' },
  { rule_name: '肿瘤类型完整性检测', check_table: 'ads_tumor_report_monthly', data_layer: 'ADS', severity: 'MEDIUM', latest_status: 'PASS', last_run: '2026-05-14 05:00' },
];

export const MOCK_DQ_ISSUES = {
  total: 26,
  list: [
    { check_time: '2026-05-14 08:10', rule_code: 'DQ-001', table_name: 'ods_drug_orders', severity: 'CRITICAL', issue_desc: '剂量字段超出正常范围 (>500mg)', data_layer: 'ODS' },
    { check_time: '2026-05-14 07:50', rule_code: 'DQ-002', table_name: 'dwd_patient_visit_inc', severity: 'HIGH', issue_desc: '患者ID重复出现在同一批次', data_layer: 'DWD' },
    { check_time: '2026-05-13 22:00', rule_code: 'DQ-003', table_name: 'ods_expense_detail', severity: 'CRITICAL', issue_desc: '费用总额为负数', data_layer: 'ODS' },
    { check_time: '2026-05-13 20:30', rule_code: 'DQ-004', table_name: 'dwd_inpatient_inc', severity: 'HIGH', issue_desc: '出院日期早于入院日期', data_layer: 'DWD' },
    { check_time: '2026-05-13 18:00', rule_code: 'DQ-005', table_name: 'dwd_inpatient_inc', severity: 'HIGH', issue_desc: '科室编码不在标准字典中', data_layer: 'DWD' },
  ],
};

// ── MPI ───────────────────────────────────────────────────────────────────

export const MOCK_MPI_SUMMARY = {
  source_count: 15320,
  mpi_count: 12480,
  dedup_rate: 18.5,
  exact_match: 9840,
  fuzzy_match: 2640,
  unmatched: 203,
};

export const MOCK_MPI_SOURCES_DIST = [
  { source_system: 'HIS', cnt: 8420 },
  { source_system: 'EMR', cnt: 3860 },
  { source_system: 'LIS', cnt: 2100 },
  { source_system: 'PACS', cnt: 940 },
];

// ── Drug ──────────────────────────────────────────────────────────────────

export const MOCK_DRUG_ALERTS = [
  { detect_time: '2026-05-14 08:10', rule_name: 'DQ-001', table_name: 'ods_drug_orders', severity: 'CRITICAL', issue_cnt: 14 },
  { detect_time: '2026-05-13 22:00', rule_name: 'DQ-003', table_name: 'ods_prescription', severity: 'HIGH', issue_cnt: 6 },
  { detect_time: '2026-05-12 15:30', rule_name: 'DQ-007', table_name: 'ods_drug_orders', severity: 'HIGH', issue_cnt: 3 },
];

// ── Expense ───────────────────────────────────────────────────────────────

export const MOCK_EXPENSE_SUMMARY = {
  total_expense: 28640000,
  total_patient: 3280,
  avg_expense: 8731.7,
  drug_ratio: 52.4,
};

export const MOCK_EXPENSE_BY_TUMOR = [
  { tumor_type: '肺癌',   patient_cnt: 840, avg_expense: 12480, drug_expense: 7200000, exam_expense: 1800000, surgery_expense: 980000, other_expense: 420000, drug_ratio: 63.2 },
  { tumor_type: '乳腺癌', patient_cnt: 620, avg_expense: 9860,  drug_expense: 3800000, exam_expense: 1200000, surgery_expense: 1040000, other_expense: 280000, drug_ratio: 61.9 },
  { tumor_type: '结直肠癌', patient_cnt: 510, avg_expense: 11200, drug_expense: 3600000, exam_expense: 1100000, surgery_expense: 860000, other_expense: 160000, drug_ratio: 62.7 },
  { tumor_type: '胃癌',   patient_cnt: 480, avg_expense: 9200,  drug_expense: 2760000, exam_expense: 980000, surgery_expense: 520000, other_expense: 160000, drug_ratio: 62.5 },
  { tumor_type: '淋巴瘤', patient_cnt: 380, avg_expense: 14600, drug_expense: 3500000, exam_expense: 900000, surgery_expense: 240000, other_expense: 220000, drug_ratio: 71.4 },
  { tumor_type: '肝癌',   patient_cnt: 450, avg_expense: 8400,  drug_expense: 2100000, exam_expense: 880000, surgery_expense: 640000, other_expense: 160000, drug_ratio: 55.6 },
];

// ── Inpatient ─────────────────────────────────────────────────────────────

export const MOCK_INPATIENT_QUALITY = {
  overview: {
    avg_inpatient_days: 9.2,
    long_stay_rate: 12.4,
    readmission_30d_rate: 3.8,
    surgery_cnt: 1240,
    complication_rate: 2.1,
    mortality_rate: 0.8,
    critical_timely_rate: 96.5,
    tumor_patient_cnt: 3280,
    tumor_avg_inpatient_days: 11.6,
  },
  departments: [
    { dept_name: '胸外科',   avg_inpatient_days: 10.4, surgery_cnt: 320, complication_rate: 2.8, readmission_30d_rate: 4.2, mortality_rate: 1.1 },
    { dept_name: '肿瘤内科', avg_inpatient_days: 12.1, surgery_cnt: 0,   complication_rate: 1.6, readmission_30d_rate: 3.5, mortality_rate: 0.6 },
    { dept_name: '乳腺外科', avg_inpatient_days: 8.6,  surgery_cnt: 280, complication_rate: 1.2, readmission_30d_rate: 2.8, mortality_rate: 0.2 },
    { dept_name: '普外科',   avg_inpatient_days: 9.8,  surgery_cnt: 360, complication_rate: 2.4, readmission_30d_rate: 3.9, mortality_rate: 0.7 },
    { dept_name: '血液科',   avg_inpatient_days: 14.2, surgery_cnt: 40,  complication_rate: 3.1, readmission_30d_rate: 5.6, mortality_rate: 1.4 },
    { dept_name: '放疗科',   avg_inpatient_days: 18.4, surgery_cnt: 0,   complication_rate: 1.8, readmission_30d_rate: 2.1, mortality_rate: 0.3 },
  ],
  trend: Array.from({ length: 30 }, (_, i) => {
    const d = new Date('2026-04-15');
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().slice(0, 10),
      avg_inpatient_days: parseFloat((9 + Math.sin(i / 5) * 0.8).toFixed(1)),
      surgery_cnt: Math.round(38 + Math.random() * 10),
      complication_rate: parseFloat((2 + Math.sin(i / 6) * 0.5).toFixed(1)),
    };
  }),
};
