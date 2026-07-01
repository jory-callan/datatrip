import { useState } from 'react'

import { IconBuildingBank, IconPlugConnected } from '@tabler/icons-react'

import { FormDialog, FormField, FormGroup } from '@/components/common/form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import type { ExampleConfig, ExampleProps } from '../types'

function RealisticExample({ open, setOpen }: ExampleProps) {
  const [editing, setEditing] = useState(false)
  return (
    <FormDialog
      open={open} onOpenChange={setOpen}
      title={
        <span className="flex items-center gap-2">
          <IconBuildingBank className="size-5 text-primary" />
          {editing ? '编辑数据源' : '新增数据源'}
        </span>
      }
      description={editing ? '修改数据库连接信息' : '添加一个新的数据库连接'}
      footer={
        <>
          {editing ? (
            <Button variant="outline" onClick={() => setOpen(false)}>
              <IconPlugConnected className="size-4" /> 测试连接
            </Button>
          ) : null}
          <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={() => { setOpen(false); setEditing(true) }}>
            {editing ? '保存' : '保存并继续编辑'}
          </Button>
        </>
      }
    >
      <FormGroup title="基本信息" description="数据源的展示信息和分类">
        <FormField label="名称" required>
          <Input placeholder="例如：订单库主库" />
        </FormField>
        <FormField label="类型" required>
          <Select defaultValue="mysql">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mysql">mysql</SelectItem>
              <SelectItem value="postgresql">postgresql</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="备注" span={2}>
          <Textarea rows={2} />
        </FormField>
      </FormGroup>

      <FormGroup title="连接配置" description="数据库的连接信息">
        <FormField label="主机" required>
          <Input placeholder="127.0.0.1" />
        </FormField>
        <FormField label="端口" required>
          <Input type="number" placeholder="3306" />
        </FormField>
        <FormField label="数据库" hint="选填，留空可连接后选择">
          <Input placeholder="orders" />
        </FormField>
        <FormField label="用户名" required>
          <Input autoComplete="off" />
        </FormField>
        <FormField label="密码" span={2} required={!editing} hint={editing ? '留空则保持原密码不变' : undefined}>
          <Input type="password" autoComplete="new-password" />
        </FormField>
      </FormGroup>
    </FormDialog>
  )
}

export const realisticExample: ExampleConfig = {
  key: 'realistic',
  label: '实战：数据源',
  icon: IconBuildingBank,
  description: '完整的真实业务表单',
  Component: RealisticExample,
  snippet: `// 完整业务示例：数据源管理
// 包含：图标、描述、卡片分组、必填/提示、动态 footer
<FormDialog
  title={
    <span className="flex items-center gap-2">
      <IconBuildingBank className="size-5 text-primary" />
      {editing ? '编辑数据源' : '新增数据源'}
    </span>
  }
  description={editing ? '修改连接信息' : '添加新的数据库连接'}
  footer={
    <>
      {editing && (
        <Button variant="outline"><IconPlugConnected /> 测试连接</Button>
      )}
      <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
      <Button onClick={...}>保存</Button>
    </>
  }
>
  <FormGroup title="基本信息" description="数据源的展示信息和分类">
    <FormField label="名称" required><Input /></FormField>
    <FormField label="类型" required>
      <Select defaultValue="mysql">...</Select>
    </FormField>
    <FormField label="备注" span={2}><Textarea rows={2} /></FormField>
  </FormGroup>
  <FormGroup title="连接配置" description="数据库的连接信息">
    <FormField label="主机" required><Input /></FormField>
    <FormField label="端口" required><Input type="number" /></FormField>
    <FormField label="数据库" hint="选填"><Input /></FormField>
    <FormField label="用户名" required><Input /></FormField>
    <FormField label="密码" span={2} required={!editing}
                hint={editing ? '留空则保持原密码不变' : undefined}>
      <Input type="password" />
    </FormField>
  </FormGroup>
</FormDialog>`,
}
