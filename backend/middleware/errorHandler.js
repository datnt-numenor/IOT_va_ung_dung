function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const status = error.status || 500;
  if (status >= 500) console.error(error);

  const response = { message: status >= 500 ? "Internal server error" : error.message };
  if (error.details !== undefined) response.details = error.details;
  res.status(status).json(response);
}

module.exports = { notFound, errorHandler };
