const authService = require("../services/authService");
const HttpError = require("../utils/httpError");

// Yêu cầu header `Authorization: Bearer <token>`; gắn { id, username } vào req.user.
function authenticate(req, res, next) {
  const [scheme, token] = (req.header("authorization") || "").split(" ");
  if (scheme !== "Bearer" || !token) return next(new HttpError(401, "Authentication required"));

  try {
    req.user = authService.verifyToken(token);
    return next();
  } catch {
    return next(new HttpError(401, "Invalid or expired token"));
  }
}

module.exports = authenticate;
