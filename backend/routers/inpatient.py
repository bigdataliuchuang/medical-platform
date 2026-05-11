from fastapi import APIRouter

router = APIRouter()


@router.get("/quality")
def quality():
    return {}
