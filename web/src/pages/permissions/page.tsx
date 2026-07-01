import { IconCheck, IconUser } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { ROLE_CODES } from './constants'
import { usePermissionConfig } from './use-permission-config'

export function PermissionConfigPage() {

  const {
    search, setSearch,
    selectedUser, setSelectedUser,
    filteredUsers, usersLoading,
    handleRoleChange, updatePending,
  } = usePermissionConfig()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{'权限配置'}</h1>
        <p className="text-sm text-muted-foreground">{'为用户分配系统角色'}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[300px_1fr]">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">{'用户列表'}</CardTitle>
            <CardDescription>
              {`共 ${filteredUsers.length} 个用户`}
            </CardDescription>
            <Input
              placeholder={'搜索用户...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CardHeader>
          <CardContent className="max-h-[480px] overflow-y-auto p-0">
            {usersLoading ? (
              <div className="flex flex-col gap-2 px-6 pb-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">{'暂无匹配用户'}</p>
            ) : (
              <div className="flex flex-col gap-1 px-3 pb-3">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                      selectedUser?.id === user.id && 'bg-accent'
                    )}
                    onClick={() => setSelectedUser(user)}
                  >
                    <IconUser className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate flex-1">{user.nickname || user.username}</span>
                    {user.role_code && (
                      <Badge variant="outline" className="shrink-0 font-mono text-xs">
                        {user.role_code}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedUser
                ? `为 ${selectedUser.nickname || selectedUser.username} 分配角色`
                : '请选择用户'}
            </CardTitle>
            <CardDescription>
              {selectedUser ? '在左侧选择一个用户来配置角色' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{'角色'}:</span>
                  <Select
                    value={selectedUser.role_code ?? ''}
                    onValueChange={(value) => { void handleRoleChange(Number(selectedUser.id), value) }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_CODES.map((rc) => (
                        <SelectItem key={rc.value} value={rc.value}>
                          {rc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  <IconCheck className="size-3 inline mr-1" />
                  {updatePending ? '加载中...' : '已保存'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{'在左侧选择一个用户来配置角色'}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
