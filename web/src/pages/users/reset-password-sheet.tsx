import { useState } from 'react'
import { IconEye, IconEyeOff, IconKey, IconRefresh, IconUser } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { useUsersStore } from './store'

interface Props {
  resetPwdValue: string
  resetPwdConfirm: string
  onResetPwdValueChange: (v: string) => void
  onResetPwdConfirmChange: (v: string) => void
  onSave: () => void
  isPending: boolean
  generateRandomPassword: () => string
}

function PasswordInput({
  value, onChange, placeholder, autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex gap-2">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
        autoFocus={autoFocus}
      />
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 size-9 p-0"
        onClick={() => setShow(!show)}
        type="button"
        title={show ? '隐藏密码' : '显示密码'}
      >
        {show ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
      </Button>
    </div>
  )
}

export function ResetPasswordSheet({
  resetPwdValue,
  resetPwdConfirm,
  onResetPwdValueChange,
  onResetPwdConfirmChange,
  onSave,
  isPending,
  generateRandomPassword,
}: Props) {
  const { resetPwdOpen, resetPwdState, closeResetPwd } = useUsersStore()

  const valid =
    resetPwdValue &&
    resetPwdConfirm &&
    resetPwdValue === resetPwdConfirm &&
    resetPwdValue.length >= 6

  return (
    <Sheet open={resetPwdOpen} onOpenChange={(open) => { if (!open) closeResetPwd() }}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <IconKey className="size-5 text-primary" />
            重置密码
          </SheetTitle>
        </SheetHeader>

        <div className="px-6 pt-4">
          <div className="rounded-md border bg-muted/30 px-3 py-2.5 space-y-0.5">
            <div className="flex items-center gap-2 text-sm">
              <IconUser className="size-4 text-muted-foreground shrink-0" />
              <span className="font-medium">{resetPwdState.username}</span>
              {resetPwdState.nickname && (
                <span className="text-muted-foreground">（{resetPwdState.nickname}）</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 w-full"
              onClick={() => {
                const pwd = generateRandomPassword()
                onResetPwdValueChange(pwd)
                onResetPwdConfirmChange(pwd)
              }}
            >
              <IconRefresh className="size-4" />
              随机生成 16 位密码
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">新密码 <span className="text-destructive">*</span></label>
              <PasswordInput
                value={resetPwdValue}
                onChange={onResetPwdValueChange}
                placeholder="输入新密码"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">确认新密码 <span className="text-destructive">*</span></label>
              <PasswordInput
                value={resetPwdConfirm}
                onChange={onResetPwdConfirmChange}
                placeholder="再次输入新密码"
              />
            </div>
            {resetPwdValue && resetPwdConfirm && resetPwdValue !== resetPwdConfirm && (
              <p className="text-xs text-destructive">两次密码输入不一致</p>
            )}
            {resetPwdValue && resetPwdValue.length < 6 && (
              <p className="text-xs text-destructive">密码长度至少 6 位</p>
            )}
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="ghost" size="sm" onClick={() => closeResetPwd()}>
            取消
          </Button>
          <Button size="sm" onClick={onSave} disabled={isPending || !valid}>
            {isPending ? '重置中…' : '确认重置'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
