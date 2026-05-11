from fastapi import APIRouter

router = APIRouter()


@router.get("/summary")
def summary():
    return {}


@router.get("/by-tumor-type")
def by_tumor_type():
    return []
