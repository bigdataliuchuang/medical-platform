from fastapi import APIRouter
from db import query

router = APIRouter()

# 静态血缘拓扑（反映实际 ODS→DWS→ADS 链路）
_NODES = [
    {"id": "ods_drug_orders",       "name": "ods_drug_orders",       "layer": "ods", "description": "抗肿瘤药物医嘱原始层"},
    {"id": "ods_patient_info",      "name": "ods_patient_info",      "layer": "ods", "description": "患者信息原始层"},
    {"id": "ods_lab_results",       "name": "ods_lab_results",       "layer": "ods", "description": "检验结果原始层"},
    {"id": "ods_clinical_records",  "name": "ods_clinical_records",  "layer": "ods", "description": "临床记录原始层"},
    {"id": "dws_drug_daily",        "name": "dws_drug_daily",        "layer": "dws", "description": "药物使用日粒度汇总"},
    {"id": "dws_patient_master",    "name": "dws_patient_master",    "layer": "dws", "description": "患者主数据整合层"},
    {"id": "dws_tumor_clinical",    "name": "dws_tumor_clinical",    "layer": "dws", "description": "肿瘤临床数据宽表"},
    {"id": "dws_expense_detail",    "name": "dws_expense_detail",    "layer": "dws", "description": "费用明细汇总层"},
    {"id": "ads_drug_usage_trend",        "name": "ads_drug_usage_trend",        "layer": "ads", "description": "药物使用趋势看板"},
    {"id": "ads_patient_mpi_summary",     "name": "ads_patient_mpi_summary",     "layer": "ads", "description": "患者主数据汇总"},
    {"id": "ads_dq_result_summary",       "name": "ads_dq_result_summary",       "layer": "ads", "description": "DQ 评分汇总"},
    {"id": "ads_expense_by_tumor_type",   "name": "ads_expense_by_tumor_type",   "layer": "ads", "description": "按肿瘤类型费用分析"},
    {"id": "ads_inpatient_quality_board", "name": "ads_inpatient_quality_board", "layer": "ads", "description": "住院质量看板"},
    {"id": "ads_tumor_report_monthly",    "name": "ads_tumor_report_monthly",    "layer": "ads", "description": "月度肿瘤报告"},
]

_EDGES = [
    {"source": "ods_drug_orders",      "target": "dws_drug_daily",     "transform_type": "sql", "schedule": "每日 04:00"},
    {"source": "ods_patient_info",     "target": "dws_patient_master", "transform_type": "sql", "schedule": "每日 03:00"},
    {"source": "ods_lab_results",      "target": "dws_patient_master", "transform_type": "sql", "schedule": "每日 03:30"},
    {"source": "ods_clinical_records", "target": "dws_tumor_clinical", "transform_type": "sql", "schedule": "每日 05:00"},
    {"source": "ods_drug_orders",      "target": "dws_expense_detail", "transform_type": "sql", "schedule": "每日 04:30"},
    {"source": "ods_clinical_records", "target": "dws_expense_detail", "transform_type": "sql", "schedule": "每日 05:30"},
    {"source": "dws_drug_daily",     "target": "ads_drug_usage_trend",        "transform_type": "sql", "schedule": "每日 06:00"},
    {"source": "dws_patient_master", "target": "ads_patient_mpi_summary",     "transform_type": "sql", "schedule": "每日 06:00"},
    {"source": "dws_drug_daily",     "target": "ads_dq_result_summary",       "transform_type": "sql", "schedule": "每日 06:30"},
    {"source": "dws_tumor_clinical", "target": "ads_dq_result_summary",       "transform_type": "sql", "schedule": "每日 06:30"},
    {"source": "dws_expense_detail", "target": "ads_expense_by_tumor_type",   "transform_type": "sql", "schedule": "每日 07:00"},
    {"source": "dws_tumor_clinical", "target": "ads_inpatient_quality_board", "transform_type": "sql", "schedule": "每日 07:00"},
    {"source": "dws_drug_daily",     "target": "ads_tumor_report_monthly",    "transform_type": "sql", "schedule": "每月 1日 08:00"},
    {"source": "dws_tumor_clinical", "target": "ads_tumor_report_monthly",    "transform_type": "sql", "schedule": "每月 1日 08:00"},
]


def _get_row_counts() -> dict:
    """尝试从 Doris 获取各 ADS 表行数；失败时静默返回空字典。"""
    ads_tables = [n["id"] for n in _NODES if n["layer"] == "ads"]
    counts: dict = {}
    for tbl in ads_tables:
        try:
            rows = query(f"SELECT COUNT(*) AS cnt FROM ads.{tbl}")
            counts[tbl] = rows[0]["cnt"] if rows else 0
        except Exception:
            pass
    return counts


@router.get("/graph")
def lineage_graph():
    return {"nodes": _NODES, "edges": _EDGES}


@router.get("/tables")
def lineage_tables():
    row_counts = _get_row_counts()
    upstream_map: dict = {n["id"]: [] for n in _NODES}
    downstream_map: dict = {n["id"]: [] for n in _NODES}
    for e in _EDGES:
        downstream_map[e["source"]].append(e["target"])
        upstream_map[e["target"]].append(e["source"])

    _METRICS = {
        "ods_drug_orders":        ["药物使用量", "用药频次"],
        "ods_patient_info":       ["患者总数"],
        "ods_lab_results":        ["检验结果数"],
        "ods_clinical_records":   ["病历数"],
        "dws_drug_daily":         ["日均用药量", "ADR发生率"],
        "dws_patient_master":     ["MPI准确率", "患者总数"],
        "dws_tumor_clinical":     ["肿瘤临床指标"],
        "dws_expense_detail":     ["医疗费用"],
        "ads_drug_usage_trend":        ["药物使用趋势", "异常告警数"],
        "ads_patient_mpi_summary":     ["患者主索引汇总"],
        "ads_dq_result_summary":       ["DQ综合评分"],
        "ads_expense_by_tumor_type":   ["肿瘤类型费用分析"],
        "ads_inpatient_quality_board": ["住院质量看板"],
        "ads_tumor_report_monthly":    ["月度肿瘤报告"],
    }

    result = []
    for n in _NODES:
        result.append({
            "table_name":   n["id"],
            "layer":        n["layer"].upper(),
            "upstream":     upstream_map.get(n["id"], []),
            "downstream":   downstream_map.get(n["id"], []),
            "metrics":      _METRICS.get(n["id"], []),
            "owner":        "clinical-team" if "tumor" in n["id"] or "inpatient" in n["id"] else "data-team",
            "last_updated": "2026-05-14",
            "row_count":    row_counts.get(n["id"], 0),
        })
    return result
