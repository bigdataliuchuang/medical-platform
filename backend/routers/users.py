from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from auth import get_current_user, require_role
import users_db

router = APIRouter()


class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: str


class UpdateUserRequest(BaseModel):
    role: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/")
def list_users(current_user: dict = Depends(require_role("admin"))):
    return users_db.list_users()


@router.post("/")
def create_user(req: CreateUserRequest, current_user: dict = Depends(require_role("admin"))):
    try:
        return users_db.create_user(req.username, req.password, req.role)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{user_id}")
def update_user(user_id: int, req: UpdateUserRequest,
                current_user: dict = Depends(require_role("admin"))):
    try:
        return users_db.update_user(user_id, req.role, req.password, req.is_active)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{user_id}")
def delete_user(user_id: int, current_user: dict = Depends(require_role("admin"))):
    try:
        users_db.delete_user(user_id)
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/roles")
def list_roles(_: dict = Depends(get_current_user)):
    return [
        {"value": k, "label": v, "permissions": users_db.ROLE_PERMISSIONS[k]}
        for k, v in users_db.ROLE_LABELS.items()
    ]
