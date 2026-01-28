import mysql from "mysql2/promise";

let _pool: mysql.Pool | null = null;

function getPool() {
  if (_pool) return _pool;

  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  const port = Number(process.env.MYSQL_PORT ?? 3306);

  if (!host || !user || !database) {
    throw new Error("Missing MySQL env vars");
  }

  _pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    connectionLimit: 5,
    waitForConnections: true,

    // JSON安全化（前に話したやつ）
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: true,
  });

  return _pool;
}

export async function dbQuery<T = any>(sql: string, params: any[] = []) {
  const pool = getPool();
  const [rows] = await pool.query(sql, params);
  return rows as T;
}

export async function dbExec(sql: string, params: any[] = []) {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  return result;
}
