const { getDb } = require("../config/db");
const { safeJsonParse } = require("./_json");

function mapRow(row) {
  return {
    openid: row.openid,
    nickName: row.nick_name || "",
    avatarUrl: row.avatar_url || "",
    currentTitle: row.current_title || "",
    currentTags: safeJsonParse(row.current_tags_json, []),
    tags: safeJsonParse(row.tags_json, []),
    reminderTime: row.reminder_time || null,
    preferences: safeJsonParse(row.preferences_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => String(t).trim())
    .filter(Boolean)
    .slice(0, 50);
}

async function getUserConfig(openid) {
  const db = getDb();
  const [rows] = await db.execute(
    `SELECT
      openid, nick_name, avatar_url,
      current_title, current_tags_json,
      tags_json, reminder_time, preferences_json,
      created_at, updated_at
     FROM user_configs
     WHERE openid = ?
     LIMIT 1`,
    [openid]
  );
  if (!rows || rows.length === 0) return null;
  return mapRow(rows[0]);
}

async function upsertUserConfig(openid, patch) {
  const db = getDb();
  const fields = [];
  const params = [];

  if (typeof patch.nickName === "string") {
    fields.push("nick_name = ?");
    params.push(patch.nickName.slice(0, 64));
  }
  if (typeof patch.avatarUrl === "string") {
    fields.push("avatar_url = ?");
    params.push(patch.avatarUrl.slice(0, 255));
  }
  if (typeof patch.currentTitle === "string") {
    fields.push("current_title = ?");
    params.push(patch.currentTitle.slice(0, 255));
  }
  if (Array.isArray(patch.currentTags)) {
    const tags = parseTags(patch.currentTags);
    fields.push("current_tags_json = ?");
    params.push(tags.length ? JSON.stringify(tags) : null);
  }
  if (Array.isArray(patch.tags)) {
    const tags = parseTags(patch.tags);
    fields.push("tags_json = ?");
    params.push(tags.length ? JSON.stringify(tags) : null);
  }
  if (typeof patch.reminderTime === "string" || patch.reminderTime === null) {
    fields.push("reminder_time = ?");
    params.push(patch.reminderTime);
  }
  if (patch.preferences && typeof patch.preferences === "object") {
    fields.push("preferences_json = ?");
    params.push(JSON.stringify(patch.preferences));
  }

  // If caller passes nothing, still ensure row exists (so /me always returns openid).
  if (fields.length === 0) {
    await db.execute(
      `INSERT INTO user_configs (openid) VALUES (?) ON DUPLICATE KEY UPDATE openid = openid`,
      [openid]
    );
    return;
  }

  // MySQL 5.7 upsert.
  await db.execute(
    `INSERT INTO user_configs (openid) VALUES (?) 
     ON DUPLICATE KEY UPDATE ${fields.join(", ")}`,
    [openid, ...params]
  );
}

module.exports = {
  getUserConfig,
  upsertUserConfig,
};

