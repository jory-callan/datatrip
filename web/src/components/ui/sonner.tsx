import { Toaster as Sonner, type ToasterProps } from 'sonner'

import { useTheme } from '@/components/theme-provider'

const Toaster = ({ ...props }: ToasterProps) => {
  const { actualTheme } = useTheme()

  return (
    <Sonner
      theme={actualTheme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          error: '[&_svg]:!text-red-500',
          success: '[&_svg]:!text-green-500',
          warning: '[&_svg]:!text-amber-500',
          info: '[&_svg]:!text-blue-500',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
