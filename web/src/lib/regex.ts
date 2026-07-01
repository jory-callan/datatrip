import { test, BuiltinTypes } from 'regex-center'

/**
 * Generic field validation using regex-center built-in patterns
 * Returns error message or null (when valid)
 */
export function validateField(
  field: 'email' | 'username' | 'password',
  value: string,
): string | null {
  if (!value) return null // skip empty (handled by required separately)

  switch (field) {
    case 'email':
      return test(BuiltinTypes.EMAIL, value)
        ? null
        : '邮箱格式不正确'
    default:
      return null
  }
}
