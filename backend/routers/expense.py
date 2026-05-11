from fastapi import APIRouter
from db import query

router = APIRouter()


@router.get("/summary")
def summary():
    rows = query("""
        SELECT SUM(expense_total) AS total_expense,
               SUM(patient_cnt) AS total_patient,
               AVG(avg_expense_per_patient) AS avg_expense,
               SUM(drug_expense) / NULLIF(SUM(expense_total), 0) AS drug_ratio
        FROM ads.ads_expense_by_tumor_type
        WHERE stat_date = CURDATE()
    """)
    r = rows[0] if rows else {}
    return {
        "total_expense": float(r.get("total_expense") or 0),
        "total_patient": int(r.get("total_patient") or 0),
        "avg_expense": float(r.get("avg_expense") or 0),
        "drug_ratio": round(float(r.get("drug_ratio") or 0) * 100, 1),
    }


@router.get("/by-tumor-type")
def by_tumor_type():
    rows = query("""
        SELECT tumor_type,
               patient_cnt,
               avg_expense_per_patient AS avg_expense,
               drug_expense, exam_expense, surgery_expense, other_expense,
               drug_expense / NULLIF(expense_total, 0) AS drug_ratio
        FROM ads.ads_expense_by_tumor_type
        WHERE stat_date = CURDATE()
        ORDER BY avg_expense_per_patient DESC
    """)
    return [
        {
            "tumor_type": r["tumor_type"],
            "patient_cnt": r["patient_cnt"] or 0,
            "avg_expense": float(r["avg_expense"] or 0),
            "drug_expense": float(r["drug_expense"] or 0),
            "exam_expense": float(r["exam_expense"] or 0),
            "surgery_expense": float(r["surgery_expense"] or 0),
            "other_expense": float(r["other_expense"] or 0),
            "drug_ratio": round(float(r["drug_ratio"] or 0) * 100, 1),
        }
        for r in rows
    ]
