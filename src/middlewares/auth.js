function getOpenId(req) {
  // WeChat Cloud Run injects this header.
  const openid = req.headers["x-wx-openid"];
  if (typeof openid === "string" && openid.trim()) return openid.trim();

  // Local dev fallback (do NOT use in production).
  if (process.env.NODE_ENV !== "production") {
    const devOpenid =
      req.headers["x-dev-openid"] || process.env.DEV_OPENID || "dev-openid";
    if (typeof devOpenid === "string" && devOpenid.trim())
      return devOpenid.trim();
  }

  return "";
}

function requireOpenId(req, res, next) {
  const openid = getOpenId(req);
  if (!openid) {
    // Matches README "鉴权错误码定义"
    return res.status(401).json({
      code: 40100,
      msg: "Missing x-wx-openid header",
      data: null,
    });
  }
  req.user = { openid };
  next();
}

module.exports = { requireOpenId };

