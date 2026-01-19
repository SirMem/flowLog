function notFound(req, res) {
  res.status(404).json({
    code: 404,
    msg: "Not Found",
    data: null,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Keep details in logs; response stays stable.
  console.error(err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    code: status,
    msg: err.message || "Internal Server Error",
    data: null,
  });
}

module.exports = { notFound, errorHandler };

