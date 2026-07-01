export const appConfig = {
  title: 'React Friday Lite',
  version: 'v1.0.0',
  gitCommit: __APP_GIT_COMMIT__,
  logo: '/icon.svg',
  testRoutes: {
    // 默认开发模式启用，生产构建关闭；用户可通过 VITE_ENABLE_TEST_ROUTES 覆盖。
    enabled: import.meta.env.VITE_ENABLE_TEST_ROUTES
      ? import.meta.env.VITE_ENABLE_TEST_ROUTES === 'true'
      : import.meta.env.DEV,
  },
} as const

export function getAppVersionText() {
  return `${appConfig.version} - ${appConfig.gitCommit}`
}
