import * as SQLite from "expo-sqlite";

// ─── Types ───────────────────────────────────────────────────────────────────

export type LocalTransaction = {
  local_id?: number;
  remote_id?: number | null;
  user_id: string | null; // null = guest
  title: string;
  amount: number;
  image: string;
  description: string;
  created_at: string;
  synced: number; // 0 = pending, 1 = synced
  is_guest: number; // 0 = logged-in user, 1 = guest
};

export type LocalShortcut = {
  local_id?: number;
  remote_id?: number | null;
  user_id: string | null;
  title: string;
  amount: number;
  image: string;
  description: string;
  created_at: string;
  synced: number;
  is_guest: number;
  require_photo: number;
};

// ─── DB Singleton ─────────────────────────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync("expence.db");
  }
  return _db;
}

// ─── Initialise Schema ────────────────────────────────────────────────────────

export async function initDb(): Promise<void> {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS transactions (
      local_id    INTEGER PRIMARY KEY AUTOINCREMENT,
      remote_id   INTEGER,
      user_id     TEXT,
      title       TEXT NOT NULL,
      amount      REAL NOT NULL,
      image       TEXT,
      description TEXT,
      created_at  TEXT NOT NULL,
      synced      INTEGER NOT NULL DEFAULT 0,
      is_guest    INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS shortcuts (
      local_id    INTEGER PRIMARY KEY AUTOINCREMENT,
      remote_id   INTEGER,
      user_id     TEXT,
      title       TEXT NOT NULL,
      amount      REAL NOT NULL,
      image       TEXT,
      description TEXT,
      created_at  TEXT NOT NULL,
      synced      INTEGER NOT NULL DEFAULT 0,
      is_guest    INTEGER NOT NULL DEFAULT 0,
      require_photo INTEGER NOT NULL DEFAULT 0
    );
  `);

  const existingColumns = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(shortcuts)`,
  );
  const hasRequirePhoto = existingColumns.some(
    (col) => col.name === "require_photo",
  );
  if (!hasRequirePhoto) {
    await db.execAsync(
      `ALTER TABLE shortcuts ADD COLUMN require_photo INTEGER NOT NULL DEFAULT 0;`,
    );
  }
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function insertTransaction(
  item: Omit<LocalTransaction, "local_id">,
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO transactions (remote_id, user_id, title, amount, image, description, created_at, synced, is_guest)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.remote_id ?? null,
      item.user_id,
      item.title,
      item.amount,
      item.image,
      item.description,
      item.created_at,
      item.synced,
      item.is_guest,
    ].map((p) => p ?? null),
  );
  return result.lastInsertRowId;
}

export async function getTransactions(
  userId: string | null,
  isGuest: boolean,
  filterType: string = "TODAY",
  ascending: boolean = false,
): Promise<LocalTransaction[]> {
  const db = await getDb();

  let whereClause = isGuest
    ? `WHERE is_guest = 1`
    : `WHERE user_id = ? AND is_guest = 0`;

  const params: any[] = isGuest ? [] : [userId];

  if (filterType.trim() !== "ALL TIME") {
    const { startDate, endDate } = getDateRange(filterType);
    whereClause += ` AND created_at >= ? AND created_at <= ?`;
    params.push(startDate.toISOString(), endDate.toISOString());
  }

  const order = ascending ? "ASC" : "DESC";
  const rows = await db.getAllAsync<LocalTransaction>(
    `SELECT * FROM transactions ${whereClause} ORDER BY created_at ${order}`,
    params.map((p) => p ?? null), // Ensure no undefined
  );
  return rows;
}

