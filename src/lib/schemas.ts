import { z } from 'zod'
import { ENVIRONMENTS, FINDING_STATUSES } from '@/types/domain'

/**
 * Validation schemas shared by the forms (client side, inline errors) and the mock API (server side).
 * One definition means the UI and the "backend" can never disagree about what is valid.
 */

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .email('That email is not valid. Check for typos.'),
  password: z.string().min(1, 'Enter your password.').min(8, 'Passwords are at least 8 characters.'),
})
export type LoginValues = z.infer<typeof loginSchema>

const httpUrl = z
  .string()
  .trim()
  .min(1, 'Enter the website address to scan.')
  .refine((value) => {
    try {
      const url = new URL(value)
      return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.')
    } catch {
      return false
    }
  }, 'Use a full URL with http:// or https://, for example https://shop.example.com')

/** Builds the target form schema. In edit mode a blank password keeps the stored one. */
export function targetFormSchema(mode: 'create' | 'edit') {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'Give the website a name of at least 2 characters.')
        .max(60, 'Keep the name under 60 characters.'),
      url: httpUrl,
      environment: z.enum(ENVIRONMENTS, { message: 'Choose an environment.' }),
      authenticated: z.boolean(),
      username: z.string().trim(),
      password: z.string(),
    })
    .superRefine((value, ctx) => {
      if (!value.authenticated) return
      if (!value.username) {
        ctx.addIssue({
          code: 'custom',
          path: ['username'],
          message: 'Enter the username the scanner logs in with.',
        })
      }
      if (mode === 'create' && !value.password) {
        ctx.addIssue({ code: 'custom', path: ['password'], message: 'Enter the password for that account.' })
      }
    })
}
export type TargetFormValues = z.infer<ReturnType<typeof targetFormSchema>>

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters.').max(60, 'Keep it under 60 characters.'),
  email: z.string().trim().min(1, 'Enter an email.').email('That email is not valid.'),
  role: z.string().trim().min(2, 'Enter your role.').max(40, 'Keep it under 40 characters.'),
})
export type ProfileValues = z.infer<typeof profileSchema>

export const findingStatusSchema = z.enum(FINDING_STATUSES)

/** Shape the API accepts for POST and PATCH /api/targets. */
export const targetPayloadSchema = z.object({
  name: z.string().trim().min(2).max(60),
  url: httpUrl,
  environment: z.enum(ENVIRONMENTS),
  authenticated: z.boolean(),
  credentials: z.object({ username: z.string().min(1), password: z.string() }).optional(),
})
