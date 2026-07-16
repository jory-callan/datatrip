import * as React from 'react'
import {
  IconChevronRight,
  IconClipboardList,
  IconCode,
  IconDatabase,
  IconFileSearch,
  IconFolder,
  IconLayout2,
  IconLayoutDashboard,
  IconLock,
  IconShield,
  IconTable,
  IconUser,
  IconUsers,
  IconWebhook,
} from '@tabler/icons-react'

import { Link, useLocation } from 'react-router-dom'

import { appConfig, getAppVersionText } from '@/config/app-config'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'

type NavItem = {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  url: string
}

type NavGroup = {
  id: string
  title: string
  collapsible?: boolean
  defaultOpen?: boolean
  items: NavItem[]
}

const mainNavItems: NavItem[] = [
  {
    id: 'overview',
    title: '总览',
    icon: IconLayoutDashboard,
    url: '/',
  },
  {
    id: 'sql-workbench',
    title: 'SQL 工作台',
    icon: IconCode,
    url: '/sql-workbench',
  },
  {
    id: 'profile',
    title: '个人中心',
    icon: IconUser,
    url: '/profile',
  },
]

const systemNavItems: NavItem[] = [
  {
    id: 'users',
    title: '用户管理',
    icon: IconUsers,
    url: '/users',
  },
  {
    id: 'roles',
    title: '角色管理',
    icon: IconShield,
    url: '/roles',
  },
  {
    id: 'permissions',
    title: '权限码管理',
    icon: IconLock,
    url: '/permissions',
  },
  {
    id: 'webhooks',
    title: 'Webhook 配置',
    icon: IconWebhook,
    url: '/webhooks',
  },
]

const resourceNavItems: NavItem[] = [
  {
    id: 'datasources',
    title: '数据源管理',
    icon: IconDatabase,
    url: '/datasources',
  },
  {
    id: 'projects',
    title: '项目配置',
    icon: IconFolder,
    url: '/projects',
  },
  {
    id: 'datasource-rules',
    title: '数据源规则',
    icon: IconShield,
    url: '/datasource-rules',
  },
]

const operationsNavItems: NavItem[] = [
  {
    id: 'tickets',
    title: '工单管理',
    icon: IconClipboardList,
    url: '/tickets',
  },
  {
    id: 'escalations',
    title: '提权管理',
    icon: IconShield,
    url: '/escalations',
  },
  {
    id: 'audits',
    title: '审计日志',
    icon: IconFileSearch,
    url: '/audits',
  },
]

function getNavGroups(_username?: string): NavGroup[] {
  const groups: NavGroup[] = [
    {
      id: 'main',
      title: '主菜单',
      items: mainNavItems,
    },
  ]

  groups.push(
    {
      id: 'resources',
      title: '数据基础',
      collapsible: true,
      defaultOpen: true,
      items: resourceNavItems,
    },
    {
      id: 'operations',
      title: '审批管理',
      collapsible: true,
      defaultOpen: true,
      items: operationsNavItems,
    },
    {
      id: 'system',
      title: '系统管理',
      collapsible: true,
      defaultOpen: true,
      items: systemNavItems,
    },
  )

  if (appConfig.testRoutes.enabled) {
    groups.push({
      id: 'test-routes',
      title: '测试路由',
      collapsible: true,
      defaultOpen: false,
      items: [
        {
          id: 'test-data-table',
          title: 'DataTable 测试',
          icon: IconTable,
          url: '/test/data-table',
        },
        {
          id: 'test-layout-overflow',
          title: '布局溢出测试',
          icon: IconLayoutDashboard,
          url: '/test/layout-overflow',
        },
        {
          id: 'test-form-dialog',
          title: 'FormDialog 测试',
          icon: IconLayout2,
          url: '/test/form-dialog',
        },
      ],
    })
  }

  return groups
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const location = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const user = useAppStore((s) => s.user)
  const navGroups = getNavGroups(user?.username)

  const isActive = (url: string) => {
    if (url === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(url)
  }

  const handleMenuItemClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const renderNavItems = (items: NavItem[]) => (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              tooltip={item.title}
              asChild
              isActive={isActive(item.url)}
            >
              <Link to={item.url} onClick={handleMenuItemClick}>
                <Icon className="text-sidebar-primary" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <Link
          to="/"
          onClick={handleMenuItemClick}
          className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-sidebar-accent"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <img src={appConfig.logo} alt="" className="size-6" />
          </span>
          <span className="min-w-0">
            <span className="block truncate bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-base font-semibold text-transparent">
              {appConfig.title}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {getAppVersionText()}
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.id}>
            {group.collapsible ? (
              <Collapsible defaultOpen={group.defaultOpen}>
                <CollapsibleTrigger className="group/collapsible flex h-8 w-full items-center justify-between rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <span>{group.title}</span>
                  <IconChevronRight className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent className="pt-1">
                    {renderNavItems(group.items)}
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <>
                <SidebarGroupLabel className={cn(group.id === 'main' && 'sr-only')}>
                  {group.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  {renderNavItems(group.items)}
                </SidebarGroupContent>
              </>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-1 text-xs text-muted-foreground">
          {getAppVersionText()}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
