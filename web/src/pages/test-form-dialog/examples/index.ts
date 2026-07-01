import type { ExampleConfig } from '../types'

import { basicExample } from './basic'
import { collapseExample } from './collapse'
import { errorsExample } from './errors'
import { footerExample } from './footer'
import { groupsExample } from './groups'
import { newRowExample } from './new-row'
import { realisticExample } from './realistic'
import { tabsExample } from './tabs'

export { ExampleHost } from '../example-host'

/**
 * Tab 顺序在这里排。每个示例都是独立文件，添加新示例只需：
 *   1. 新建 examples/xxx.tsx，导出 ExampleConfig
 *   2. 在这里 import 并 push 到数组
 */
export const EXAMPLES: ExampleConfig[] = [
  basicExample,
  groupsExample,
  tabsExample,
  collapseExample,
  newRowExample,
  errorsExample,
  footerExample,
  realisticExample,
]
