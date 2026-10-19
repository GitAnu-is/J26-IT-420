const { z } = require('zod');
const { PUBLIC_REGISTRATION_ROLES, ROLES } = require('../constants/roles');

/**
 * Strong password pattern: at least 8 chars, 1 uppercase, 1 lowercase, 1 digit
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password must not exceed 100 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one digit');

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters long').max(100),
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  password: passwordSchema,
  phoneNumber: z.string().trim().optional().default(''),
  role: z
    .enum(PUBLIC_REGISTRATION_ROLES, {
      errorMap: () => ({
        message: `Self-registration role must be one of: ${PUBLIC_REGISTRATION_ROLES.join(', ')}. ADMIN role cannot be self-assigned.`
      })
    })
    .default(ROLES.FARMER)
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema
};
