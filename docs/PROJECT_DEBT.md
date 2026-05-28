# Project Debt Inventory — medical-platform

> 生成日期：2026-05-28
> 数据来源：本地静态扫描 + GitHub CI 现状审计
> 目的：为 production-grade roadmap 提供事实基线

---

## 1. 健康度概览

| 维度 | 状态 | 关键数据 |
|---|---|---|
| 后端构建 | ✅ | `pip install -r requirements.txt` 无报错 |
| 前端构建 | ✅ | `npm run build` 通过（CI 验证） |
| TypeScript 类型检查 | ✅ | `npx tsc --noEmit` 通过（CI 验证） |
| 后端测试 | ❌ **0 个** | 无 `tests/` 目录，无任何 `test_*.py` |
| 前端测试 | ❌ **0 个** | 无 `*.test.ts(x)`，无 jest/vitest 配置 |
| 硬编码生产 IP | ⚠️ 1 处 | `backend/db.py:11` 默认值 `192.168.241.128`（env var 优先） |
| 明文密码 | ✅ 0 处 | `.env.example` 中 `DORIS_PASSWORD=` 为空 |
| CI lint 真实性 | ❌ **实质未执行** | flake8 `continue-on-error: true`，mypy `\|\| true`，ESLint `continue-on-error: true` |
| CI 密钥扫描 | ❌ 缺失 | 无 gitleaks/detect-secrets |
| CI IP guard | ❌ 缺失 | 无硬编码 IP 拦截 |
| CI pytest | ❌ 缺失 | 无后端测试可跑 |
| actions 版本 | ⚠️ | `checkout@v4`, `setup-python@v4`, `setup-node@v3`（Node 20 deprecation） |
| Docker 安全 | ⚠️ | Dockerfile 以 root 运行，无 HEALTHCHECK |
| 后端依赖 | ⚠️ | `passlib[bcrypt]==1.7.4` + `bcrypt==4.0.1`（已修兼容但版本旧） |
| 文档准确性 | ✅ | README 声称 11 页面 / 9 Router，实际相符 |

---

## 2. P0 高风险

### P0-1 硬编码生产 IP（1 处）

| 文件 | 行 | 问题 |
|---|---|---|
| `backend/db.py` | 11 | `host = os.getenv("DORIS_HOST", "192.168.241.128")` — 默认值是生产 IP |

修复：改为 `os.getenv("DORIS_HOST", "localhost")`。`.env.example` 中的 IP 可保留（是示例）。

### P0-2 CI lint 全部 continue-on-error（实质未执行）

| 步骤 | 问题 |
|---|---|
| flake8 | `continue-on-error: true`，第二个 flake8 调用加了 `--exit-zero` |
| mypy | `\|\| true` |
| ESLint | `continue-on-error: true` + `\|\| echo "ESLint check completed with warnings"` |

影响：PR 合入不会被 lint 拦截，代码质量无门禁。

---

## 3. P1 中风险

### P1-1 无后端测试

14 个 Python 文件、9 个 router，**0 个测试文件**。`backend/tests/` 目录不存在。

### P1-2 无前端测试

11 个页面、React 19 + TypeScript，**0 个 `*.test.ts(x)` 文件**。无 jest/vitest 配置。

### P1-3 CI 无 pytest 步骤

即使未来补测试，当前 CI 也没有 `pytest` step。

### P1-4 CI 无 gitleaks / secret 扫描

无密钥泄露防护。

### P1-5 CI 无硬编码 IP guard

无 `grep -rn '192\.168\.' backend/` 拦截步骤。

### P1-6 actions 版本过旧

| 当前 | 应升级到 |
|---|---|
| `actions/checkout@v4` | `@v5` |
| `actions/setup-python@v4` | `@v5` |
| `actions/setup-node@v3` | `@v4` |

Node 20 deprecation deadline: 2026-06-02。

### P1-7 Dockerfile 以 root 运行

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
CMD ["uvicorn", ...]
```

缺少 `USER nonroot`、`HEALTHCHECK`、`.dockerignore`。

---

## 4. P2 低风险

### P2-1 后端依赖版本旧

| 包 | 当前版本 | 备注 |
|---|---|---|
| `fastapi` | 0.111.0 | 当前最新 0.115+ |
| `passlib[bcrypt]` | 1.7.4 | 已修 bcrypt 5.x 兼容，但 passlib 本身长期未更新 |
| `python-jose` | 3.3.0 | 应检查 CVE |
| `bcrypt` | 4.0.1 | 当前最新 4.2+ |

### P2-2 无 `.dockerignore`

`COPY . .` 会把 `.git`、`__pycache__`、`.env` 等复制进镜像。

### P2-3 `docker-compose.yml` 引用相对路径 `../medical-ai-agent`

本地开发可用，CI 中需要特殊 checkout（已通过 `docker-compose.ci.yml` 解决）。

---

## 5. 优先级排序

| 序号 | 项 | 类型 | 估时 | 价值 |
|---|---|---|---|---|
| 1 | P0-1：`db.py` 默认 IP 改 localhost | 改代码 | 2 分钟 | 防止连错环境 |
| 2 | P0-2：CI lint 去掉 continue-on-error | 改 CI | 30 分钟 | lint 真生效 |
| 3 | P1-6：actions 升级 | 改 CI | 10 分钟 | 6 月 deadline |
| 4 | P1-5：CI 加 IP guard | 改 CI | 10 分钟 | 防止 P0-1 回归 |
| 5 | P1-4：CI 加 gitleaks | 改 CI | 20 分钟 | 防止密钥泄露 |
| 6 | P1-3：CI 加 pytest 步骤 | 改 CI | 5 分钟 | 为补测试做准备 |
| 7 | P1-7：Dockerfile 加 non-root + HEALTHCHECK | 改 Docker | 15 分钟 | 安全基线 |
| 8 | P2-2：加 .dockerignore | 新文件 | 5 分钟 | 镜像瘦身 |
| 9 | P2-1：依赖版本升级 | 改 requirements.txt | 30 分钟 | CVE 修复 |
| 10 | P1-1：补后端测试 | 新代码 | 2-4 小时 | 质量基线 |
| 11 | P1-2：补前端测试 | 新代码 | 4-8 小时 | 质量基线 |
