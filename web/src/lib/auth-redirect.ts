export const LOGIN_PATH = '/login'
export const LOGGED_IN_HOME_PATH = '/'
export const REDIRECT_PARAM = 'redirect'

interface RouteLocationLike {
  pathname: string
  search?: string
  hash?: string
}

export function getLoggedInHomePath() {
  return LOGGED_IN_HOME_PATH
}

export function getCurrentPath(location: RouteLocationLike) {
  const path = `${location.pathname}${location.search || ''}${location.hash || ''}`
  return path || LOGGED_IN_HOME_PATH
}

export function isSafeRedirectPath(path: string | null | undefined): path is string {
  if (!path) return false
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false
  if (path === LOGIN_PATH || path.startsWith(`${LOGIN_PATH}?`)) return false
  return true
}

export function buildLoginRedirectPath(location: RouteLocationLike) {
  const currentPath = getCurrentPath(location)
  if (!isSafeRedirectPath(currentPath)) return LOGIN_PATH

  const params = new URLSearchParams()
  params.set(REDIRECT_PARAM, currentPath)
  return `${LOGIN_PATH}?${params.toString()}`
}

export function getPostLoginRedirect(search: string) {
  const redirect = new URLSearchParams(search).get(REDIRECT_PARAM)
  return isSafeRedirectPath(redirect) ? redirect : getLoggedInHomePath()
}

export function redirectBrowserToLoginWithCurrentUrl() {
  if (typeof window === 'undefined') return
  if (window.location.pathname === LOGIN_PATH) return
  window.location.href = buildLoginRedirectPath(window.location)
}
