const {
  insertCard,
  listCardsByDate,
  findCardById,
  updateCardFields,
  deleteCardById,
} = require("../models/cards");

function ok(res, data) {
  return res.json({ code: 0, msg: "success", data });
}

function getDateStrFromTs(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => String(t).trim())
    .filter(Boolean)
    .slice(0, 50);
}

async function createCard(req, res, next) {
  try {
    const { content, insight, nextPlan, startTime, endTime, mood, tags, dateStr } =
      req.body || {};

    if (!content || !nextPlan || !startTime || !endTime) {
      return res.status(400).json({
        code: 400,
        msg: "Missing required fields: content/nextPlan/startTime/endTime",
        data: null,
      });
    }

    const startMs = Number(startTime);
    const endMs = Number(endTime);
    if (!(startMs > 0 && endMs > 0 && endMs >= startMs)) {
      return res.status(400).json({
        code: 400,
        msg: "Invalid startTime/endTime",
        data: null,
      });
    }

    const durationMin = Math.floor((endMs - startMs) / 60000);
    const safeDateStr = dateStr || getDateStrFromTs(startMs);

    const id = await insertCard({
      openid: req.user.openid,
      content: String(content).trim(),
      insight: insight ? String(insight) : "",
      mood: typeof mood === "number" ? mood : 3,
      nextPlan: String(nextPlan).trim(),
      startTimeMs: startMs,
      endTimeMs: endMs,
      durationMin,
      tags: parseTags(tags),
      dateStr: safeDateStr,
    });

    return ok(res, { id, duration: durationMin });
  } catch (err) {
    next(err);
  }
}

async function getCards(req, res, next) {
  try {
    const { date } = req.query || {};
    if (!date) {
      return res.status(400).json({
        code: 400,
        msg: "Missing query param: date",
        data: null,
      });
    }

    const cards = await listCardsByDate({
      openid: req.user.openid,
      dateStr: String(date),
    });

    // Response keeps the same shape as mock: startTime/endTime are ms timestamps.
    return ok(res, cards.map((c) => ({
      id: c.id,
      content: c.content,
      insight: c.insight,
      mood: c.mood,
      startTime: c.startTime,
      endTime: c.endTime,
      duration: c.duration,
      tags: c.tags,
      dateStr: c.dateStr,
    })));
  } catch (err) {
    next(err);
  }
}

async function updateCard(req, res, next) {
  try {
    const { id } = req.params;
    const patch = req.body || {};

    const cardId = Number(id);
    if (!cardId) {
      return res.status(400).json({ code: 400, msg: "Invalid id", data: null });
    }

    const result = await updateCardFields({
      openid: req.user.openid,
      id: cardId,
      insight: typeof patch.insight === "string" ? patch.insight : undefined,
      mood: typeof patch.mood === "number" ? patch.mood : undefined,
      tags: Array.isArray(patch.tags) ? parseTags(patch.tags) : undefined,
    });

    if (!result.changed) {
      const exists = await findCardById({ openid: req.user.openid, id: cardId });
      if (!exists) {
        return res
          .status(404)
          .json({ code: 404, msg: "Card not found", data: null });
      }
      // No changes provided, but card exists.
      return ok(res, { updated: false });
    }

    return ok(res, { updated: true });
  } catch (err) {
    next(err);
  }
}

async function deleteCard(req, res, next) {
  try {
    const { id } = req.params;
    const cardId = Number(id);
    if (!cardId) {
      return res.status(400).json({ code: 400, msg: "Invalid id", data: null });
    }

    const result = await deleteCardById({ openid: req.user.openid, id: cardId });
    if (!result.deleted) {
      return res.status(404).json({ code: 404, msg: "Card not found", data: null });
    }
    return ok(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createCard, getCards, updateCard, deleteCard };

