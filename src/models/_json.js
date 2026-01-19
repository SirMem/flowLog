function safeJsonParse(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "object") return value; // mysql2 may return object depending on config
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

module.exports = { safeJsonParse };

