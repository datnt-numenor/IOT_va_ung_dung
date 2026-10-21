const authService = require("../services/authService");
const rateLimit = require("../utils/loginRateLimit");
const HttpError = require("../utils/httpError");

async function login(req, res) {
  const key = req.ip;
  rateLimit.assertAllowed(key);

  try {
    const result = await authService.login({
      username: req.body?.username,
      password: req.body?.password,
      remember: req.body?.remember,
    });
    rateLimit.reset(key);
    res.json(result);
  } catch (error) {
    if (error.status === 401) rateLimit.recordFailure(key);
    throw error;
  }
}

async function me(req, res) {
  const user = await authService.getUser(req.user.id);
  if (!user) throw new HttpError(401, "Account no longer exists");
  res.json({ user });
}

module.exports = { login, me };
