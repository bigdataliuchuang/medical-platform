from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import users_db
from auth import create_token

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str
    role: str
    permissions: list[str]
    token_type: str = "Bearer"


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    user = users_db.get_user(req.username)
    if not user or not users_db.verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    role = user["role"]
    token = create_token(req.username, role)
    return LoginResponse(
        token=token,
        username=req.username,
        role=role,
        permissions=users_db.ROLE_PERMISSIONS.get(role, ["/"]),
    )
