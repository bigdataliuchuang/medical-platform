import csv
import io

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from db import query

router = APIRouter()


@router.get("/summary")
def summary():
    rows = query("""
        SELECT data_layer, dq_score, critical_fail_cnt, high_fail_cnt
        FROM ads.ads_dq_result_summary
        WHERE stat_date = CURDATE()
    """)
    overall = query("""
        SELECT AVG(dq_score) AS overall_score
        FROM ads.ads_dq_result_summary
        WHERE stat_date = CURDATE()
    """)
    return {
        "overall_score": round(overall[0]["overall_score"], 2) if overall and overall[0]["overall_score"] else 0,
        "layers": [
            {
                "layer": r["data_layer"],
                "score": r["dq_score"],
                "critical": r["critical_fail_cnt"],
                "high": r["high_fail_cnt"],
            }
            for r in rows
        ],
    }


@router.get("/rules")
def rules(layer: str = None, severity: str = None):
    sql = """
        SELECT rule_name, target_table AS check_table, target_layer AS data_layer,
               severity_level AS severity, check_status AS latest_status,
               check_time AS last_run
        FROM dq.dq_check_result
        WHERE 1=1
    """
    params = []
    if layer:
        sql += " AND target_layer = %s"
        params.append(layer)
    if severity:
        sql += " AND severity_level = %s"
        params.append(severity)
    sql += " ORDER BY check_time DESC"
    return query(sql, tuple(params) if params else None)


@router.get("/issues")
def issues(
    start: str = None,
    end: str = None,
    severity: str = None,
    layer: str = None,
    page: int = 1,
    size: int = 20,
):
    where = ["1=1"]
    params = []
    if start:
        where.append("check_time >= %s")
        params.append(start)
    if end:
        where.append("check_time <= %s")
        params.append(end)
    if severity:
        where.append("severity_level = %s")
        params.append(severity)
    if layer:
        where.append("target_layer = %s")
        params.append(layer)

    where_sql = " AND ".join(where)
    count_row = query(f"SELECT COUNT(*) AS cnt FROM dq.dq_issue_detail WHERE {where_sql}", tuple(params))
    total = count_row[0]["cnt"] if count_row else 0

    offset = (page - 1) * size
    rows = query(
        f"""SELECT check_time, rule_code, target_table AS table_name,
                   severity_level AS severity, issue_desc, target_layer AS data_layer
            FROM dq.dq_issue_detail
            WHERE {where_sql}
            ORDER BY check_time DESC
            LIMIT %s OFFSET %s""",
        tuple(params) + (size, offset),
    )
    return {"total": total, "list": rows}


@router.get("/trend")
def trend(days: int = 30):
    rows = query("""
        SELECT stat_date AS date, AVG(dq_score) AS score
        FROM ads.ads_dq_result_summary
        WHERE stat_date >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
        GROUP BY stat_date
        ORDER BY stat_date
    """, (days,))
    return [{"date": str(r["date"]), "score": float(r["score"])} for r in rows]


@router.get("/issues/export")
def export_issues(
    start: str = None,
    end: str = None,
    severity: str = None,
    layer: str = None,
):
    where = ["1=1"]
    params = []
    if start:
        where.append("check_time >= %s")
        params.append(start)
    if end:
        where.append("check_time <= %s")
        params.append(end)
    if severity:
        where.append("severity_level = %s")
        params.append(severity)
    if layer:
        where.append("target_layer = %s")
        params.append(layer)

    where_sql = " AND ".join(where)
    rows = query(
        f"""SELECT check_time, rule_code, target_table AS table_name,
                   severity_level AS severity, issue_desc, target_layer AS data_layer
            FROM dq.dq_issue_detail
            WHERE {where_sql}
            ORDER BY check_time DESC""",
        tuple(params) if params else None,
    )

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=["check_time", "rule_code", "table_name", "severity", "issue_desc", "data_layer"])
    writer.writeheader()
    writer.writerows(rows)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=dq_issues.csv"},
    )
