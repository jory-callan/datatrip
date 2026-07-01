import { IconStack2 } from '@tabler/icons-react'

import { FormDialog, FormField, FormGroup } from '@/components/common/form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import type { ExampleConfig, ExampleProps } from '../types'

function GroupsExample({ open, setOpen }: ExampleProps) {
  return (
    <FormDialog
      open={open} onOpenChange={setOpen}
      title="新增项目"
      description="项目是资源/工单/审批的容器"
      maxWidthClass="sm:max-w-3xl"
      footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={() => setOpen(false)}>保存</Button>
        </>
      }
    >
      <FormGroup title="基本信息" description="项目的展示与归属">
        <FormField label="项目名称" required>
          <Input placeholder="例如：订单中台" />
        </FormField>
        <FormField label="项目编码" required>
          <Input placeholder="例如：order-hub" />
        </FormField>
        <FormField label="负责人" required>
          <Select>
            <SelectTrigger><SelectValue placeholder="选择负责人" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">张三</SelectItem>
              <SelectItem value="2">李四</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="所属部门">
          <Input placeholder="选填" />
        </FormField>
        <FormField label="项目描述" span={2}>
          <Textarea rows={2} />
        </FormField>
      </FormGroup>

      <FormGroup title="审批配置" description="SQL 工单的审批流程">
        <FormField label="是否启用审批" required>
          <Select>
            <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">启用</SelectItem>
              <SelectItem value="no">不启用</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="审批人">
          <Select>
            <SelectTrigger><SelectValue placeholder="选择审批人" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">王五</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="超时自动通过" span={2} hint="超过指定小时数未审批则自动通过">
          <Input type="number" placeholder="24" />
        </FormField>
      </FormGroup>
    </FormDialog>
  )
}

export const groupsExample: ExampleConfig = {
  key: 'groups',
  label: '卡片分组',
  icon: IconStack2,
  description: '多个 FormGroup 拆分逻辑段落',
  Component: GroupsExample,
  snippet: `// span 默认 1（半行），span={2} 跨整行
<FormDialog ...>
  <FormGroup title="基本信息" description="项目的展示与归属">
    <FormField label="项目名称" required><Input /></FormField>
    <FormField label="项目编码" required><Input /></FormField>
    <FormField label="负责人" required>
      <Select>...</Select>
    </FormField>
    <FormField label="所属部门"><Input /></FormField>
    <FormField label="项目描述" span={2}><Textarea rows={2} /></FormField>
  </FormGroup>

  <FormGroup title="审批配置" description="SQL 工单的审批流程">
    <FormField label="是否启用审批" required>...</FormField>
    <FormField label="审批人">...</FormField>
    <FormField label="超时自动通过" span={2} hint="...">
      <Input type="number" />
    </FormField>
  </FormGroup>
</FormDialog>`,
}
