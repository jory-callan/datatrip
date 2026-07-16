import { DataTable } from '@/components/data-table'
import { Card, CardContent } from '@/components/ui/card'
import { USER_PAGE_SIZE_OPTIONS } from '@/lib/api/users'

import { AssignRolesSheet } from './assign-roles-sheet'
import { useUserColumns } from './columns'
import { ResetPasswordSheet } from './reset-password-sheet'
import { UserCreateSheet } from './user-create-sheet'
import { UserEditSheet } from './user-edit-sheet'
import { useUsersStore } from './store'
import { useUsersPage } from './use-users'

export function UsersPage() {
  const store = useUsersStore()

  const {
    page, setPage, pageSize, setPageSize,
    usersQuery, data, refetch,
    createUser, updateUser, deleteUser,
    handleCreate, handleUpdate, handleDelete, handleBatchDelete,
    openEdit, openResetPassword, openAssignRoles,
    // Reset Password
    resetPwdValue, setResetPwdValue,
    resetPwdConfirm, setResetPwdConfirm,
    handleResetPassword,
    generateRandomPassword,
    // Assign Roles
    allRoles,
    assignRoleIds,
    handleAssignRole, handleUnassignRole,
    assignRolePending, unassignRolePending,
    selectedRolePermissionDetails,
    assignRoleSearch, setAssignRoleSearch,
  } = useUsersPage()

  const columns = useUserColumns(
    openEdit,
    openResetPassword,
    openAssignRoles,
    handleDelete,
    updateUser.isPending,
    deleteUser.isPending,
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2 shrink-0">
        <h1 className="text-lg font-bold tracking-tight">用户管理</h1>
        <span className="text-xs text-muted-foreground">管理系统用户账号和基本信息</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.list ?? []}
            loading={usersQuery.isFetching}
            emptyText="暂无用户"
            enableRowSelection
            getRowId={(row) => String(row.id)}
            toolbar={{
              searchPlaceholder: '搜索用户...',
              createLabel: '新增用户',
              deleteLabel: '批量删除',
              onCreate: () => store.setCreateOpen(true),
              onRefresh: () => { void refetch() },
              onBatchDelete: handleBatchDelete,
            }}
            pagination={{
              page, pageSize,
              total: data?.total ?? 0,
              needCount: true,
              pageSizeOptions: USER_PAGE_SIZE_OPTIONS,
              onPageChange: setPage,
              onPageSizeChange: (nextPageSize) => { setPageSize(nextPageSize); setPage(1) },
            }}
          />
        </CardContent>
      </Card>

      <UserCreateSheet onSave={handleCreate} isPending={createUser.isPending} />
      <UserEditSheet onSave={handleUpdate} isPending={updateUser.isPending} />
      <ResetPasswordSheet
        resetPwdValue={resetPwdValue}
        resetPwdConfirm={resetPwdConfirm}
        onResetPwdValueChange={setResetPwdValue}
        onResetPwdConfirmChange={setResetPwdConfirm}
        onSave={handleResetPassword}
        isPending={updateUser.isPending}
        generateRandomPassword={generateRandomPassword}
      />
      <AssignRolesSheet
        allRoles={allRoles}
        assignRoleIds={assignRoleIds}
        assignRoleSearch={assignRoleSearch}
        onAssignRoleSearchChange={setAssignRoleSearch}
        onAssignRole={handleAssignRole}
        onUnassignRole={handleUnassignRole}
        assignRolePending={assignRolePending}
        unassignRolePending={unassignRolePending}
        selectedRolePermissionDetails={selectedRolePermissionDetails}
      />
    </div>
  )
}
