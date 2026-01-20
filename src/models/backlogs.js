const { getDb } = require("../config/db");
const { safeJsonParse } = require("./_json");

function mapRow(row) {
  return {
    id: row.id,
    openid: row.openid,
    content: row.content,
    tags: safeJsonParse(row.tags_json, []),
    status: row.status,
    estimatedDuration: row.estimated_duration_min ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => String(t).trim())
    .filter(Boolean)
    .slice(0, 20);
}

async function insertBacklog({ openid, content, estimatedDuration }) {
  const db = getDb();
  const est =
    typeof estimatedDuration === "number" && Number.isFinite(estimatedDuration)
      ? Math.max(0, Math.floor(estimatedDuration))
      : null;

  const [result] = await db.execute(
    `INSERT INTO backlogs (openid, content, tags_json, status, estimated_duration_min)
     VALUES (?, ?, ?, 'pending', ?)`,
    [openid, content, null, est]
  );

  return Number(result.insertId);
}

async function insertBacklogV2({ openid, content, tags, estimatedDuration }) {
  const db = getDb();
  const est =
    typeof estimatedDuration === "number" && Number.isFinite(estimatedDuration)
      ? Math.max(0, Math.floor(estimatedDuration))
      : null;
  const tagsJson = tags && tags.length ? JSON.stringify(parseTags(tags)) : null;

  const [result] = await db.execute(
    `INSERT INTO backlogs (openid, content, tags_json, status, estimated_duration_min)
     VALUES (?, ?, ?, 'pending', ?)`,
    [openid, content, tagsJson, est]
  );
  return Number(result.insertId);
}

async function listBacklogs({ openid, status }) {
  const db = getDb();
  const [rows] = await db.execute(
    `SELECT id, openid, content, tags_json, status, estimated_duration_min, created_at, updated_at
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
    `SELECT id, openid, content, tags_json, status, estimated_duration_min, created_at, updated_at
     FROM backlogs
     WHERE id = ? AND openid = ?
     LIMIT 1`,
    [id, openid]
  );
  if (!rows || rows.length === 0) return null;
  return mapRow(rows[0]);
}

async function updateBacklogFields({ openid, id, content, tags, estimatedDuration }) {
  const db = getDb();
  const sets = [];
  const params = [];

  if (typeof content === "string") {
    sets.push("content = ?");
    params.push(content.slice(0, 255));
  }
  if (Array.isArray(tags)) {
    const parsed = parseTags(tags);
    sets.push("tags_json = ?");
    params.push(parsed.length ? JSON.stringify(parsed) : null);
  }
  if (typeof estimatedDuration === "number" && Number.isFinite(estimatedDuration)) {
    sets.push("estimated_duration_min = ?");
    params.push(Math.max(0, Math.floor(estimatedDuration)));
  }

  if (sets.length === 0) return { updated: false };
  params.push(id, openid);
  const [result] = await db.execute(
    `UPDATE backlogs SET ${sets.join(", ")} WHERE id = ? AND openid = ?`,
    params
  );
  return { updated: result.affectedRows > 0 };
}

module.exports = {
  insertBacklog,
  insertBacklogV2,
  listBacklogs,
  updateBacklogStatus,
  findBacklogById,
  updateBacklogFields,
};
