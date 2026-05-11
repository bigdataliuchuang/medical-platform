from fastapi import APIRouter
from db import query

router = APIRouter()


@router.get("/summary")
def summary():
    rows = query("""
        SELECT source_patient_cnt, mpi_patient_cnt,
               exact_match_cnt, fuzzy_match_cnt, unmatched_cnt
        FROM ads.ads_patient_mpi_summary
        ORDER BY stat_date DESC
        LIMIT 1
    """)
    if not rows:
        return {
            "source_count": 0, "mpi_count": 0, "dedup_rate": 0,
            "exact_match": 0, "fuzzy_match": 0, "unmatched": 0,
        }
    r = rows[0]
    source = r["source_patient_cnt"] or 0
    mpi = r["mpi_patient_cnt"] or 0
    dedup_rate = round((1 - mpi / source) * 100, 1) if source > 0 else 0
    return {
        "source_count": source,
        "mpi_count": mpi,
        "dedup_rate": dedup_rate,
        "exact_match": r["exact_match_cnt"] or 0,
        "fuzzy_match": r["fuzzy_match_cnt"] or 0,
        "unmatched": r["unmatched_cnt"] or 0,
    }


@router.get("/duplicates")
def duplicates(page: int = 1, size: int = 20):
    count = query("SELECT COUNT(*) AS cnt FROM mpi.mpi_merge_log WHERE merge_status = 'pending'")
    total = count[0]["cnt"] if count else 0
    offset = (page - 1) * size
    rows = query("""
        SELECT log_id, source_patient_id_a, source_system_a,
               source_patient_id_b, source_system_b,
               match_score, match_basis, created_at
        FROM mpi.mpi_merge_log
        WHERE merge_status = 'pending'
        ORDER BY match_score DESC
        LIMIT %s OFFSET %s
    """, (size, offset))

    result = []
    for r in rows:
        def get_patient(pid, sys):
            p = query("""
                SELECT patient_name, id_card, birth_date, phone
                FROM mdm.mdm_patient_master
                WHERE source_patient_id = %s AND source_system = %s
                LIMIT 1
            """, (pid, sys))
            if p:
                return {
                    "name": p[0].get("patient_name", ""),
                    "id_card": p[0].get("id_card", ""),
                    "birth_date": str(p[0].get("birth_date", "")),
                    "phone": p[0].get("phone", ""),
                    "source_system": sys,
                }
            return {"name": "", "id_card": "", "birth_date": "", "phone": "", "source_system": sys}

        result.append({
            "log_id": r["log_id"],
            "patient_a": get_patient(r["source_patient_id_a"], r["source_system_a"]),
            "patient_b": get_patient(r["source_patient_id_b"], r["source_system_b"]),
            "match_score": float(r["match_score"]) if r["match_score"] else 0,
            "match_basis": r["match_basis"] or "",
            "created_at": str(r["created_at"]),
        })
    return {"total": total, "list": result}


@router.patch("/duplicates/{log_id}")
def update_duplicate(log_id: str, action: str = "merge"):
    status = "merged" if action == "merge" else "rejected"
    query(
        "UPDATE mpi.mpi_merge_log SET merge_status = %s WHERE log_id = %s",
        (status, log_id),
    )
    return {"success": True}


@router.get("/sources/distribution")
def sources_distribution():
    rows = query("""
        SELECT source_system, COUNT(*) AS cnt
        FROM mpi.mpi_cross_reference
        GROUP BY source_system
        ORDER BY cnt DESC
    """)
    return rows or []


@router.get("/sources")
def sources(source_system: str = None, page: int = 1, size: int = 20):
    where = "1=1"
    params: list = []
    if source_system:
        where += " AND source_system = %s"
        params.append(source_system)
    count = query(f"SELECT COUNT(*) AS cnt FROM mpi.mpi_cross_reference WHERE {where}", tuple(params) if params else None)
    total = count[0]["cnt"] if count else 0
    offset = (page - 1) * size
    rows = query(
        f"""SELECT source_system, source_patient_id, mpi_id, created_at
            FROM mpi.mpi_cross_reference
            WHERE {where}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s""",
        tuple(params) + (size, offset),
    )
    return {"total": total, "list": rows}
