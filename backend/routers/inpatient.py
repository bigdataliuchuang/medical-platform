from fastapi import APIRouter
from db import query

router = APIRouter()


@router.get("/quality")
def quality():
    # 全院汇总 KPI（dept_code='HOSPITAL'）
    overview = query("""
        SELECT
            avg_inpatient_days,
            long_stay_rate,
            readmission_30d_rate,
            surgery_cnt,
            complication_rate,
            mortality_rate,
            critical_timely_rate,
            tumor_patient_cnt,
            tumor_avg_inpatient_days
        FROM ads.ads_inpatient_quality_board
        WHERE dept_code = 'HOSPITAL'
        ORDER BY stat_date DESC
        LIMIT 1
    """)
    ov = overview[0] if overview else {}

    # 各科室对比
    depts = query("""
        SELECT dept_name,
               avg_inpatient_days,
               surgery_cnt,
               complication_rate,
               readmission_30d_rate,
               mortality_rate
        FROM ads.ads_inpatient_quality_board
        WHERE dept_code != 'HOSPITAL'
          AND stat_date = CURDATE()
        ORDER BY surgery_cnt DESC
        LIMIT 20
    """)

    # 近30天趋势
    trend = query("""
        SELECT stat_date AS date,
               avg_inpatient_days,
               surgery_cnt,
               complication_rate
        FROM ads.ads_inpatient_quality_board
        WHERE dept_code = 'HOSPITAL'
          AND stat_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ORDER BY stat_date
    """)

    return {
        "overview": {
            "avg_inpatient_days": float(ov.get("avg_inpatient_days") or 0),
            "long_stay_rate": float(ov.get("long_stay_rate") or 0),
            "readmission_30d_rate": float(ov.get("readmission_30d_rate") or 0),
            "surgery_cnt": int(ov.get("surgery_cnt") or 0),
            "complication_rate": float(ov.get("complication_rate") or 0),
            "mortality_rate": float(ov.get("mortality_rate") or 0),
            "critical_timely_rate": float(ov.get("critical_timely_rate") or 0),
            "tumor_patient_cnt": int(ov.get("tumor_patient_cnt") or 0),
            "tumor_avg_inpatient_days": float(ov.get("tumor_avg_inpatient_days") or 0),
        },
        "departments": [
            {
                "dept_name": r["dept_name"],
                "avg_inpatient_days": float(r["avg_inpatient_days"] or 0),
                "surgery_cnt": int(r["surgery_cnt"] or 0),
                "complication_rate": float(r["complication_rate"] or 0),
                "readmission_30d_rate": float(r["readmission_30d_rate"] or 0),
                "mortality_rate": float(r["mortality_rate"] or 0),
            }
            for r in depts
        ],
        "trend": [
            {
                "date": str(r["date"]),
                "avg_inpatient_days": float(r["avg_inpatient_days"] or 0),
                "surgery_cnt": int(r["surgery_cnt"] or 0),
                "complication_rate": float(r["complication_rate"] or 0),
            }
            for r in trend
        ],
    }
