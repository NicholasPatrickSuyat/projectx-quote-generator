import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password";
import { USER_ROLES } from "@/types/user";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
  );

export const optionalPasswordSchema = z.union([
  z.literal(""),
  passwordSchema,
]);

export const userRoleSchema = z.enum(USER_ROLES);

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, "Full name is required.")
  .max(200, "Full name is too long.");

export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const createUserInputSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  role: userRoleSchema,
  active: z.boolean(),
  password: passwordSchema,
});

export const updateUserInputSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  role: userRoleSchema,
  active: z.boolean(),
  /** Empty string means keep existing password. */
  password: optionalPasswordSchema,
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
