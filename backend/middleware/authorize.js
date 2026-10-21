const HttpError = require("../utils/httpError");

const ROLES = { ADMIN: "admin", VIEWER: "viewer" };

// Phân quyền: chạy sau `authenticate`; chỉ cho phép các vai trò được liệt kê, ngược lại trả 403.
function authorize(...allowedRoles) {
  return function checkRole(req, res, next) {
    if (!req.user) return next(new HttpError(401, "Authentication required"));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new HttpError(403, "Bạn không có quyền thực hiện thao tác này"));
    }
    return next();
  };
}

module.exports = { authorize, ROLES };
