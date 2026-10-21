const { z } = require('zod');

const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters long').max(100).optional(),
    phoneNumber: z.string().trim().max(30).optional()
  })
  .strict('Unrecognized or unauthorized fields in profile update payload. Role and email cannot be updated here.');

module.exports = {
  updateProfileSchema
};
