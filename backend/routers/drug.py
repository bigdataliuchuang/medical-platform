from fastapi import APIRouter

router = APIRouter()


@router.get("/trend")
def trend(months: int = 6):
    return {}


@router.get("/alerts")
def alerts():
    return []


@router.get("/report")
def report(month: str = None):
    return {}
