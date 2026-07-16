import { useState } from 'react'
import { IconCheck, IconKey, IconUser } from '@tabler/icons-react'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useUpdateProfile } from '@/lib/api/auth'
import { useAppStore } from '@/stores/app-store'

import { useProfile } from './use-profile'

export function ProfilePage() {

  const { currentUser, isLoading, refetch } = useProfile()
  const setUser = useAppStore((state) => state.setUser)

  const mutation = useUpdateProfile()

  // Nickname form
  const [nickname, setNickname] = useState('')
  const [showNicknameForm, setShowNicknameForm] = useState(false)

  // Password form
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const handleNicknameSave = async () => {
    if (!nickname.trim()) return
    try {
      const user = await mutation.mutateAsync({ nickname: nickname.trim() })
      setUser(user)
      setShowNicknameForm(false)
      toast.success('个人资料已更新')
      void refetch()
    } catch {
      toast.error('个人资料更新失败')
    }
  }

  const handlePasswordSave = async () => {
    if (newPassword.length < 6) {
      toast.error('密码至少 6 位')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次密码输入不一致')
      return
    }
    try {
      const user = await mutation.mutateAsync({ password: newPassword })
      setUser(user)
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
      toast.success('密码已更新')
      void refetch()
    } catch {
      toast.error('个人资料更新失败')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{'个人中心'}</h1>
        <p className="text-sm text-muted-foreground">{'当前登录用户信息'}</p>
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconUser className="size-5 text-primary" />
              {'基本信息'}
            </CardTitle>
            <CardDescription>{'您的账户详情'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-6 w-full" />
              ))}
            </div>
          ) : currentUser ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-[120px_1fr]">
              <dt className="text-muted-foreground">{'ID'}</dt>
              <dd>{currentUser.id}</dd>
              <dt className="text-muted-foreground">{'用户名'}</dt>
              <dd>{currentUser.username}</dd>
              <dt className="text-muted-foreground">{'昵称'}</dt>
              <dd className="flex items-center gap-2">
                {showNicknameForm ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder={currentUser.nickname || currentUser.username}
                      className="h-8 w-48"
                    />
                    <Button size="sm" onClick={handleNicknameSave} disabled={mutation.isPending}>
                      <IconCheck className="size-3.5" />
                      {'保存'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowNicknameForm(false)}>
                      {'取消'}
                    </Button>
                  </div>
                ) : (
                  <>
                    <span>{currentUser.nickname || '-'}</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => { setNickname(currentUser.nickname || ''); setShowNicknameForm(true) }}>
                      {'编辑'}
                    </Button>
                  </>
                )}
              </dd>
              <dt className="text-muted-foreground">{'状态'}</dt>
              <dd>{currentUser.status || '-'}</dd>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">{'暂无用户信息'}</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Reset password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconKey className="size-5 text-primary" />
            {'重置密码'}
          </CardTitle>
          <CardDescription>{'修改您的登录密码'}</CardDescription>
        </CardHeader>
        <CardContent>
          {showPasswordForm ? (
            <div className="max-w-sm space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="new-password">{'新密码'}</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={'请输入新密码'}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">{'确认密码'}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={'请再次输入新密码'}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handlePasswordSave} disabled={mutation.isPending}>
                  {mutation.isPending ? '加载中...' : '保存'}
                </Button>
                <Button variant="ghost" onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword('') }}>
                  {'取消'}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
              <IconKey className="size-4" />
              {'修改密码'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
