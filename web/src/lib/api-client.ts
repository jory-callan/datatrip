import { FetchError, ofetch } from 'ofetch'
import { toast } from 'sonner'

import { redirectBrowserToLoginWithCurrentUrl } from '@/lib/auth-redirect'
import { useAppStore } from '@/stores/app-store'

export const API_BASE_URL = '/api/v1'

export interface ApiResponse<T> {
  code: number
  msg?: string
  message?: string
  data: T
}

export class ApiError extends Error {
  code: number
  status: number
  data?: unknown

  constructor(message: string, options: { code: number; status: number; data?: unknown }) {
    super(message)
    this.name = 'ApiError'
    this.code = options.code
    this.status = options.status
    this.data = options.data
  }
}

function getErrorMessage(body: unknown, fallback: string) {
  if (body && typeof body === 'object') {
    const data = body as { msg?: unknown; message?: unknown }
    if (typeof data.msg === 'string' && data.msg) return data.msg
    if (typeof data.message === 'string' && data.message) return data.message
  }
  return fallback
}

function redirectToLogin() {
  useAppStore.getState().clearAuth()
  redirectBrowserToLoginWithCurrentUrl()
}

export const apiClient = ofetch.create({
  baseURL: API_BASE_URL,
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  onRequest({ options }) {
    const headers = new Headers(options.headers)
    const token = useAppStore.getState().token
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    options.headers = headers
  },
  onResponse({ response }) {
    const body = response._data as ApiResponse<unknown> | unknown
    if (body && typeof body === 'object' && 'code' in body) {
      const apiBody = body as ApiResponse<unknown>
      if (apiBody.code !== 0) {
        const msg = getErrorMessage(apiBody, 'Request failed')
        toast.error(msg)
        throw new ApiError(msg, {
          code: apiBody.code,
          status: response.status,
          data: apiBody.data,
        })
      }
      response._data = apiBody.data
    }
  },
  onResponseError({ response }) {
    const body = response._data as ApiResponse<unknown> | unknown
    const code = body && typeof body === 'object' && 'code' in body
      ? Number((body as ApiResponse<unknown>).code)
      : response.status
    const message = getErrorMessage(body, response.statusText || 'Request failed')

    if (response.status === 401) {
      redirectToLogin()
      return
    }

    toast.error(message)

    throw new ApiError(message, {
      code,
      status: response.status,
      data: body && typeof body === 'object' && 'data' in body
        ? (body as ApiResponse<unknown>).data
        : body,
    })
  },
})

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof FetchError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}