export async function getTotalAmount(
  userId: string | null,
  isGuest: boolean,
  filterType: string = "TODAY",
): Promise<number> {
  const db = await getDb();

  let whereClause = isGuest
    ? `WHERE is_guest = 1`
    : `WHERE user_id = ? AND is_guest = 0`;

  const params: any[] = isGuest ? [] : [userId];

  if (filterType.trim() !== "ALL TIME") {
    const { startDate, endDate } = getDateRange(filterType);
    whereClause += ` AND created_at >= ? AND created_at <= ?`;
    params.push(startDate.toISOString(), endDate.toISOString());
  }

  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions ${whereClause}`,
    params.map((p) => p ?? null),
  );
  return row?.total ?? 0;
}

export async function markTransactionSynced(
  localId: number,
  remoteId: number,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE transactions SET synced = 1, remote_id = ?, user_id = (SELECT user_id FROM transactions WHERE local_id = ?) WHERE local_id = ?`,
    [remoteId ?? null, localId ?? null, localId ?? null],
  );
}

export async function getPendingTransactions(
  userId: string,
): Promise<LocalTransaction[]> {
  const db = await getDb();
  return db.getAllAsync<LocalTransaction>(
    `SELECT * FROM transactions WHERE user_id = ? AND synced = 0 AND is_guest = 0`,
    [userId].map((p) => p ?? null),
  );
}

export async function getGuestTransactions(): Promise<LocalTransaction[]> {
  const db = await getDb();
  return db.getAllAsync<LocalTransaction>(
    `SELECT * FROM transactions WHERE is_guest = 1`,
  );
}

/** Reassign guest transactions to a real user (called after register/login) */
export async function claimGuestTransactions(
  userId: string,
  syncNow: boolean,
): Promise<void> {
  const db = await getDb();
  // Mark as belonging to user, synced=0 so sync service will push them
  await db.runAsync(
    `UPDATE transactions SET user_id = ?, is_guest = 0, synced = ? WHERE is_guest = 1`,
    [userId, syncNow ? 0 : 1].map((p) => p ?? null),
  );
}

/** Upsert a transaction fetched from Supabase (to cache remote data locally) */
export async function upsertTransactionFromRemote(item: {
  transaction_id: number;
  user_id: string;
  title: string;
  amount: number;
  image: string;
  description: string;
  created_at: string;
}): Promise<void> {
  const db = await getDb();
  // Check if already exists by remote_id
  const existing = await db.getFirstAsync<{ local_id: number }>(
    `SELECT local_id FROM transactions WHERE remote_id = ?`,
    [item.transaction_id].map((p) => p ?? null),
  );
  if (existing) {
    await db.runAsync(
      `UPDATE transactions SET title=?, amount=?, image=?, description=?, created_at=?, synced=1 WHERE remote_id=?`,
      [
        item.title,
        item.amount,
        item.image,
        item.description,
        item.created_at,
        item.transaction_id,
      ].map((p) => p ?? null),
    );
  } else {
    await db.runAsync(
      `INSERT INTO transactions (remote_id, user_id, title, amount, image, description, created_at, synced, is_guest)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)`,
      [
        item.transaction_id,
        item.user_id,
        item.title,
        item.amount,
        item.image,
        item.description,
        item.created_at,
      ].map((p) => p ?? null),
    );
  }
}

export async function deleteTransaction(localId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM transactions WHERE local_id = ?`,
    [localId].map((p) => p ?? null),
  );
}

export async function updateTransaction(
  localId: number,
  item: Partial<LocalTransaction>,
): Promise<void> {
  const db = await getDb();
  const keys = Object.keys(item);
  if (keys.length === 0) return; // Nothing to update

  const fields = keys.map((key) => `${key} = ?`).join(", ");
  // Ensure no undefined values are passed to runAsync
  const values = [...keys.map((k) => (item as any)[k] ?? null), localId].map(
    (p) => p ?? null,
  );

  await db.runAsync(
    `UPDATE transactions SET ${fields}, synced = 0 WHERE local_id = ?`,
    values,
  );
}

// ─── Shortcuts ────────────────────────────────────────────────────────────────

export async function insertShortcut(
  item: Omit<LocalShortcut, "local_id">,
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO shortcuts (remote_id, user_id, title, amount, image, description, created_at, synced, is_guest, require_photo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.remote_id ?? null,
      item.user_id,
      item.title,
      item.amount,
      item.image,
      item.description,
      item.created_at,
      item.synced,
      item.is_guest,
      item.require_photo,
    ].map((p) => p ?? null),
  );
  return result.lastInsertRowId;
}

export async function getShortcuts(
  userId: string,
  ascending: boolean = false,
): Promise<LocalShortcut[]> {
  const db = await getDb();
  const order = ascending ? "ASC" : "DESC";
  return db.getAllAsync<LocalShortcut>(
    `SELECT * FROM shortcuts WHERE user_id = ? AND is_guest = 0 ORDER BY created_at ${order}`,
    [userId].map((p) => p ?? null),
  );
}

export async function markShortcutSynced(
  localId: number,
  remoteId: number,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE shortcuts SET synced = 1, remote_id = ? WHERE local_id = ?`,
    [remoteId ?? null, localId ?? null],
  );
}

