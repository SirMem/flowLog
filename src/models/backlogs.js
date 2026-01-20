const { getDb } = require("../config/db");

function mapRow(row) {
  return {
    id: row.id,
    openid: row.openid,
    content: row.content,
    status: row.status,
    estimatedDuration: row.estimated_duration_min ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function insertBacklog({ openid, content, estimatedDuration }) {
  const db = getDb();
  const est =
    typeof estimatedDuration === "number" && Number.isFinite(estimatedDuration)
      ? Math.max(0, Math.floor(estimatedDuration))
      : null;

  const [result] = await db.execute(
    `INSERT INTO backlogs (openid, content, status, estimated_duration_min)
     VALUES (?, ?, 'pending', ?)`,
    [openid, content, est]
  );

  return Number(result.insertId);
}

async function listBacklogs({ openid, status }) {
  const db = getDb();
  const [rows] = await db.execute(
    `SELECT id, openid, content, status, estimated_duration_min, created_at, updated_at
     FROM backlogs
     WHERE openid = ? AND status = ?
     ORDER BY created_at DESC`,
    [openid, status]
  );
  return rows.map(mapRow);
}

async function updateBacklogStatus({ openid, id, status }) {
  const db = getDb();
  const [result] = await db.execute(
    `UPDATE backlogs SET status = ? WHERE id = ? AND openid = ?`,
    [status, id, openid]
  );
  return { updated: result.affectedRows > 0 };
}

async function findBacklogById({ openid, id }) {
  const db = getDb();
  const [rows] = await db.execute(
    `SELECT id, openid, content, status, estimated_duration_min, created_at, updated_at
     FROM backlogs
     WHERE id = ? AND openid = ?
     LIMIT 1`,
    [id, openid]
  );
  if (!rows || rows.length === 0) return null;
  return mapRow(rows[0]);
}

module.exports = {
  insertBacklog,
  listBacklogs,
  updateBacklogStatus,
  findBacklogById,
};

