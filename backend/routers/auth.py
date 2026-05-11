from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from auth import authenticate

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str
    token_type: str = "Bearer"


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    token = authenticate(req.username, req.password)
    if not token:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    return LoginResponse(token=token, username=req.username)
