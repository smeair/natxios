/**
 * Validates req.body / req.query / req.params with a zod schema.
 * On success the parsed (trimmed, coerced, unknown-keys-stripped) data is on req.valid[part].
 */
export function validate(schema, part = 'body', message = 'Please check your input and try again.') {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[part] ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: message,
        fields: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    req.valid = { ...(req.valid || {}), [part]: parsed.data };
    return next();
  };
}
