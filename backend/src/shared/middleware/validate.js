/**
 * Middleware factory for request validation using Zod
 * @param {object} schemas
 * @param {import('zod').ZodSchema} [schemas.body]
 * @param {import('zod').ZodSchema} [schemas.query]
 * @param {import('zod').ZodSchema} [schemas.params]
 */
function validate({ body, query, params }) {
  return async (req, res, next) => {
    try {
      if (body) {
        req.body = await body.parseAsync(req.body);
      }
      if (query) {
        req.query = await query.parseAsync(req.query);
      }
      if (params) {
        req.params = await params.parseAsync(req.params);
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = {
  validate
};
