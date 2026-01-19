const { getDb } = require("../config/db");
const { safeJsonParse } = require("./_json");

function mapCardRow(row) {
  return {
    id: row.id,
    openid: row.openid,
    content: row.content,
    insight: row.insight || "",
    mood: row.mood,
    nextPlan: row.next_plan,
    startTime: Number(row.start_time_ms),
    endTime: Number(row.end_time_ms),
    duration: row.duration_min,
    tags: safeJsonParse(row.tags_json, []),
    dateStr: row.date_str,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function insertCard({
  openid,
  content,
  insight,
  mood,
  nextPlan,
  startTimeMs,
  endTimeMs,
  durationMin,
  tags,
  dateStr,
}) {
  const db = getDb();

  const tagsJson = tags && tags.length ? JSON.stringify(tags) : null;

  const [result] = await db.execute(
    `INSERT INTO cards
      (openid, content, insight, mood, next_plan,
       start_time_ms, end_time_ms, duration_min,
       tags_json, date_str)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      openid,
      content,
      insight,
      mood,
      nextPlan,
      startTimeMs,
      endTimeMs,
      durationMin,
      tagsJson,
      dateStr,
    ]
  );

  return Number(result.insertId);
}

async function listCardsByDate({ openid, dateStr }) {
  const db = getDb();
  const [rows] = await db.execute(
    `SELECT
      id, openid, content, insight, mood, next_plan,
      start_time_ms, end_time_ms, duration_min, tags_json, date_str,
      created_at, updated_at
     FROM cards
     WHERE openid = ? AND date_str = ?
     ORDER BY start_time_ms ASC`,
    [openid, dateStr]
  );
  return rows.map(mapCardRow);
}

async function findCardById({ openid, id }) {
  const db = getDb();
  const [rows] = await db.execute(
    `SELECT
      id, openid, content, insight, mood, next_plan,
      start_time_ms, end_time_ms, duration_min, tags_json, date_str,
      created_at, updated_at
     FROM cards
     WHERE id = ? AND openid = ?
     LIMIT 1`,
    [id, openid]
  );
  if (!rows || rows.length === 0) return null;
  return mapCardRow(rows[0]);
}

async function updateCardFields({ openid, id, insight, mood, tags }) {
  const db = getDb();
  const sets = [];
  const params = [];

  if (typeof insight === "string") {
    sets.push("insight = ?");
    params.push(insight);
  }
  if (typeof mood === "number") {
    sets.push("mood = ?");
    params.push(mood);
  }
  if (Array.isArray(tags)) {
    sets.push("tags_json = ?");
    params.push(tags.length ? JSON.stringify(tags) : null);
  }

  if (sets.length === 0) return { changed: false };

  params.push(id, openid);
  const [result] = await db.execute(
    `UPDATE cards SET ${sets.join(", ")} WHERE id = ? AND openid = ?`,
    params
  );

  return { changed: result.affectedRows > 0 };
}

async function deleteCardById({ openid, id }) {
  const db = getDb();
  const [result] = await db.execute(
    `DELETE FROM cards WHERE id = ? AND openid = ?`,
    [id, openid]
  );
  return { deleted: result.affectedRows > 0 };
}

module.exports = {
  insertCard,
  listCardsByDate,
  findCardById,
  updateCardFields,
  deleteCardById,
};

