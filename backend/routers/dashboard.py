from fastapi import APIRouter
from db import query

router = APIRouter()


@router.get("/overview")
def overview():
    dq = query("""
        SELECT dq_score, critical_fail_cnt
        FROM ads.ads_dq_result_summary
        WHERE stat_date = CURDATE()
        ORDER BY dq_score ASC
        LIMIT 1
    """)
    mpi = query("""
        SELECT total_mpi_cnt
        FROM ads.ads_patient_mpi_summary
        ORDER BY stat_date DESC
        LIMIT 1
    """)
    return {
        "dq_score": dq[0]["dq_score"] if dq else 0,
        "critical_fail": dq[0]["critical_fail_cnt"] if dq else 0,
        "mpi_patient": mpi[0]["total_mpi_cnt"] if mpi else 0,
    }


@router.get("/pipeline-status")
def pipeline_status():
    layers = [
        ("ODS", "ods.ods_patient_visit_info", "k1"),
        ("DWD", "dwd.dwd_patient_visit_inc", "k1"),
        ("DWS", "dws.dws_patient_visit_1d", "stat_date"),
        ("ADS", "ads.ads_dq_result_summary", "stat_date"),
    ]
    result = []
    for layer, table, col in layers:
        try:
            rows = query(f"SELECT MAX({col}) AS last_update FROM {table}")
            last = rows[0]["last_update"] if rows and rows[0]["last_update"] else None
            result.append({"layer": layer, "last_update": str(last) if last else "N/A", "status": "ok"})
        except Exception:
            result.append({"layer": layer, "last_update": "N/A", "status": "error"})
    return result


@router.get("/alerts")
def alerts(limit: int = 10):
    rows = query("""
        SELECT check_time, rule_name, target_table AS table_name,
               severity_level AS severity, issue_count
        FROM dq.dq_check_result
        WHERE severity_level IN ('CRITICAL', 'HIGH')
          AND check_status = 'FAIL'
        ORDER BY check_time DESC
        LIMIT %s
    """, (limit,))
    return rows
