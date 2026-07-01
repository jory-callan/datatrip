import { LogOut, Settings, ShieldCheck, UserRound, Users } from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type CurrentUser, useAppStore } from '@/stores/app-store'

function getUserDisplayName(user: CurrentUser | null) {
  return user?.nickname || user?.username || 'User'
}

function getUserInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function UserMenu() {

  const navigate = useNavigate()
  const user = useAppStore((state) => state.user)
  const clearAuth = useAppStore((state) => state.clearAuth)
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)

  const displayName = getUserDisplayName(user)
  const fallback = getUserInitials(displayName) || 'U'

  const logout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-hidden ring-ring transition-[box-shadow] focus-visible:ring-2" aria-label={'用户菜单'}>
        <Avatar>
          <AvatarImage src="" alt={displayName} />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.role_code || '暂无邮箱'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <UserRound />
          {'个人中心'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/users')}>
          <Users />
          {'用户管理'}
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Settings />
          {'设置'}
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <ShieldCheck />
          {isAuthenticated() ? '已鉴权' : '未鉴权'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={logout}>
          <LogOut />
          {'退出登录'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
