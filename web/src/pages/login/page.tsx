
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useLogin } from './use-login'

export function LoginPage() {

  const { username, password, error, isPending, setUsername, setPassword, handleSubmit } = useLogin()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{'登录'}</CardTitle>
          <CardDescription>{'输入账号密码进入系统'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">{'用户名'}</Label>
              <Input
                id="username"
                type="text"
                placeholder={'请输入用户名'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{'密码'}</Label>
              <Input
                id="password"
                type="password"
                placeholder={'请输入密码'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? '加载中...' : '登录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
