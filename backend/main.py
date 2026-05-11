from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from routers import dashboard, dq, mpi, drug, expense, inpatient, auth
from auth import get_current_user

app = FastAPI(title="医疗数据治理平台 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 公开路由（不加 JWT 保护）
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

# 受保护路由（需要有效 JWT token）
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"],
                   dependencies=[Depends(get_current_user)])
app.include_router(dq.router, prefix="/api/dq", tags=["dq"],
                   dependencies=[Depends(get_current_user)])
app.include_router(mpi.router, prefix="/api/mpi", tags=["mpi"],
                   dependencies=[Depends(get_current_user)])
app.include_router(drug.router, prefix="/api/drug", tags=["drug"],
                   dependencies=[Depends(get_current_user)])
app.include_router(expense.router, prefix="/api/expense", tags=["expense"],
                   dependencies=[Depends(get_current_user)])
app.include_router(inpatient.router, prefix="/api/inpatient", tags=["inpatient"],
                   dependencies=[Depends(get_current_user)])


@app.get("/api/health")
def health():
    return {"status": "ok", "doris": "connected"}
