# 医疗数据治理平台

抗肿瘤药物临床应用监测系统的可视化管理平台，提供数据质量、患者主数据、药物监测、费用分析、住院质量等模块，并集成 AI 数据助手。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + TypeScript + Ant Design 5 + ECharts |
| 后端 | Python FastAPI + PyMySQL |
| AI Agent | FastAPI + Claude (Anthropic) + Milvus + SQLGlot |
| 数据库 | Apache Doris（MySQL 协议，端口 9030） |
| 部署 | Docker Compose |

## 快速启动

### 前置条件

- Docker & Docker Compose
- Apache Doris 已运行（默认 `192.168.241.128:9030`）
- Anthropic API Key（AI 助手功能需要）

### 1. 配置环境变量

```bash
# 后端
cp backend/.env.example backend/.env

# AI Agent
cp ../medical-ai-agent/.env.example ../medical-ai-agent/.env
```

`backend/.env` 关键配置：

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

`../medical-ai-agent/.env` 关键配置：

```env
ANTHROPIC_API_KEY=sk-ant-xxxx
LLM_MODEL=claude-haiku-4-5-20251001
DORIS_HOST=192.168.241.128
DORIS_PORT=9030
DORIS_USER=root
DORIS_PASSWORD=your_password
```

### 2. 启动所有服务

```bash
docker compose up --build
```

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:3000 |
| 后端 API | http://localhost:8000/docs |
| AI Agent | http://localhost:8001/docs |

### 3. 登录

默认账号：`admin` / `admin123`

### 4. 初始化 AI 向量索引（首次启动后执行一次）

```bash
curl -X POST http://localhost:8001/api/index/rebuild
```

未初始化时 AI 助手自动降级为内置 Schema，功能正常可用。

---

## 开发模式（不用 Docker）

```bash
# 后端（端口 8000）
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 前端（端口 5173）
cd frontend && npm install && npm run dev

# AI Agent（端口 8001）
cd ../medical-ai-agent && pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

---

## 功能模块

| 模块 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 整体 KPI、30天质量趋势、管道状态、告警 |
| 数据质量 | `/dq` | DQ 评分仪表盘、规则列表、问题明细、CSV 导出 |
| 患者主数据 | `/mpi` | MPI 统计、重复患者人工审核（合并/驳回）、来源系统分布 |
| 药物监测 | `/drug` | 用药趋势、异常告警（严重级别筛选）、月度报告 |
| 费用分析 | `/expense` | 按肿瘤类型费用分布 |
| 住院质量 | `/inpatient` | 科室住院质量看板 |
| AI 助手 | 右下角浮动按钮 | 自然语言查询数据，支持多轮对话、意图识别、SQL 展示 |

---

## 项目结构

```
medical-platform/
├── backend/
│   ├── main.py              # FastAPI 入口，JWT 路由保护
│   ├── auth.py              # JWT 签发 + 校验（python-jose + bcrypt）
│   ├── db.py                # Doris PyMySQL 连接
│   ├── routers/
│   │   ├── auth.py          # POST /api/auth/login
│   │   ├── dashboard.py     # GET /api/dashboard/overview|pipeline-status|alerts
│   │   ├── dq.py            # GET /api/dq/summary|rules|issues|trend|issues/export
│   │   ├── mpi.py           # GET/PATCH /api/mpi/summary|duplicates|sources
│   │   ├── drug.py
│   │   ├── expense.py
│   │   └── inpatient.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── request.ts   # Axios 封装（自动注入 JWT，401 跳登录）
│   │   │   └── chat.ts      # AI Agent 客户端
│   │   ├── components/
│   │   │   └── AiChat/      # AI 对话浮动按钮 + Drawer
│   │   └── pages/           # 各模块页面
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml       # backend + ai-agent + frontend 三服务编排
```

---

## 相关仓库

| 仓库 | 说明 |
|------|------|
| [medical-data-governance](https://github.com/bigdataliuchuang/medical-data-governance) | 数仓层：ODS→ADS SQL、DQ 25条规则、MPI/MDM 设计 |
| [medical-ai-agent](https://github.com/bigdataliuchuang/medical-ai-agent) | AI 数据助手：Text-to-SQL + 意图分类 + SQL 安全网关 |
