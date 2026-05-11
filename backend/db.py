import os
from typing import List, Optional

import pymysql
from dotenv import load_dotenv

load_dotenv()


def get_connection() -> pymysql.Connection:
    host = os.getenv("DORIS_HOST", "192.168.241.128")
    port = int(os.getenv("DORIS_PORT", "9030"))
    user = os.getenv("DORIS_USER", "root")
    password = os.getenv("DORIS_PASSWORD", "")
    database = os.getenv("DORIS_DATABASE", "ads")

    try:
        return pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
        )
    except pymysql.Error as e:
        raise ConnectionError(f"Doris connection failed: {e}") from e


def query(sql: str, params: Optional[tuple] = None) -> List[dict]:
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(sql, params)
            return cursor.fetchall()
    finally:
        conn.close()
