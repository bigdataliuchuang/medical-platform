from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import dashboard, dq, mpi, drug, expense, inpatient

app = FastAPI(title="医疗数据治理平台 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(dq.router, prefix="/api/dq", tags=["dq"])
app.include_router(mpi.router, prefix="/api/mpi", tags=["mpi"])
app.include_router(drug.router, prefix="/api/drug", tags=["drug"])
app.include_router(expense.router, prefix="/api/expense", tags=["expense"])
app.include_router(inpatient.router, prefix="/api/inpatient", tags=["inpatient"])


@app.get("/api/health")
def health():
    return {"status": "ok", "doris": "connected"}
