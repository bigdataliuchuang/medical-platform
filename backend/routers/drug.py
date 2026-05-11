import csv
import io

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from db import query

router = APIRouter()


@router.get("/trend")
def trend(months: int = 6):
    rows = query("""
        SELECT stat_month, drug_category,
               SUM(patient_cnt) AS patient_cnt,
               SUM(order_cnt) AS order_cnt,
               SUM(drug_expense_total) AS expense
        FROM ads.ads_drug_usage_trend
        WHERE stat_month >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL %s MONTH), '%%Y-%%m')
        GROUP BY stat_month, drug_category
        ORDER BY stat_month, drug_category
    """, (months,))

    months_set: list[str] = []
    categories: dict[str, list[float]] = {}
    for r in rows:
        m = str(r["stat_month"])
        cat = r["drug_category"] or "其他"
        if m not in months_set:
            months_set.append(m)
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(float(r["patient_cnt"] or 0))

    series = [{"drug_category": cat, "data": data} for cat, data in categories.items()]
    return {"months": months_set, "series": series}


@router.get("/alerts")
def alerts():
    rows = query("""
        SELECT check_time AS detect_time, rule_code AS rule_name,
               target_table AS table_name, severity_level AS severity,
               COUNT(*) AS issue_cnt
        FROM dq.dq_issue_detail
        WHERE (target_table LIKE '%%order%%' OR target_table LIKE '%%prescription%%')
          AND severity_level IN ('CRITICAL', 'HIGH')
          AND check_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY check_time, rule_code, target_table, severity_level
        ORDER BY check_time DESC
        LIMIT 50
    """)
    return rows


@router.get("/report")
def report(month: str = None):
    if not month:
        month_rows = query("SELECT MAX(report_month) AS m FROM ads.ads_tumor_report_monthly")
        month = str(month_rows[0]["m"]) if month_rows and month_rows[0]["m"] else ""

    rows = query("""
        SELECT report_month, chemo_regimen, tumor_type,
               patient_cnt, treatment_course_cnt, drug_name,
               total_dose_mg, drug_expense_total,
               completion_rate, adr_rate, severe_adr_cnt
        FROM ads.ads_tumor_report_monthly
        WHERE report_month = %s
        ORDER BY patient_cnt DESC
    """, (month,))
    return {"month": month, "list": rows}


@router.get("/report/export")
def export_report(month: str = None):
    if not month:
        month_rows = query("SELECT MAX(report_month) AS m FROM ads.ads_tumor_report_monthly")
        month = str(month_rows[0]["m"]) if month_rows and month_rows[0]["m"] else ""

    rows = query("""
        SELECT report_month, chemo_regimen, tumor_type,
               patient_cnt, treatment_course_cnt, drug_name,
               total_dose_mg, drug_expense_total,
               completion_rate, adr_rate, severe_adr_cnt
        FROM ads.ads_tumor_report_monthly
        WHERE report_month = %s
        ORDER BY patient_cnt DESC
    """, (month,))

    buf = io.StringIO()
    fields = ["report_month", "chemo_regimen", "tumor_type", "patient_cnt",
              "treatment_course_cnt", "drug_name", "total_dose_mg",
              "drug_expense_total", "completion_rate", "adr_rate", "severe_adr_cnt"]
    writer = csv.DictWriter(buf, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=drug_report_{month}.csv"},
    )
