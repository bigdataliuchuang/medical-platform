import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = os.getenv("JWT_SECRET", "medical-platform-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))

bearer_scheme = HTTPBearer()


def create_token(username: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": username, "role": role, "exp": expire},
        SECRET_KEY, algorithm=ALGORITHM,
    )


def _decode_token(credentials: HTTPAuthorizationCredentials) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token 无效")
        return {"username": username, "role": payload.get("role", "analyst")}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token 已过期或无效")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    return _decode_token(credentials)


def require_role(required_role: str):
    """Dependency factory: only allows users with the specified role."""
    def _check(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
        user = _decode_token(credentials)
        if user["role"] != required_role and user["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"此操作需要 {required_role} 或 admin 权限",
            )
        return user
    return _check
