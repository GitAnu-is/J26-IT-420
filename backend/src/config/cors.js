const { env } = require('./env');

/**
 * Dynamic origin validator supporting Web browsers (React) and Mobile applications (Flutter)
 * - Mobile apps (Flutter / Dart HTTP client) usually do not send an Origin header or send 'null'.
 * - Web browsers send standard Origin headers (e.g., http://localhost:5173).
 * - Non-browser API tools (Postman, cURL) do not send an Origin header.
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile Flutter apps, cURL, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = env.ALLOWED_ORIGINS;

    // Check if origin matches allowed origins list or wildcard
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow local development ports dynamically if in development mode
    if (env.NODE_ENV === 'development') {
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalhost) {
        return callback(null, true);
      }
    }

    return callback(new Error(`Origin '${origin}' not allowed by CORS policy`), false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'X-Requested-With',
    'X-Client-Platform',
    'X-Client-Version'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

module.exports = {
  corsOptions
};
