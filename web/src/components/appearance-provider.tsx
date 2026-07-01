import { useMemo, type ReactNode } from 'react'

import { ThemeProvider, useTheme } from './theme-provider'

type AppearanceProviderProps = {
  children: ReactNode
  defaultTheme?: 'dark' | 'light' | 'system'
  themeStorageKey?: string
}

export function AppearanceProvider({
  children,
  defaultTheme = 'system',
  themeStorageKey = 'vite-ui-theme',
}: AppearanceProviderProps) {
  return (
    <ThemeProvider defaultTheme={defaultTheme} storageKey={themeStorageKey}>
      {children}
    </ThemeProvider>
  )
}

export function useAppearance() {
  const { theme, actualTheme, setTheme } = useTheme()
  return useMemo(
    () => ({
      theme,
      actualTheme,
      setTheme,
    }),
    [theme, actualTheme, setTheme]
  )
}
