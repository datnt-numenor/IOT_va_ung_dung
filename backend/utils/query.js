const HttpError = require("./httpError");

function positiveInteger(value, fallback, name, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === undefined || value === "") return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new HttpError(400, `${name} must be an integer from 1 to ${maximum}`);
  }

  return parsed;
}

function enumValue(value, allowed, name, fallback) {
  if (value === undefined || value === "") {
    if (arguments.length >= 4) return fallback;
    throw new HttpError(400, `${name} is required`);
  }
  if (!allowed.includes(value)) {
    throw new HttpError(400, `${name} must be one of: ${allowed.join(", ")}`);
  }
  return value;
}

function parseSort(value, columns, defaultKey, defaultDirection = "DESC") {
  if (!value) return { key: defaultKey, direction: defaultDirection };

  const [key, rawDirection = defaultDirection] = value.split(/[,:]/);
  const direction = rawDirection.toUpperCase();

  if (!Object.hasOwn(columns, key)) {
    throw new HttpError(400, `Unsupported sort field: ${key}`);
  }
  if (!["ASC", "DESC"].includes(direction)) {
    throw new HttpError(400, "Sort direction must be ASC or DESC");
  }

  return { key, direction };
}

function toIsoUtc(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();

  const normalized = String(value).replace(" ", "T");
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(normalized) ? normalized : `${normalized}Z`).toISOString();
}

module.exports = { positiveInteger, enumValue, parseSort, toIsoUtc };
