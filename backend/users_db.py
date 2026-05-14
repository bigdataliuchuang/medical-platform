"""SQLite-backed user store with RBAC roles."""
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional

import bcrypt as _bcrypt


def _hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())

_DB_PATH = Path(os.getenv("USERS_DB_PATH", Path(__file__).parent / "data" / "users.db"))

ROLES = ["admin", "analyst", "clinician", "auditor"]

ROLE_LABELS = {
    "admin":     "超级管理员",
    "analyst":   "数据分析师",
    "clinician": "临床工作者",
    "auditor":   "审计员",
}

# modules each role can access
ROLE_PERMISSIONS: dict[str, list[str]] = {
    "admin":     ["/", "/dq", "/mpi", "/drug", "/expense", "/inpatient",
                  "/dev-assistant", "/semantic-layer", "/lineage", "/admin"],
    "analyst":   ["/", "/dq", "/mpi", "/drug", "/expense", "/inpatient",
                  "/semantic-layer", "/lineage"],
    "clinician": ["/", "/drug", "/expense", "/inpatient"],
    "auditor":   ["/", "/dq", "/lineage"],
}


def _conn() -> sqlite3.Connection:
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(_DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                username     TEXT    UNIQUE NOT NULL,
                password_hash TEXT   NOT NULL,
                role         TEXT    NOT NULL DEFAULT 'analyst',
                is_active    INTEGER NOT NULL DEFAULT 1,
                created_at   TEXT    NOT NULL
            )
        """)
        # ensure at least one admin exists
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        existing = conn.execute(
            "SELECT id FROM users WHERE username = ?", (admin_username,)
        ).fetchone()
        if not existing:
            admin_hash = os.getenv("ADMIN_PASSWORD_HASH") or _hash_password("admin123")
            conn.execute(
                "INSERT INTO users (username, password_hash, role, created_at) VALUES (?,?,?,?)",
                (admin_username, admin_hash, "admin", datetime.utcnow().isoformat()),
            )
        conn.commit()


def get_user(username: str) -> Optional[dict]:
    with _conn() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE username = ? AND is_active = 1", (username,)
        ).fetchone()
        return dict(row) if row else None


def verify_password(plain: str, hashed: str) -> bool:
    return _verify_password(plain, hashed)


def list_users() -> list[dict]:
    with _conn() as conn:
        rows = conn.execute(
            "SELECT id, username, role, is_active, created_at FROM users ORDER BY id"
        ).fetchall()
        return [dict(r) for r in rows]


def create_user(username: str, password: str, role: str) -> dict:
    if role not in ROLES:
        raise ValueError(f"Invalid role: {role}")
    hashed = _hash_password(password)
    with _conn() as conn:
        conn.execute(
            "INSERT INTO users (username, password_hash, role, created_at) VALUES (?,?,?,?)",
            (username, hashed, role, datetime.utcnow().isoformat()),
        )
        conn.commit()
        row = conn.execute("SELECT id, username, role, is_active, created_at FROM users WHERE username = ?", (username,)).fetchone()
        return dict(row)


def update_user(user_id: int, role: Optional[str] = None,
                password: Optional[str] = None, is_active: Optional[bool] = None) -> dict:
    with _conn() as conn:
        if role is not None:
            if role not in ROLES:
                raise ValueError(f"Invalid role: {role}")
            conn.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))
        if password is not None:
            conn.execute("UPDATE users SET password_hash = ? WHERE id = ?",
                         (_hash_password(password), user_id))
        if is_active is not None:
            conn.execute("UPDATE users SET is_active = ? WHERE id = ?",
                         (1 if is_active else 0, user_id))
        conn.commit()
        row = conn.execute(
            "SELECT id, username, role, is_active, created_at FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        return dict(row) if row else {}


def delete_user(user_id: int) -> None:
    with _conn() as conn:
        # never delete last admin
        admins = conn.execute(
            "SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = 1"
        ).fetchone()[0]
        target = conn.execute("SELECT role FROM users WHERE id = ?", (user_id,)).fetchone()
        if target and target[0] == "admin" and admins <= 1:
            raise ValueError("不能删除最后一个管理员账号")
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
