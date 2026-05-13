import csv
import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException

router = APIRouter()


def _default_governance_root() -> Path:
    return Path(__file__).resolve().parents[3] / "medical-data-governance"


def _lineage_root() -> Path:
    configured = os.getenv("MEDICAL_GOVERNANCE_ROOT")
    return Path(configured).resolve() if configured else _default_governance_root()


def _read_csv(relative_path: str) -> list[dict]:
    path = _lineage_root() / relative_path
    if not path.exists():
        raise HTTPException(status_code=503, detail=f"Lineage artifact not found: {path}")
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


@router.get("/summary")
def summary():
    table_edges = _read_csv("docs/medical-governance/lineage/table_lineage.csv")
    column_edges = _read_csv("docs/medical-governance/lineage/column_lineage.csv")
    tables = _read_csv("docs/medical-governance/lineage/metadata_catalog.csv")
    layers = sorted({row.get("layer", "") for row in tables if row.get("layer")})
    engines = sorted({row.get("engine", "") for row in tables if row.get("engine")})
    subjects = sorted({row.get("business_subject", "") for row in tables if row.get("business_subject")})
    return {
        "table_edge_count": len(table_edges),
        "column_edge_count": len(column_edges),
        "table_count": len(tables),
        "layers": layers,
        "engines": engines,
        "subjects": subjects,
    }


@router.get("/tables")
def tables(layer: Optional[str] = None, engine: Optional[str] = None, subject: Optional[str] = None):
    rows = _read_csv("docs/medical-governance/lineage/metadata_catalog.csv")
    if layer:
        rows = [row for row in rows if row.get("layer", "").lower() == layer.lower()]
    if engine:
        rows = [row for row in rows if row.get("engine", "").lower() == engine.lower()]
    if subject:
        rows = [row for row in rows if row.get("business_subject", "").lower() == subject.lower()]
    return rows


@router.get("/table-edges")
def table_edges(target_table: Optional[str] = None, source_table: Optional[str] = None):
    rows = _read_csv("docs/medical-governance/lineage/table_lineage.csv")
    if target_table:
        rows = [row for row in rows if row.get("target_table", "").lower() == target_table.lower()]
    if source_table:
        rows = [row for row in rows if row.get("source_table", "").lower() == source_table.lower()]
    return rows


@router.get("/column-edges")
def column_edges(target_table: Optional[str] = None, target_column: Optional[str] = None):
    rows = _read_csv("docs/medical-governance/lineage/column_lineage.csv")
    if target_table:
        rows = [row for row in rows if row.get("target_table", "").lower() == target_table.lower()]
    if target_column:
        rows = [row for row in rows if row.get("target_column", "").lower() == target_column.lower()]
    return rows

