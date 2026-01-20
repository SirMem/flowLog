const {
  insertBacklogV2,
  listBacklogs,
  updateBacklogStatus,
  findBacklogById,
  updateBacklogFields,
} = require("../models/backlogs");

function ok(res, data) {
  return res.json({ code: 0, msg: "success", data });
}

function bad(res, msg) {
  return res.status(400).json({ code: 400, msg, data: null });
}

async function createBacklog(req, res, next) {
  try {
    const { content, tags, estimatedDuration } = req.body || {};
    const text = String(content || "").trim();
    if (!text) return bad(res, "Missing required field: content");

    const id = await insertBacklogV2({
      openid: req.user.openid,
      content: text.slice(0, 255),
      tags: Array.isArray(tags) ? tags : undefined,
      estimatedDuration:
        typeof estimatedDuration === "number" ? estimatedDuration : undefined,
    });

    return ok(res, { id });
  } catch (err) {
    next(err);
  }
}

async function getBacklogs(req, res, next) {
  try {
    const status = String((req.query && req.query.status) || "pending");
    if (!["pending", "done", "deleted"].includes(status)) {
      return bad(res, "Invalid status");
    }

    const rows = await listBacklogs({ openid: req.user.openid, status });
    return ok(res, rows.map((r) => ({
      id: r.id,
      content: r.content,
      tags: r.tags,
      status: r.status,
      estimatedDuration: r.estimatedDuration,
      createdAt: r.createdAt,
    })));
  } catch (err) {
    next(err);
  }
}

async function patchBacklog(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) return bad(res, "Invalid id");

    const { status } = req.body || {};
    const nextStatus = String(status || "");
    if (!["done", "deleted"].includes(nextStatus)) {
      return bad(res, "Only status='done' or 'deleted' is supported");
    }

    const result = await updateBacklogStatus({
      openid: req.user.openid,
      id,
      status: nextStatus,
    });

    if (!result.updated) {
      const exists = await findBacklogById({ openid: req.user.openid, id });
      if (!exists) {
        return res
          .status(404)
          .json({ code: 404, msg: "Backlog not found", data: null });
      }
      // Exists but no change (already done)
      return ok(res, { updated: false });
    }

    return ok(res, { updated: true });
  } catch (err) {
    next(err);
  }
}

async function updateBacklog(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) return bad(res, "Invalid id");

    const body = req.body || {};
    const update = {
      openid: req.user.openid,
      id,
      content: typeof body.content === "string" ? body.content : undefined,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      estimatedDuration:
        typeof body.estimatedDuration === "number" ? body.estimatedDuration : undefined,
    };

    const result = await updateBacklogFields(update);
    if (!result.updated) {
      const exists = await findBacklogById({ openid: req.user.openid, id });
      if (!exists) {
        return res
          .status(404)
          .json({ code: 404, msg: "Backlog not found", data: null });
      }
      return ok(res, { updated: false });
    }
    return ok(res, { updated: true });
  } catch (err) {
    next(err);
  }
}

async function deleteBacklog(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) return bad(res, "Invalid id");
    const result = await updateBacklogStatus({
      openid: req.user.openid,
      id,
      status: "deleted",
    });
    if (!result.updated) {
      return res.status(404).json({ code: 404, msg: "Backlog not found", data: null });
    }
    return ok(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBacklog,
  getBacklogs,
  patchBacklog,
  updateBacklog,
  deleteBacklog,
};
