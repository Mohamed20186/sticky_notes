/**
 * Comprehensive Express error-handling middleware.
 *
 * Features:
 *  - Custom AppError class for operational errors (bad input, not found, etc.)
 *  - Catches Mongoose validation & cast errors and normalises them
 *  - Catches duplicate-key (code 11000) MongoDB errors
 *  - Catches JSON syntax errors from body-parser / express.json()
 *  - Sends structured JSON responses
 *  - Hides stack traces and internal details in production
 *  - Logs unhandled / programming errors to the console
 */

// ──────────────────────────────────────────────
//  Custom application error
// ──────────────────────────────────────────────

/**
 * Use this class anywhere in your route / service code to throw a
 * known, operational error that should be forwarded to the client.
 *
 * @example
 *   throw new AppError("User not found", 404);
 *   throw new AppError("Email is already taken", 409);
 */
export class AppError extends Error {
  /**
   * @param {string}  message    – Human-readable error message.
   * @param {number}  statusCode – HTTP status code (default 500).
   * @param {object}  [errors]   – Optional field-level error details.
   */
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // trusted error – safe to send to client
    this.errors = errors;

    // Capture a clean stack trace (omits the constructor frame)
    Error.captureStackTrace(this, this.constructor);
  }
}

// ──────────────────────────────────────────────
//  Helper: build error response payload
// ──────────────────────────────────────────────

const isDev = () => process.env.NODE_ENV === "development";

/**
 * Shape the JSON body that is sent to the client.
 */
function buildResponse(err) {
  const body = {
    status: err.status || "error",
    message: err.message,
  };

  if (err.errors) {
    body.errors = err.errors;
  }

  // In development, include the stack trace for easier debugging
  if (isDev()) {
    body.stack = err.stack;
  }

  return body;
}

// ──────────────────────────────────────────────
//  Normalise common third-party / framework errors
// ──────────────────────────────────────────────

/**
 * Mongoose ValidationError  →  422 Unprocessable Entity
 */
function handleMongooseValidationError(err) {
  const errors = Object.entries(err.errors).reduce((acc, [field, detail]) => {
    acc[field] = detail.message;
    return acc;
  }, {});

  return new AppError("Validation failed", 422, errors);
}

/**
 * Mongoose CastError (e.g. invalid ObjectId)  →  400 Bad Request
 */
function handleMongooseCastError(err) {
  return new AppError(`Invalid value "${err.value}" for field "${err.path}"`, 400);
}

/**
 * MongoDB duplicate-key error (code 11000)  →  409 Conflict
 */
function handleDuplicateKeyError(err) {
  const fields = Object.keys(err.keyValue || {});
  const message = fields.length
    ? `Duplicate value for: ${fields.join(", ")}`
    : "Duplicate field value";
  return new AppError(message, 409);
}

/**
 * Malformed JSON in request body  →  400 Bad Request
 */
function handleSyntaxError() {
  return new AppError("Invalid JSON in request body", 400);
}

/**
 * JWT errors (if you add auth later)  →  401 Unauthorized
 */
function handleJwtError() {
  return new AppError("Invalid or expired token. Please log in again.", 401);
}

// ──────────────────────────────────────────────
//  404 catch-all  (use BEFORE the error handler)
// ──────────────────────────────────────────────

/**
 * Mount this middleware after all your routes to catch requests
 * that didn't match any endpoint.
 *
 * @example
 *   app.use(notFoundHandler);
 *   app.use(globalErrorHandler);
 */
export function notFoundHandler(req, _res, next) {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl}`, 404));
}

// ──────────────────────────────────────────────
//  Global error-handling middleware
// ──────────────────────────────────────────────

/**
 * Express error-handling middleware (4-argument signature).
 * Mount this as the **very last** middleware in your app.
 *
 * @example
 *   app.use(globalErrorHandler);
 */
// eslint-disable-next-line no-unused-vars
export function globalErrorHandler(err, _req, res, _next) {
  // Default to 500 if no status code has been set
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // ── Normalise known error types ────────────────────────────
  if (err.name === "ValidationError") {
    err = handleMongooseValidationError(err);
  } else if (err.name === "CastError") {
    err = handleMongooseCastError(err);
  } else if (err.code === 11000) {
    err = handleDuplicateKeyError(err);
  } else if (err.type === "entity.parse.failed" || (err instanceof SyntaxError && err.status === 400)) {
    err = handleSyntaxError();
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    err = handleJwtError();
  }

  // ── Log unexpected (programming) errors ────────────────────
  if (!err.isOperational) {
    console.error("💥 UNEXPECTED ERROR:", err);
  }

  // ── Send response ─────────────────────────────────────────
  // In production, hide details of unexpected errors
  if (!isDev() && !err.isOperational) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again later.",
    });
  }

  return res.status(err.statusCode).json(buildResponse(err));
}

