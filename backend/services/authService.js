const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const HttpError = require("../utils/httpError");

const BCRYPT_ROUNDS = 10;
const MAX_USERNAME_LENGTH = 50;
const MAX_PASSWORD_LENGTH = 128;
const MIN_SECRET_LENGTH = 16;
const SESSION_TTL = "8h";
const REMEMBER_TTL = "7d";
const INVALID_CREDENTIALS = "Tên đăng nhập hoặc mật khẩu không đúng";
// Hash giả để so sánh khi không có người dùng, giữ thời gian phản hồi gần như nhau.
const DUMMY_HASH = bcrypt.hashSync("dummy-password", BCRYPT_ROUNDS);

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters`);
  }
  return secret;
}

// Gọi khi khởi động để backend dừng ngay nếu thiếu cấu hình, thay vì lỗi ở lần đăng nhập đầu tiên.
function assertConfigured() {
  getSecret();
}

// Mật khẩu cũ trong seed được lưu bằng SHA2(…, 256) dạng hex; chấp nhận một lần rồi nâng cấp lên bcrypt.
function isLegacySha256(hash) {
  return /^[0-9a-f]{64}$/i.test(hash);
}

async function verifyPassword(password, hash) {
  if (isLegacySha256(hash)) {
    const actual = Buffer.from(crypto.createHash("sha256").update(password).digest("hex"));
    const expected = Buffer.from(hash.toLowerCase());
    return { ok: crypto.timingSafeEqual(actual, expected), needsRehash: true };
  }
  return { ok: await bcrypt.compare(password, hash), needsRehash: false };
}

function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

function signToken(user, { remember = false } = {}) {
  return jwt.sign({ username: user.username, role: user.role }, getSecret(), {
    subject: String(user.id),
    expiresIn: remember ? REMEMBER_TTL : SESSION_TTL,
  });
}

// Trả về { id, username, role } hoặc ném lỗi nếu token sai, hết hạn hoặc thiếu cấu hình.
// Token cấp trước khi có phân quyền không mang role nên bị từ chối, buộc đăng nhập lại.
function verifyToken(token) {
  const payload = jwt.verify(token, getSecret());
  if (!payload.role) throw new Error("Token has no role");
  return { id: Number(payload.sub), username: payload.username, role: payload.role };
}

function publicUser(row) {
  return { id: row.id, username: row.username, fullName: row.full_name, role: row.role };
}

async function login({ username, password, remember }) {
  if (
    typeof username !== "string" || typeof password !== "string"
    || !username.trim() || !password
    || username.length > MAX_USERNAME_LENGTH || password.length > MAX_PASSWORD_LENGTH
  ) {
    throw new HttpError(401, INVALID_CREDENTIALS);
  }

  const [[row]] = await db.execute(
    "SELECT id, username, password_hash, full_name, role FROM users WHERE username = ?",
    [username.trim()],
  );
  const { ok, needsRehash } = row
    ? await verifyPassword(password, row.password_hash)
    : { ok: await bcrypt.compare(password, DUMMY_HASH).then(() => false), needsRehash: false };
  if (!ok) throw new HttpError(401, INVALID_CREDENTIALS);

  if (needsRehash) {
    await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", [await hashPassword(password), row.id]);
  }

  const user = publicUser(row);
  return { token: signToken(user, { remember: Boolean(remember) }), user };
}

async function getUser(id) {
  const [[row]] = await db.execute("SELECT id, username, full_name, role FROM users WHERE id = ?", [id]);
  return row ? publicUser(row) : null;
}

module.exports = {
  assertConfigured, isLegacySha256, verifyPassword, hashPassword, signToken, verifyToken, login, getUser,
};