export async function getPendingShortcuts(
  userId: string,
): Promise<LocalShortcut[]> {
  const db = await getDb();
  return db.getAllAsync<LocalShortcut>(
    `SELECT * FROM shortcuts WHERE user_id = ? AND synced = 0 AND is_guest = 0`,
    [userId].map((p) => p ?? null),
  );
}

export async function upsertShortcutFromRemote(item: {
  shortcut_id: number;
  user_id: string;
  title: string;
  amount: number;
  image: string;
  description: string;
  created_at: string;
}): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ local_id: number }>(
    `SELECT local_id FROM shortcuts WHERE remote_id = ?`,
    [item.shortcut_id].map((p) => p ?? null),
  );
  if (existing) {
    await db.runAsync(
      `UPDATE shortcuts SET title=?, amount=?, image=?, description=?, created_at=?, synced=1 WHERE remote_id=?`,
      [
        item.title,
        item.amount,
        item.image,
        item.description,
        item.created_at,
        item.shortcut_id,
      ].map((p) => p ?? null),
    );
  } else {
    await db.runAsync(
      `INSERT INTO shortcuts (remote_id, user_id, title, amount, image, description, created_at, synced, is_guest)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)`,
      [
        item.shortcut_id,
        item.user_id,
        item.title,
        item.amount,
        item.image,
        item.description,
        item.created_at,
      ].map((p) => p ?? null),
    );
  }
}

export async function deleteShortcut(localId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM shortcuts WHERE local_id = ?`,
    [localId].map((p) => p ?? null),
  );
}

export async function updateShortcut(
  localId: number,
  item: Partial<LocalShortcut>,
): Promise<void> {
  const db = await getDb();
  const keys = Object.keys(item);
  if (keys.length === 0) return;

  const fields = keys.map((key) => `${key} = ?`).join(", ");
  const values = [...keys.map((k) => (item as any)[k] ?? null), localId].map(
    (p) => p ?? null,
  );

  await db.runAsync(
    `UPDATE shortcuts SET ${fields}, synced = 0 WHERE local_id = ?`,
    values,
  );
}

// ─── Date Helpers (shared) ────────────────────────────────────────────────────

export function getDateRange(filterType: string): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  const today = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  let startDate = new Date(today);
  let endDate = new Date(today);
  endDate.setUTCHours(23, 59, 59, 999);

  const filterTrimmed = filterType.trim();

  if (filterTrimmed === "THIS WEEK") {
    const dayOfWeek = today.getUTCDay();
    const diff = today.getUTCDate() - dayOfWeek;
    startDate = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), diff, 0, 0, 0, 0),
    );
    endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 6);
    endDate.setUTCHours(23, 59, 59, 999);
  } else if (filterTrimmed === "THIS MONTH") {
    startDate = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 0, 0, 0, 0),
    );
    endDate = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ),
    );
  } else if (filterTrimmed === "THIS YEAR") {
    startDate = new Date(Date.UTC(today.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
    endDate = new Date(
      Date.UTC(today.getUTCFullYear(), 11, 31, 23, 59, 59, 999),
    );
  }

  return { startDate, endDate };
}
