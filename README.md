# 医疗数据治理平台

抗肿瘤药物临床应用监测系统的可视化管理平台。

本仓库负责三仓体系中的**平台层**：提供 React 管理端、FastAPI 后端接口、登录认证、数据质量/患者主数据/药物监测/费用分析/住院质量看板，并通过右下角浮窗集成 `medical-ai-agent`。

## 三仓定位

| 仓库 | 定位 | 主要职责 |
|------|------|----------|
| `medical-data-governance` | 数仓治理层 | 建设 ODS -> ADS、DQ 规则、MPI/MDM、Doris 服务层和看板数据资产 |
| `medical-ai-agent` | AI 问数服务层 | 提供自然语言问数、Text-to-SQL、安全执行、审计和指标开发辅助 |
| `medical-platform` | 可视化平台层 | 提供前端页面、后端 API、认证、治理看板和 AI 助手入口 |

推荐目录结构：

```text
github/
├── medical-data-governance/
├── medical-ai-agent/
└── medical-platform/
```

`docker-compose.yml` 默认按这个同级目录结构构建 `../medical-ai-agent`。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19 + TypeScript + Vite + Ant Design + ECharts |
| 后端 | Python FastAPI + PyMySQL + JWT |
| AI Agent | `medical-ai-agent` FastAPI 兼容入口 |
| 数据库 | Apache Doris，MySQL 协议端口 `9030` |
| 部署 | Docker Compose |

## 功能模块

| 模块 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 整体 KPI、30 天质量趋势、管道状态、告警 |
| 数据质量 | `/dq` | DQ 评分仪表盘、规则列表、问题明细、CSV 导出 |
| 患者主数据 | `/mpi` | MPI 统计、重复患者人工审核、来源系统分布 |
| 药物监测 | `/drug` | 用药趋势、异常告警、月度报告 |
| 费用分析 | `/expense` | 按肿瘤类型费用分布 |
| 住院质量 | `/inpatient` | 科室住院质量看板 |
| AI 指标开发 | `/dev-assistant` | 生成指标方案、DWS/ADS 设计、SQL 草稿、DQ 规则和血缘说明 |
| AI 助手 | 右下角浮动按钮 | 调用 `medical-ai-agent`，支持多轮对话、SQL 展示和数据解释 |

## 快速启动

### 前置条件

- Docker 和 Docker Compose
- Apache Doris 已运行，或使用 `medical-data-governance` 中的 Docker / Demo 环境准备数据
- 同级目录存在 `medical-ai-agent`
- AI 助手需要可用的 LLM / Embedding 配置

### 1. 配置后端环境变量

```bash
cp backend/.env.example backend/.env
```

关键配置：

```env
DORIS_HOST=192.168.241.128
DORIS_PORT=9030
DORIS_USER=root
DORIS_PASSWORD=your_password
DORIS_DATABASE=ads

JWT_SECRET=your-random-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=        # 留空则默认密码为 admin123
```

### 2. 配置 AI Agent

```bash
cp ../medical-ai-agent/.env.example ../medical-ai-agent/.env
```

关键配置：

```env
DORIS_HOST=192.168.241.128
DORIS_PORT=9030
DORIS_USER=root
DORIS_PASSWORD=your_password
DORIS_DATABASE=ads

LLM_API_KEY=sk-xxxx
EMBEDDING_API_KEY=sk-xxxx
```

如果只验证平台页面，可先不初始化向量索引；AI 助手会按 Agent 配置降级或返回明确错误。

### 3. 启动平台

```bash
docker compose up --build
```

| 服务 | 地址 |
|------|------|
| 前端 | `http://localhost:3000` |
| 后端 API 文档 | `http://localhost:8000/docs` |
| AI Agent API 文档 | `http://localhost:8001/docs` |

默认账号：

```text
admin / admin123
```

### 4. 初始化 AI 向量索引

首次启动后可执行：

```bash
curl -X POST http://localhost:8001/api/index/rebuild
```

## 开发模式

### 后端

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

Vite 默认地址通常为 `http://localhost:5173`。

### AI Agent

```bash
cd ../medical-ai-agent
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

## 项目结构

```text
medical-platform/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── auth.py              # JWT 签发和校验
│   ├── db.py                # Doris PyMySQL 连接
│   ├── routers/
│   │   ├── auth.py          # POST /api/auth/login
│   │   ├── dashboard.py     # GET /api/dashboard/*
│   │   ├── dq.py            # GET /api/dq/*
│   │   ├── mpi.py           # GET/PATCH /api/mpi/*
│   │   ├── drug.py
│   │   ├── expense.py
│   │   └── inpatient.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios 和 AI Agent 客户端
│   │   ├── components/      # AI 对话浮窗等组件
│   │   └── pages/           # 各业务模块页面
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml       # backend + ai-agent + frontend
└── docker-compose.ci.yml
```

## 与数仓层的关系

平台后端默认查询 Doris 中的 ADS / DQ / MPI 相关表。数据资产由 `medical-data-governance` 提供，典型表包括：

- `ads_tumor_report_monthly`
- `ads_dq_result_summary`
- `ads_patient_mpi_summary`
- `ads_drug_usage_trend`
- `ads_expense_by_tumor_type`
- `ads_inpatient_quality_board`

如果页面没有数据，优先检查：

1. `backend/.env` 中 Doris 地址、账号和数据库是否正确。
2. `medical-data-governance` 的 Doris ADS SQL 是否已执行。
3. Doris 表名和平台后端 SQL 是否一致。

## 与 AI Agent 的关系

前端 AI 助手调用后端配置的 Agent 地址，Docker Compose 中的 Agent 服务来自同级 `../medical-ai-agent`：

```yaml
ai-agent:
  build:
    context: ../medical-ai-agent
    dockerfile: Dockerfile.simple
  ports:
    - "8001:8000"
```

平台主要使用兼容 API：

- `POST /api/chat`
- `GET /api/chat/history`
- `GET /api/chat/suggestions`
- `POST /api/index/rebuild`
- `POST /api/dev/metric-plan`
- `POST /api/dev/metric-assets`

Agent 的元数据、Text-to-SQL、安全校验和执行逻辑由 `medical-ai-agent` 仓库维护。

## 常用命令

```bash
# 前端构建
cd frontend && npm run build

# 前端 lint
cd frontend && npm run lint

# 后端启动
cd backend && uvicorn main:app --reload --port 8000

# Docker 启动
docker compose up --build

# Docker 停止
docker compose down
```

## 相关仓库

| 仓库 | 说明 |
|------|------|
| `medical-data-governance` | 数仓层：ODS -> ADS SQL、DQ 规则、MPI/MDM、调度和看板资产 |
| `medical-ai-agent` | AI 数据助手：GraphRAG、Text-to-SQL、SQL Guard、Doris / DuckDB 查询执行 |
