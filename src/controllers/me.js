const { getUserConfig, upsertUserConfig } = require("../models/userConfigs");

function ok(res, data) {
  return res.json({ code: 0, msg: "success", data });
}

async function getMe(req, res, next) {
  try {
    const openid = req.user.openid;
    const cfg = await getUserConfig(openid);
    if (!cfg) {
      // Ensure the row exists for future writes.
      await upsertUserConfig(openid, {});
      return ok(res, {
        openid,
        nickName: "",
        avatarUrl: "",
        currentTitle: "",
        currentTags: [],
        tags: [],
        reminderTime: null,
        preferences: {},
      });
    }
    return ok(res, cfg);
  } catch (err) {
    next(err);
  }
}

async function putMe(req, res, next) {
  try {
    const openid = req.user.openid;
    const body = req.body || {};
    await upsertUserConfig(openid, {
      nickName: typeof body.nickName === "string" ? body.nickName : undefined,
      avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl : undefined,
      currentTitle:
        typeof body.currentTitle === "string" ? body.currentTitle : undefined,
      currentTags: Array.isArray(body.currentTags) ? body.currentTags : undefined,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      reminderTime:
        typeof body.reminderTime === "string" || body.reminderTime === null
          ? body.reminderTime
          : undefined,
      preferences:
        body.preferences && typeof body.preferences === "object"
          ? body.preferences
          : undefined,
    });
    return ok(res, { updated: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, putMe };

